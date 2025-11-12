import { create } from "zustand";
import toast from "react-hot-toast";
import { RUTA } from "@/helpers/rutas";
import { IProveedor, IProveedorForm } from "@/types/models";
import { useAuthStore } from "./authStore";

type ProveedoresState = {
  loading: boolean;
  proveedores: IProveedor[];
  traerProveedores: () => Promise<void>;
  crearProveedor: (data: IProveedorForm) => Promise<void>;
  actualizarProveedor: (data: IProveedorForm) => Promise<void>;
  eliminarProveedor: (id: string) => Promise<void>;
};

export const useProveedoresStore = create<ProveedoresState>((set, get) => ({
  loading: false,
  proveedores: [],

  traerProveedores: async () => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 
    try {
      const res = await fetch(`${RUTA}/proveedores`, {
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

      set({ proveedores: responseData.data, loading: false });
    } catch (error: any) {
      const mensajeDelDev = "No se pudo traer los Proveedores";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
    }
  },

  crearProveedor: async (data) => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 
    const { id, ...ProveedoresinId } = data;
    console.warn("Lo que le mando para crear el Proveedor", ProveedoresinId);
    try {
      const res = await fetch(`${RUTA}/proveedores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ProveedoresinId),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message);
      }
      await get().traerProveedores();

      set({ loading: false });
      toast.success("Proveedor creado exitosamente");
    } catch (error: any) {
      const mensajeDelDev = "No se pudo crear el Proveedor";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
    }
  },

  actualizarProveedor: async (data) => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 
    const { id, ...ProveedorsinId } = data;

    console.warn("Lo que le mando para crear el Proveedor", ProveedorsinId);
    try {
      const res = await fetch(`${RUTA}/proveedores/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ProveedorsinId),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message);
      }
      await get().traerProveedores();

      toast.success("Proveedor actualizado exitosamente");

      set({ loading: false });
    } catch (error: any) {
      const mensajeDelDev = "No se pudo actualizar el Proveedor";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
    }
  },

  eliminarProveedor: async (id) => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 

    try {
      const res = await fetch(`${RUTA}/proveedores/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      let responseData = null;
      const contentLength = res.headers.get("Content-Length");
      const isJsonResponse = res.headers
        .get("Content-Type")
        ?.includes("application/json");

      if (res.status !== 204 && isJsonResponse && contentLength !== "0") {
        responseData = await res.json();
      }

      if (!res.ok) {
        throw new Error(responseData?.message || "Error desconocido");
      }

      await get().traerProveedores();
      toast.success("Proveedor eliminado exitosamente");

      set({ loading: false });
    } catch (error: any) {
      const mensajeDelDev = "No se pudo eliminar el Proveedor";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
    }
  },
}));
