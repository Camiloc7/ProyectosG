// src/store/comprasStore.ts

import { create } from "zustand";
import toast from "react-hot-toast";
import { RUTA } from "@/helpers/rutas";
import { useAuthStore } from "./authStore";

export type ICompra = {
  id: string;
  establecimiento_id: string;
  ingrediente_id: string;
  proveedor_id: string;
  cantidad_comprada: number;
  unidad_medida_compra: string;
  costo_unitario_compra: number;
  costo_total: number;
  fecha_compra: string;
  numero_factura?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
  ingrediente: {
    id: string;
    nombre: string;
    unidad_medida: string;
    stock_actual: number;
    stock_minimo: number;
    costo_unitario: number;
    volumen_por_unidad: number;
    observaciones: string;
    created_at: string;
    updated_at: string;
  };
  proveedor: {
    id: string;
    nombre: string;
    nit: string;
    contacto?: string;
    telefono?: string;
    email?: string;
    created_at: string;
    updated_at: string;
  };
};

export type ICreateCompraFormData = {
  ingrediente_id: string;
  proveedor_id: string;
  cantidad_comprada: number;
  unidad_medida_compra: string;
  costo_unitario_compra: number;
  numero_factura?: string;
  notas?: string;
};

type ComprasState = {
  loading: boolean;
  compras: ICompra[];
  traerCompras: () => Promise<void>;
  crearCompra: (data: ICreateCompraFormData) => Promise<boolean>;
};

function limpiarDecimalesCompra(compra: any): ICompra {
  const camposConDecimales = [
    "cantidad_comprada",
    "costo_unitario_compra",
    "costo_total",
    "stock_actual",
    "stock_minimo",
    "costo_unitario",
    "volumen_por_unidad",
  ];
  const copia = { ...compra };

  for (const campo of camposConDecimales) {
    if (typeof copia[campo] === "string" && copia[campo].includes(".")) {
      copia[campo] = parseFloat(copia[campo]);
    }
    if (copia.ingrediente && typeof copia.ingrediente[campo] === "string" && copia.ingrediente[campo].includes(".")) {
      copia.ingrediente[campo] = parseFloat(copia.ingrediente[campo]);
    }
  }

  return copia;
}

export const useComprasStore = create<ComprasState>((set, get) => ({
  loading: false,
  compras: [],

  traerCompras: async () => {
    set({ loading: true });
    const token = useAuthStore.getState().token;

    try {
      const res = await fetch(`${RUTA}/compras`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Error al traer las compras.");
      }
      
      const comprasLimpias = responseData.data.map(limpiarDecimalesCompra);
      const comprasOrdenadas = comprasLimpias.sort(
        (a: ICompra, b: ICompra) => new Date(b.fecha_compra).getTime() - new Date(a.fecha_compra).getTime()
      );
      set({ compras: comprasOrdenadas, loading: false });
    } catch (error: any) {
      const mensajeDelDev = "No se pudo traer las compras.";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
    }
  },

  crearCompra: async (data) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;

    try {
      const res = await fetch(`${RUTA}/compras`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "Error al crear la compra.");
      }

      await get().traerCompras();
      toast.success(responseData.message || "Compra registrada exitosamente.");
      return true; // <-- Esto es clave
    } catch (error: any) {
      const mensajeDelDev = "No se pudo crear la compra.";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      return false; // <-- Y esto
    } finally {
      set({ loading: false });
    }
  },
}));