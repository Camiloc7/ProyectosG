import { RUTA } from "@/helpers/rutas";
import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./authStore";

// Tipado para un establecimiento
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

// Tipado para el estado de la store
type EstablecimientosState = {
  loading: boolean;
  establecimientos: Establecimiento[];
  fetchEstablecimientos: () => Promise<void>;
};

export const useEstablecimientosStore = create<EstablecimientosState>(
  (set) => ({
    loading: false,
    establecimientos: [],

    fetchEstablecimientos: async () => {
    const token = useAuthStore.getState().token; 
      set({ loading: true });

      try {
        const res = await fetch(`${RUTA}/establecimientos`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Error al obtener establecimientos");
        }

        set({ establecimientos: data.data, loading: false });
      } catch (error: any) {
        console.error("Fetch establecimientos fallido:", error);
        toast.error(
          error.message || "No se pudieron cargar los establecimientos"
        );
        set({ loading: false });
      }
    },
  })
);
