import { RUTA } from "@/helpers/rutas";
import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";

export interface ICategoria {
  id?: string;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
}

export interface ISelectCategorias {
  id: string;
  nombre: string;
}

type CategoriasState = {
  loading: boolean;
  categorias: ICategoria[];
  selectCategorias: ISelectCategorias[];
  error: string | null;
  fetchCategorias: () => Promise<void>;
  fetchCategoriaById: (id: string) => Promise<ICategoria | undefined>;
  createCategoria: (
    categoriaData: ICategoria
  ) => Promise<ICategoria | undefined>;
  updateCategoria: (
    id: string,
    categoriaData: ICategoria
  ) => Promise<ICategoria | undefined>;
  deleteCategoria: (id: string) => Promise<boolean>;
};

export const useCategoriasStore = create<CategoriasState>((set, get) => ({
  loading: false,
  categorias: [],
  selectCategorias: [],
  error: null,

  fetchCategorias: async () => {
    set({ loading: true, error: null });
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error("No hay token de autenticación disponible.");
      set({ loading: false, error: "No token" });
      return;
    }

    try {
      const res = await fetch(`${RUTA}/categorias`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Error al obtener categorías");
      }

      set({
        categorias: data.data,
        selectCategorias: data.data,
        loading: false,
      });
    } catch (error: any) {
      console.error("Fetch categorias fallido:", error);
      toast.error(error.message || "No se pudieron cargar las categorías");
      set({
        loading: false,
        error: error.message || "Error al cargar categorías",
      });
    }
  },

  fetchCategoriaById: async (id: string) => {
    set({ loading: true, error: null });
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error("No hay token de autenticación disponible.");
      set({ loading: false, error: "No token" });
      return;
    }

    try {
      const res = await fetch(`${RUTA}/categorias/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.message || `Error al obtener categoría con ID ${id}`
        );
      }

      set({ loading: false });
      return data;
    } catch (error: any) {
      console.error(`Fetch categoria por ID (${id}) fallido:`, error);
      toast.error(
        error.message || `No se pudo cargar la categoría con ID ${id}`
      );
      set({
        loading: false,
        error: error.message || "Error al cargar categoría por ID",
      });
      return undefined;
    }
  },

  createCategoria: async (categoriaData: ICategoria) => {
    set({ loading: true, error: null });
    const token = useAuthStore.getState().token;
    console.warn(categoriaData);
    try {
      const res = await fetch(`${RUTA}/categorias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoriaData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Error al crear categoría");
      }

      set((state) => ({
        loading: false,
      }));
      await get().fetchCategorias();

      toast.success("Categoría creada exitosamente.");
      return data;
    } catch (error: any) {
      console.error("Creación de categoría fallida:", error);
      toast.error(error.message || "No se pudo crear la categoría");
      set({
        loading: false,
        error: error.message || "Error al crear categoría",
      });
      return undefined;
    }
  },

  updateCategoria: async (id: string, categoriaData: ICategoria) => {
    set({ loading: true, error: null });
    const token = useAuthStore.getState().token;

    console.warn(categoriaData);

    try {
      const res = await fetch(`${RUTA}/categorias/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(categoriaData),
      });

      const data = await res.json();
      console.log(data);
      if (!res.ok) {
        throw new Error(
          data.message || `Error al actualizar categoría con ID ${id}`
        );
      }

      await get().fetchCategorias();

      toast.success("Categoría actualizada exitosamente.");
      set(() => ({
        loading: false,
      }));
      return data;
    } catch (error: any) {
      console.error(`Actualización de categoría (${id}) fallida:`, error);
      toast.error(
        error.message || `No se pudo actualizar la categoría con ID ${id}`
      );
      set({
        loading: false,
        error: error.message || "Error al actualizar categoría",
      });
      return undefined;
    }
  },

  deleteCategoria: async (id: string) => {
    set({ loading: true, error: null });
    const token = useAuthStore.getState().token;
    if (!token) {
      toast.error("No hay token de autenticación disponible.");
      set({ loading: false, error: "No token" });
      return false;
    }

    try {
      const res = await fetch(`${RUTA}/categorias/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.message || `Error al eliminar categoría con ID ${id}`
        );
      }

      set((state) => ({
        loading: false,
      }));
      await get().fetchCategorias();
      toast.success("Categoría eliminada exitosamente.");
      return true;
    } catch (error: any) {
      console.error(`Eliminación de categoría (${id}) fallida:`, error);
      toast.error(
        error.message || `No se pudo eliminar la categoría con ID ${id}`
      );
      set({
        loading: false,
        error: error.message || "Error al eliminar categoría",
      });
      return false;
    }
  },
}));
