import { RUTA } from "@/helpers/rutas";
import { create } from "zustand";
import toast from "react-hot-toast";
import { Mesa, EstadoMesa } from "@/types/models";
import { useAuthStore } from "./authStore";

export type IMesasLibres = {
  id: string;
  nombre: string;
};

export interface IMesa {
  establecimiento_id: string;
  id: string;
  numero: string;
  capacidad: number;
  estado: EstadoMesa;
  ubicacion_descripcion?: string;
}
type MesasState = {
  loading: boolean;
  mesas: Mesa[];
  mesasLibres: IMesasLibres[];
  error: string | null;
  fetchMesas: () => Promise<void>;
  fetchMesaById: (id: string) => Promise<Mesa | undefined>;
  createMesa: (mesaData: IMesa) => Promise<Mesa | undefined>;
  updateMesa: (mesaData: IMesa) => Promise<Mesa | undefined>;
  deleteMesa: (id: string) => Promise<boolean>;
  traerMesasLibres: () => Promise<void>;
};

export const useMesasStore = create<MesasState>((set, get) => ({
  loading: false,
  mesas: [],
  mesasLibres: [],
  error: null,

  fetchMesas: async () => {
    set({ loading: true, error: null });
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error("No hay token de autenticación disponible.");
      set({ loading: false, error: "No token" });
      return;
    }
    try {
      const res = await fetch(`${RUTA}/mesas`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message);
      }
      set({ mesas: data.data, loading: false });
    } catch (error: any) {
      const mensajeDelDev = "No se pudo traer las mesas";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
    }
  },

  fetchMesaById: async (id) => {
    set({ loading: true, error: null });
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error("No hay token de autenticación disponible.");
      set({ loading: false, error: "No token" });
      return;
    }
    try {
      const res = await fetch(`${RUTA}/mesas/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Error al obtener mesa con ID ${id}`);
      }
      set({ loading: false });
      return data;
    } catch (error: any) {
      console.error(`Fetch mesa por ID (${id}) fallido:`, error);
      toast.error(error.message || `No se pudo cargar la mesa con ID ${id}`);
      set({
        loading: false,
        error: error.message || "Error al cargar mesa por ID",
      });
      return undefined;
    }
  },

  createMesa: async (mesaData) => {
    set({ loading: true, error: null });
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error("No hay token de autenticación disponible.");
      set({ loading: false, error: "No token" });
      return;
    }
    const { id, ...mesaSinId } = mesaData;
    try {
      const res = await fetch(`${RUTA}/mesas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mesaSinId),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al crear mesa");
      }
      await get().fetchMesas();
      toast.success("Mesa creada exitosamente.");
      set({ loading: false });
      return data;
    } catch (error: any) {
      console.error("Creación de mesa fallida:", error);
      toast.error(error.message || "No se pudo crear la mesa");
      set({ loading: false, error: error.message || "Error al crear mesa" });
      return undefined;
    }
  },

  updateMesa: async (mesaData) => {
    set({ loading: true, error: null });
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error("No hay token de autenticación disponible.");
      set({ loading: false, error: "No token" });
      return;
    }
    const { id, establecimiento_id, ...mesaSinId } = mesaData;
    try {
      const res = await fetch(`${RUTA}/mesas/${mesaData.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(mesaSinId),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message);
      }
      await get().fetchMesas();
      set({ loading: false });
      toast.success("Mesa actualizada exitosamente.");
      return data;
    } catch (error: any) {
      toast.error(error.message);
      set({
        loading: false,
        error: error.message || "Error al actualizar mesa",
      });
      return undefined;
    }
  },

  deleteMesa: async (id: string) => {
    set({ loading: true, error: null });
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error("No hay token de autenticación disponible.");
      set({ loading: false, error: "No token" });
      return false;
    }
    try {
      const res = await fetch(`${RUTA}/mesas/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `Error al eliminar mesa con ID ${id}`
        );
      }
      await get().fetchMesas();
      toast.success("Mesa eliminada exitosamente.");
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error(`Eliminación de mesa (${id}) fallida:`, error);
      toast.error(error.message || `No se pudo eliminar la mesa con ID ${id}`);
      set({ loading: false, error: error.message || "Error al eliminar mesa" });
      return false;
    }
  },

  traerMesasLibres: async () => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error("No hay token de autenticación disponible.");
      set({ loading: false });
      return;
    }
    try {
      const res = await fetch(`${RUTA}/mesas`, {
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
      const mesasLibres = responseData.data.filter(
        (mesa: any) => mesa.estado === "LIBRE"
      );
      const mesasFormateadas = mesasLibres.map((mesa: any) => ({
        id: mesa.id,
        nombre: mesa.numero,
      }));
      set({
        mesasLibres: mesasFormateadas,
        loading: false,
      });
    } catch (error: any) {
      const mensajeDev = "Fetch mesas libres fallido:";
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
      set({ loading: false });
    }
  },
}));
