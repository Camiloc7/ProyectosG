import { RUTA } from "@/helpers/rutas";
import { create } from "zustand";
import toast from "react-hot-toast";
import { IFormCuentas } from "@/features/cuentas/FormCuentas";
import { useAuthStore } from "./authStore";

type CuentasState = {
  loading: boolean;
  cuentas: IFormCuentas[];
  traerCuentas: () => Promise<void>;
  eliminarCuenta: (id: string) => Promise<void>;
  crearCuenta: (data: IFormCuentas) => Promise<void>;
  actualizarCuenta: (data: IFormCuentas) => Promise<void>;
};

export const useCuentasStore = create<CuentasState>((set, get) => ({
  loading: false,
  cuentas: [],

  traerCuentas: async () => {
    set({ loading: true });
    const token = useAuthStore.getState().token;

    try {
      const res = await fetch(`${RUTA}/cuentas-bancarias`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message);
      }
      set({
        cuentas: responseData.data,
        loading: false,
      });
    } catch (error: any) {
      const mensajeDev = "Fecth cuentas fallido";
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
      set({
        loading: false,
      });
    }
  },

  crearCuenta: async (data) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    const { id, codigo_puc, ...cuentaSinBasura } = data;
    console.warn("RAW PARA CREAR: ", cuentaSinBasura);
    try {
      const res = await fetch(`${RUTA}/cuentas-bancarias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cuentaSinBasura),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message);
      }
      await get().traerCuentas();

      toast.success("Cuenta creada exitosamente");

      set({ loading: false });
    } catch (error: any) {
      const mensajeDelDev = "No se pudo crear la cuenta";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
    }
  },

  actualizarCuenta: async (data) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    const { id, codigo_puc, medio_pago_asociado_id, ...cuentaSinBasura } = data;
    console.warn("RAW PARA ACTUALIZAR: ", cuentaSinBasura);
    try {
      const res = await fetch(`${RUTA}/cuentas-bancarias/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cuentaSinBasura),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message);
      }
      await get().traerCuentas();

      toast.success("Cuenta actualizada exitosamente");

      set({ loading: false });
    } catch (error: any) {
      const mensajeDelDev = "No se pudo actualizar la cuenta";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
    }
  },
  eliminarCuenta: async (id: string) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;

    try {
      const res = await fetch(`${RUTA}/cuentas-bancarias/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      await get().traerCuentas();
      toast.success("Categoría eliminada exitosamente.");
      set({ loading: false });
    } catch (error: any) {
      const mensajeDev = "Delete cuentas fallido";
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
      set({ loading: false });
    }
  },
}));
