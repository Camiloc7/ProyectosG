import { RUTA } from "@/helpers/rutas";
import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./authStore";

export type Establecimiento = {
  id: string;
  nombre: string;
  direccion: string;
  telefono: string;
  activo: boolean;
  impuesto_porcentaje: string;
  created_at: string;
  updated_at: string;
};

export type Select = {
  id: string;
  nombre: string;
};

type RolesState = {
  loading: boolean;
  roles: Select[];
  fetchRoles: () => Promise<void>;
};

export const useRolesStore = create<RolesState>((set) => ({
  loading: false,
  roles: [],

  fetchRoles: async () => {
    const token = useAuthStore.getState().token;
    set({ loading: true });

    try {
      const res = await fetch(`${RUTA}/roles`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al obtener roles");
      }

      const rolesFiltrados = data.data.filter(
        (rol: any) => rol.nombre !== "SUPER_ADMIN"
      );

      set({ roles: rolesFiltrados, loading: false });
    } catch (error: any) {
      console.error("Fetch roles fallido:", error);
      toast.error(error.message || "No se pudieron cargar los roles");
      set({ loading: false });
    }
  },
}));
