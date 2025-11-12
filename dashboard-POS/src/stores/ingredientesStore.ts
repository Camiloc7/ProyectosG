import { create } from "zustand";
import toast from "react-hot-toast";
import { RUTA } from "@/helpers/rutas";
import { IIngredientesFormData } from "@/features/ingredientes/FormIngredientes";
import { useAuthStore } from "./authStore";

export type IIngredientes = {
  id: string;
  nombre: string;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  observaciones: string;
  created_at: Date;
  volumen_por_unidad?: number;
};

type IngredientesState = {
  loading: boolean;
  ingredientes: IIngredientes[];
  traerIngredientes: () => Promise<void>;
  crearIngrediente: (data: IIngredientesFormData) => Promise<boolean>;
  actualizarIngrediente: (data: IIngredientesFormData) => Promise<boolean>;
  eliminarIngrediente: (id: string) => Promise<void>;
  subirExcel: (file: File) => Promise<{ success: boolean; errors?: string[] }>;
};

function limpiarDecimalesIngrediente(ingrediente: any): any {
  const camposConDecimales = [
    "stock_actual",
    "stock_minimo",
    "costo_unitario",
    "cantidad_ultima_compra",
  ];

  const copia = { ...ingrediente };

  for (const campo of camposConDecimales) {
    if (typeof copia[campo] === "string" && copia[campo].endsWith(".00")) {
      copia[campo] = copia[campo].replace(".00", "");
    }
  }

  if (
    copia.establecimiento &&
    copia.establecimiento.impuesto_porcentaje?.endsWith(".00")
  ) {
    copia.establecimiento.impuesto_porcentaje =
      copia.establecimiento.impuesto_porcentaje.replace(".00", "");
  }

  return copia;
}

export const useIngredientesStore = create<IngredientesState>((set, get) => ({
  loading: false,
  ingredientes: [],

  traerIngredientes: async () => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 

    try {
      const res = await fetch(`${RUTA}/ingredientes`, {
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
      const ingredientesOrdenados = data.data
        .map(limpiarDecimalesIngrediente)
        .sort(
          (a: IIngredientes, b: IIngredientes) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      set({ ingredientes: ingredientesOrdenados, loading: false });
    } catch (error: any) {
      const mensajeDelDev = "No se pudo traer los ingredientes";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
    }
  },

  crearIngrediente: async (data) => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 
    const { id, ...ingredienteSinId } = data;
    console.warn("Lo que le mando", ingredienteSinId);
    try {
      const res = await fetch(`${RUTA}/ingredientes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ingredienteSinId),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message);
      }
      await get().traerIngredientes();

      set({ loading: false });
      toast.success("Ingrediente creado exitosamente");
      return true;
    } catch (error: any) {
      const mensajeDelDev = "No se pudo crear el ingrediente";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
      return false;
    }
  },

  actualizarIngrediente: async (data) => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 
    const { id, ...ingredienteSinId } = data;
    console.warn("Lo que le mando", ingredienteSinId);
    try {
      const res = await fetch(`${RUTA}/ingredientes/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ingredienteSinId),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message);
      }
      await get().traerIngredientes();

      toast.success("Ingrediente actualizado exitosamente");

      set({ loading: false });
      return true;
    } catch (error: any) {
      const mensajeDelDev = "No se pudo actualizar el ingrediente";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
      return false;
    }
  },

  eliminarIngrediente: async (id) => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 

    try {
      const res = await fetch(`${RUTA}/ingredientes/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
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

      await get().traerIngredientes();
      toast.success("Ingrediente eliminado exitosamente");

      set({ loading: false });
    } catch (error: any) {
      const mensajeDelDev = "No se pudo eliminar el ingrediente";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
    }
  },
  subirExcel: async (file: File) => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${RUTA}/ingredientes/subir-excel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await res.json();

      if (!res.ok) {
        if (responseData.errors && Array.isArray(responseData.errors)) {
          const errorMessages = responseData.errors.map(
            (err: any) => `Fila ${err.row}: ${err.error}`
          );
          errorMessages.forEach((msg: string) => toast.error(msg));
          return { success: false, errors: errorMessages };
        }
        throw new Error(responseData.message || "Error al subir el archivo.");
      }

      await get().traerIngredientes();
      toast.success(
        responseData.message || "Ingredientes importados exitosamente."
      );
      return { success: true };
    } catch (error: any) {
      const mensajeDelDev = "Error al subir el archivo de Excel";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      return { success: false, errors: [error.message || mensajeDelDev] };
    } finally {
      set({ loading: false });
    }
  },
}));
