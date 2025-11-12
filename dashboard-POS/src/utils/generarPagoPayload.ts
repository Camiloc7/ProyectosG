// src/utils/generarPayloadPago.ts

interface DatosPagoOpcional {
  direccion: string;
  telefono: string;
  nota: string;
  dv: string;
}

interface Params {
  pedidoId: string;
  idx: number;
  division: DatosPagoOpcional;
  total: number;
  esEfectivo: boolean;
  cuentaId?: string;
  denominacionesEfectivo?: Record<number, number>;
}

export const generarPayloadPago = async ({
  pedidoId,
  idx,
  division,
  total,
  esEfectivo,
  cuentaId,
  denominacionesEfectivo,
}: Params): Promise<any | null> => {
  // Sacamos la data que se haya guardado en el disco de forma segura
  let respaldoUnico = null;
  let respaldoDividido = null;

  // --- Refactorización: Usar localStorage en lugar de la API de Electron ---
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const respaldoUnicoStr = window.localStorage.getItem(
        `respaldo_unico_${pedidoId}`
      );
      if (respaldoUnicoStr) {
        respaldoUnico = JSON.parse(respaldoUnicoStr);
      }

      const respaldoDivididoStr = window.localStorage.getItem(
        `respaldo_dividido_${pedidoId}`
      );
      if (respaldoDivididoStr) {
        respaldoDividido = JSON.parse(respaldoDivididoStr);
      }
    } catch (error) {
      console.error("Error al recuperar datos de localStorage:", error);
      return null; // En caso de error, no continuar.
    }
  } else {
    // En un entorno de servidor de Next.js, localStorage no está disponible.
    console.error("localStorage no está disponible en este entorno.");
    return null;
  }
  // -------------------------------------------------------------------------

  let data;
  if (respaldoUnico) {
    data = respaldoUnico;
  } else if (respaldoDividido) {
    data = respaldoDividido.pagos?.[idx];
  }

  if (!data) return null;

  // Armamos el payload
  const payload: any = {
    pedido_id: respaldoUnico?.pedido_id || respaldoDividido?.pedido_id,
    numero_documento: data.numero_documento || "",
    nombre_completo: data.nombre_completo || "",
    correo_electronico: data.correo_electronico || "",
    tipo_documento: data.tipo_documento || "",
    direccion: division.direccion || "",
    telefono: division.telefono || "",
    DV: division.dv || "",
    descuentos: respaldoUnico?.descuento || respaldoDividido?.descuento || 0,
    propina: Number(data.propina) || 0,
    notas: division.nota || "",
    monto_pagado: total,
    es_efectivo: esEfectivo,
  };

  if (esEfectivo) {
    payload.denominaciones_efectivo = denominacionesEfectivo || {};
  } else {
    payload.cuenta_id = cuentaId || "";
  }

  return {
    payload,
    respaldoKey: respaldoUnico
      ? `respaldo_unico_${pedidoId}`
      : `respaldo_dividido_${pedidoId}`,
    respaldoObj: respaldoUnico || respaldoDividido,
    idx,
  };
};
