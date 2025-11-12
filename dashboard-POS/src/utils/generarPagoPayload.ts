import { calculateTip } from "@/helpers/CalculateTip";
import { IItemsPedidos } from "@/types/models";

interface DatosPagoOpcional {
  direccion: string;
  telefono: string;
  nota: string;
}

interface Params {
  pedidoId: string;
  idDivision: string;
  division: DatosPagoOpcional;
  esEfectivo: boolean;
  cuentaId?: string;
  denominacionesEfectivo?: Record<number, number>;
}

export const calcularTotalDivision = (
  items: IItemsPedidos[],
  tipPercent = 0,
  tipEnabled = true,
  descuento = 0
) => {
  const subtotal = items.reduce((sum, it) => sum + it.precio * it.cantidad, 0);
  const subtotalConDescuento = subtotal * (1 - descuento / 100);
  const { totalWithTip, tipAmount } = calculateTip(
    subtotalConDescuento,
    tipPercent,
    tipEnabled
  );
  return { subtotal, subtotalConDescuento, tipAmount, totalWithTip };
};

export const generarPayloadPago = async ({
  pedidoId,
  idDivision,
  division,
  esEfectivo,
  cuentaId,
  denominacionesEfectivo,
}: Params): Promise<any | null> => {
  const respaldoKey = `respaldo_${pedidoId}`;
  const respaldoStr = localStorage.getItem(respaldoKey);
  if (!respaldoStr) return null;

  const respaldo = JSON.parse(respaldoStr);
  if (!respaldo) return null;

  // ------------------- CASO: CUENTAS DIVIDIDAS -------------------
  if (Array.isArray(respaldo.divisiones) && respaldo.divisiones.length > 0) {
    const data = respaldo.divisiones.find((p: any) => p.id === idDivision);
    if (!data) return null;

    const baseAmount =
      data.customAmount ??
      data.items.reduce(
        (sum: number, it: any) => sum + it.precio * it.cantidad,
        0
      );

    const subtotalConDescuento =
      baseAmount * (1 - (respaldo.descuento ?? 0) / 100);
    const { tipAmount } = calculateTip(
      subtotalConDescuento,
      data.tipPercent ?? 0,
      data.tipEnabled ?? true
    );

    const payload: any = {
      pedido_id: pedidoId,
      numero_documento: data.cedula || "",
      nombre_completo: data.name || "",
      correo_electronico: data.correo || "",
      tipo_documento: data.docType || "",
      direccion: division.direccion || "",
      telefono: division.telefono || "",
      DV: data.DV || "", // ✅ ahora el DV viene del respaldo, no del argumento
      descuentos: respaldo?.descuento,
      propina: tipAmount,
      notas: division.nota || "",
      monto_pagado: subtotalConDescuento, // ✅ considera customAmount
      es_efectivo: esEfectivo,
    };

    if (esEfectivo) {
      payload.denominaciones_efectivo = denominacionesEfectivo || {};
    } else {
      payload.cuenta_id = cuentaId || "";
    }

    return payload;
  }

  // ------------------- CASO: DIVISIÓN SIMPLE -------------------
  if (respaldo.singleDivision && respaldo.singleDivision.id === idDivision) {
    const data = respaldo.singleDivision;
    const items = respaldo.pedido?.pedidoItems || [];

    const subtotal = items.reduce(
      (sum: number, it: any) => sum + it.precio * it.cantidad,
      0
    );

    const subtotalConDescuento =
      subtotal * (1 - (respaldo.descuento || 0) / 100);

    const { tipAmount } = calculateTip(
      subtotalConDescuento,
      data.tipPercent ?? 0,
      data.tipEnabled ?? true
    );

    const payload: any = {
      pedido_id: pedidoId,
      numero_documento: data.cedula || "",
      nombre_completo: data.name || "",
      correo_electronico: data.correo || "",
      tipo_documento: data.docType || "",
      direccion: division.direccion || "",
      telefono: division.telefono || "",
      DV: data.DV || "", // ✅ DV obtenido del respaldo.localStorage
      descuentos: respaldo?.descuento,
      propina: tipAmount,
      notas: division.nota || "",
      monto_pagado: subtotalConDescuento,
      es_efectivo: esEfectivo,
    };

    if (esEfectivo) {
      payload.denominaciones_efectivo = denominacionesEfectivo || {};
    } else {
      payload.cuenta_id = cuentaId || "";
    }

    return payload;
  }

  return null;
};
