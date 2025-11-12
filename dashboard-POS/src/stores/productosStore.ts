import { create } from "zustand";
import toast from "react-hot-toast";
import { RUTA } from "@/helpers/rutas";
import { IFormProducto } from "@/features/Menu/FormProducto";
import { limpiarDecimalesCero } from "@/helpers/limpiarDecimales";
import { ISelectCategorias } from "./categoriasStore";
import { useAuthStore } from "./authStore";

export interface IProductoConfigurableCompleto {
  id: string;
  nombre: string;
  descripcion: string;
  categoria_id: string;
  imagen_url: string | null;
  activo: boolean;
  precio_base: number;
  opciones: any[];
  tipo: "configurable";
}

export interface Producto {
  id: string;
  establecimiento_id: string;
  categoria_id: string;
  nombre: string;
  descripcion: string;
  imagen_url: string;
  activo: boolean;
  iva: boolean;
  ic: boolean;
  inc: boolean;
  created_at: string;
  updated_at: string;
  categoria: string;
  tipo: "simple" | "configurable";
  precio?: number | null;
  precio_base?: number | null;
  receta?: {
    id: string;
    producto_id: string;
    ingrediente_id: string;
    cantidad_necesaria: string;
    ingrediente: {
      id: string;
      establecimiento_id: string;
      nombre: string;
      unidad_medida: string;
      stock_actual: string;
      stock_minimo: string;
      costo_unitario: string;
      volumen_por_unidad: string | null;
      fecha_ultima_compra: string;
      cantidad_ultima_compra: string;
      observaciones: string;
      created_at: string;
      updated_at: string;
    };
  }[];
  opciones?: any[];
}

type ProductosState = {
  loading: boolean;
  productos: Producto[];
  categorias: ISelectCategorias[];
  traerProductos: () => Promise<void>;
  traerCategorias: () => Promise<void>;
  crearProducto: (data: IFormProducto) => Promise<boolean>;
  actualizarProducto: (data: IFormProducto) => Promise<boolean>;
  eliminarProducto: (id: string) => Promise<void>;
  traerProductoPorID: (
    id: string,
    tipo: "simple" | "configurable"
  ) => Promise<Producto | null>;
  subirExcel: (file: File) => Promise<{ success: boolean; errors?: string[] }>;
  traerProductoConfigurable: (id: string) => Promise<IProductoConfigurableCompleto | null>;
};

// Función de ayuda para limpiar y formatear los datos
function limpiarProductoParaEnviar(data: IFormProducto) {
  const baseData = {
    id: data.id,
    categoria_id: data.categoria_id,
    nombre: data.nombre,
    descripcion: data.descripcion,
    imagen_url: data.imagen_url,
    activo: data.activo,
    iva: data.iva,
    ic: data.ic,
    inc: data.inc,
  };

  if (data.tipo === "simple") {
    const receta = data.receta?.map((item) => ({
      ingrediente_id: item.ingrediente_id,
      cantidad_necesaria: parseFloat(item.cantidad_necesaria),
    }));

    return {
      ...baseData,
      precio: parseFloat(data.precio as string),
      receta: receta || [],
    };
  }

  if (data.tipo === "configurable") {
    const precioBase = data.precio_base ? parseFloat(data.precio_base) : 0;

    const opciones = data.opciones?.map((opcion) => ({
      ...opcion,
      valores: opcion.valores?.map((valor) => ({
        ...valor,
        precio: parseFloat(valor.precio),
        receta: valor.receta?.map((recetaItem) => ({
          ...recetaItem,
          cantidad_necesaria: parseFloat(recetaItem.cantidad_necesaria),
        })),
      })),
    }));

    const configurableData: any = {
      ...baseData,
      opciones: opciones || [],
    };

    if (!isNaN(precioBase)) {
      configurableData.precio_base = precioBase;
    }

    return configurableData;
  }
}

export const useProductosStore = create<ProductosState>((set, get) => ({
  loading: false,
  productos: [],
  categorias: [],

  traerCategorias: async () => {
    set({ loading: true });
        const token = useAuthStore.getState().token; 
    
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
        throw new Error(data.message);
      }
      const categoriasFormateadas: ISelectCategorias[] = data.data.map((categoria: any) => ({
        id: categoria.id,
        nombre: categoria.nombre,
      }));
      set({
        loading: false,
        categorias: categoriasFormateadas,
      });
    } catch (error: any) {
      const mensajeDev = "Fetch categorías fallido:";
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
      set({ loading: false });
    }
  },

  traerProductos: async () => {
    set({ loading: true });
        const token = useAuthStore.getState().token; 

    try {
      const res = await fetch(`${RUTA}/productos`, {
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
      const productosFormateados = responseData.data.map((p: any) => ({
        ...p,
        precio: p.tipo === "simple" ? Number(p.precio) : null,
        precio_base: p.tipo === "configurable" ? Number(p.precio_base) : null,
      }));
      set({ productos: productosFormateados, loading: false });
    } catch (error: any) {
      const mensajeDelDev = "No se pudo traer los productos";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
    }
  },

  traerProductoPorID: async (id, tipo) => {
    set({ loading: true });
        const token = useAuthStore.getState().token; 

    const url =
      tipo === "configurable"
        ? `${RUTA}/productos/configurable/${id}`
        : `${RUTA}/productos/${id}`;

    try {
      const res = await fetch(url, {
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
      const data = {
        ...responseData.data,
        precio: responseData.data.precio ? Number(responseData.data.precio) : null,
        precio_base: responseData.data.precio_base ? Number(responseData.data.precio_base) : null,
      };
      set({ loading: false });
      return limpiarDecimalesCero(data);
    } catch (error: any) {
      const mensajeDelDev = "No se pudo cargar la informacion del producto";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
      return null;
    }
  },

  crearProducto: async (data) => {
    set({ loading: true });
        const token = useAuthStore.getState().token; 

    const { id, ...productoSinId } = data;
    const dataParaEnviar = limpiarProductoParaEnviar(
      productoSinId as IFormProducto
    );
    const url = (dataParaEnviar as any).precio
      ? `${RUTA}/productos`
      : `${RUTA}/productos/configurable`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataParaEnviar),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message);
      }
      await get().traerProductos();
      set({ loading: false });
      toast.success("Producto creado exitosamente");
      return true;
    } catch (error: any) {
      const mensajeDelDev = "No se pudo crear el Producto";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
      return false;
    }
  },

  actualizarProducto: async (data) => {
    set({ loading: true });
        const token = useAuthStore.getState().token; 

    const cleanData = limpiarProductoParaEnviar(data);
    delete (cleanData as any).id;

    const url = (cleanData as any).precio
      ? `${RUTA}/productos/${data.id}`
      : `${RUTA}/productos/configurable/${data.id}`;

    console.warn("Lo que mando al ACTUALIZAR: ", cleanData);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanData),
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message);
      }
      await get().traerProductos();
      toast.success("Producto actualizado exitosamente");
      set({ loading: false });
      return true;
    } catch (error: any) {
      const mensajeDelDev = "No se pudo actualizar el producto";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
      return false;
    }
  },

  eliminarProducto: async (id) => {
    set({ loading: true });
        const token = useAuthStore.getState().token; 


    try {
      const res = await fetch(`${RUTA}/productos/${id}`, {
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

      await get().traerProductos();
      toast.success("Producto eliminado exitosamente");

      set({ loading: false });
    } catch (error: any) {
      const mensajeDelDev = "No se pudo eliminar el producto";
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
      const res = await fetch(`${RUTA}/productos/subir-excel`, {
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
      await get().traerProductos();
      toast.success(
        responseData.message || "Productos importados exitosamente."
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

  traerProductoConfigurable: async (id: string) => {
    set({ loading: true });
        const token = useAuthStore.getState().token; 

    try {
      const res = await fetch(`${RUTA}/productos/configurable/${id}`, {
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
      set({ loading: false });
      return {
        ...data.data,
        precio_base: Number(data.data.precio_base),
      } as IProductoConfigurableCompleto;
    } catch (error: any) {
      const mensajeDev = `Fetch del producto configurable ${id} fallido:`;
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
      set({ loading: false });
      return null;
    }
  },
}));
