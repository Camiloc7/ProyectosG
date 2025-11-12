import { create } from "zustand";
import toast from "react-hot-toast";
import { RUTA } from "@/helpers/rutas";
import { useAuthStore } from "./authStore";

export type DenominacionData = {
  [key: string]: number;
};

export interface CajaData {
  id: string;
  establecimiento_id: string;
  usuario_cajero_id: string;
  fecha_hora_apertura: string;
  fecha_hora_cierre: string | null;
  saldo_inicial_caja: string;
  saldo_final_contado: string;
  total_ventas_brutas: string;
  total_descuentos: string;
  total_impuestos: string;
  total_propina: string;
  total_neto_ventas: string;
  total_pagos_efectivo: string;
  total_pagos_tarjeta: string;
  total_pagos_otros: string;
  total_recaudado: string;
  diferencia_caja: string;
  cerrado: boolean;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
  denominaciones_apertura: DenominacionData;
  denominaciones_cierre: DenominacionData | null;
}
export type IDataParaAperturaDeCaja = {
  denominaciones_apertura: DenominacionData;
};
export type IDataParaCierreDeCaja = {
  denominaciones_cierre: DenominacionData;
  observaciones?: string;
};

type CajaState = {
  loading: boolean;
  cajaActiva: CajaData | null;
  cierresDeCaja: CajaData[];
  aperturaDeCaja: (data: IDataParaAperturaDeCaja) => Promise<void>;
  cierreDeCaja: (data: IDataParaCierreDeCaja) => Promise<void>;
  traerCajaActiva: () => Promise<void>;
  traerCierresDeCaja: (establecimientoId?: string, usuarioCajeroId?: string, fechaInicio?: string, fechaFin?: string) => Promise<void>;
  traerCierrePorId: (id: string) => Promise<CajaData | null>;
};

const getTokenFromStore = () => {
  return useAuthStore.getState().token;
};

export const useCajaStore = create<CajaState>((set) => ({
  loading: false,
  cajaActiva: null,
  cierresDeCaja: [],

  aperturaDeCaja: async (data) => {
    set({ loading: true });
    try {
      const token = getTokenFromStore();
      const res = await fetch(`${RUTA}/cierres-caja/apertura`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Error al abrir la caja.");
      }
      set({ cajaActiva: responseData.data, loading: false });
      toast.success(responseData.message);
    } catch (error: any) {
      toast.error(error.message);
      set({ loading: false });
    }
  },

  cierreDeCaja: async (data) => {
    set({ loading: true });
    try {
      const token = getTokenFromStore();
      const res = await fetch(`${RUTA}/cierres-caja/cierre`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Error al cerrar la caja.");
      }
      set({ cajaActiva: null, loading: false });
      toast.success(responseData.message);
    } catch (error: any) {
      toast.error(error.message);
      set({ loading: false });
    }
  },

  traerCajaActiva: async () => {
    set({ loading: true });
    try {
      const token = getTokenFromStore();
      const res = await fetch(`${RUTA}/cierres-caja/activo`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 204) {
        set({ cajaActiva: null, loading: false });
        return;
      }

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Error al verificar caja activa.");
      }

      set({ cajaActiva: responseData.data, loading: false });
    } catch (error: any) {
      toast.error(error.message);
      set({ loading: false });
    }
  },

  traerCierresDeCaja: async (establecimientoId, usuarioCajeroId, fechaInicio, fechaFin) => {
    set({ loading: true });
    try {
      const token = getTokenFromStore();
      const url = new URL(`${RUTA}/cierres-caja`);
      if (establecimientoId) url.searchParams.append("establecimientoId", establecimientoId);
      if (usuarioCajeroId) url.searchParams.append("usuarioCajeroId", usuarioCajeroId);
      if (fechaInicio) url.searchParams.append("fechaInicio", fechaInicio);
      if (fechaFin) url.searchParams.append("fechaFin", fechaFin);

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Error al obtener cierres de caja.");
      }
      set({ cierresDeCaja: responseData.data, loading: false });
    } catch (error: any) {
      toast.error(error.message);
      set({ loading: false });
    }
  },

  traerCierrePorId: async (id: string) => {
    set({ loading: true });
    try {
      const token = getTokenFromStore();
      const res = await fetch(`${RUTA}/cierres-caja/${id}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await res.json();
      if (!res.ok) {
        if (res.status === 404) {
          toast.error(responseData.message || "Cierre de caja no encontrado.");
          set({ loading: false });
          return null;
        }
        throw new Error(responseData.message || "Error al obtener detalles del cierre.");
      }
      set({ loading: false });
      return responseData.data;
    } catch (error: any) {
      toast.error(error.message);
      set({ loading: false });
      return null;
    }
  },
}));

