import { RUTA } from "@/helpers/rutas";
import { create } from "zustand";
import { useAuthStore } from "./authStore";

export type Select = {
  id: string;
  nombre: string;
};

type DatosExtraState = {
  loading: boolean;
  unidadesDeMedida: Select[];
  fetchUnidadesDeMedida: () => Promise<void>;
};

export const useDatosExtraStore = create<DatosExtraState>((set) => ({
  loading: false,
  unidadesDeMedida: [],

  fetchUnidadesDeMedida: async () => {
    const token = useAuthStore.getState().token; 
    set({ loading: true });

    try {
      const res = await fetch(`${RUTA}/ingredientes/unidades-de-medida`, {
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

      // Transformamos las categorías en un solo array de objetos con { id, name }
      const transformCategoria = (categoria: Record<string, any>[]) =>
        categoria.map((item) => ({
          id: item.key,
          nombre: item.display,
        }));

      const unidadesDeMedida = [
        ...transformCategoria(data.data.masa),
        ...transformCategoria(data.data.volumen),
        ...transformCategoria(data.data.conteo),
      ];

      set({ unidadesDeMedida, loading: false });
    } catch (error: any) {
      const mensajeDev = "No se pudo cargar las unidades de medida";
      console.error(mensajeDev, error);
      //   toast.error(error.message || mensajeDev);
      set({ loading: false });
    }
  },
}));
