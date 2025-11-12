import { RUTA } from "@/helpers/rutas";
import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./authStore";
import { handleApiResponse } from "@/helpers/handleApiResponse";
import { IImpresora } from "@/app/configuracion/page";

type ImpresoraState = {
  loading: boolean;
  impresoras: IImpresora[];
  traerImpresoras: () => Promise<void>;
  crearImpresora: (nueva: Partial<IImpresora>) => Promise<void>;
  actualizarImpresora: (
    cambios: Partial<IImpresora>,
    id: number | string
  ) => Promise<void>;
  eliminarImpresora: (id: number | string) => Promise<void>;
  // imprimirComanda: (pedidoId: string) => Promise<void>;
};

export const useImpresoraStore = create<ImpresoraState>((set, get) => ({
  loading: false,
  impresoras: [],

  // === READ ===
  traerImpresoras: async () => {
    set({ loading: true });
    const token = useAuthStore.getState().token;

    try {
      const res = await fetch(`${RUTA}/impresoras`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await handleApiResponse({
        backResponse: res,
        mensajeDeFallo: "No se pudo traer las impresoras",
        debugg: false,
      });

      set({
        impresoras: responseData.data,
        loading: false,
      });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al traer impresoras");
    } finally {
      set({ loading: false });
    }
  },

  // === CREATE ===
  crearImpresora: async (nueva) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;

    try {
      const res = await fetch(`${RUTA}/impresoras`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(nueva),
      });

      const responseData = await handleApiResponse({
        backResponse: res,
        mensajeDeFallo: "No se pudo crear la impresora",
        debugg: true,
      });

      toast.success("Impresora creada correctamente");
      await get().traerImpresoras();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al crear impresora");
    } finally {
      set({ loading: false });
    }
  },

  // === UPDATE ===
  actualizarImpresora: async (cambios, id) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    console.warn("Raw actualizar: ", cambios);
    try {
      const res = await fetch(`${RUTA}/impresoras/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cambios),
      });

      const responseData = await handleApiResponse({
        backResponse: res,
        mensajeDeFallo: "No se pudo actualizar la impresora",
        debugg: true,
      });

      toast.success("Impresora actualizada correctamente");
      await get().traerImpresoras(); // Refrescar lista
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al actualizar impresora");
    } finally {
      set({ loading: false });
    }
  },

  // === DELETE ===
  eliminarImpresora: async (id) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;

    try {
      const res = await fetch(`${RUTA}/impresoras/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await handleApiResponse({
        backResponse: res,
        mensajeDeFallo: "No se pudo eliminar la impresora",
      });

      toast.success("Impresora eliminada correctamente");
      await get().traerImpresoras(); // Refrescar lista
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al eliminar impresora");
    } finally {
      set({ loading: false });
    }
  },

  // imprimirComanda: async (pedidoId) => {
  //   set({ loading: true });
  //   const token = useAuthStore.getState().token;

  //   try {
  //     const res = await fetch(`${RUTA}/impresoras/comanda/${pedidoId}/enviar`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     const responseData = await handleApiResponse({
  //       backResponse: res,
  //       mensajeDeFallo: "No se pudo eliminar la impresora",
  //       debugg: true,
  //     });
  //     toast.success("Comanda enviada exitosamente");
  //   } catch (error: any) {
  //     console.error(error);
  //     toast.error(error.message || "Error al eliminar impresora");
  //   } finally {
  //     set({ loading: false });
  //   }
  // },
}));
