import { RUTA } from "@/helpers/rutas";
import { create } from "zustand";
import toast from "react-hot-toast";
import { IFormMedioDePago } from "@/app/configuracion/page";
import { useAuthStore } from "./authStore";

export type IMediosDePago = {
  id: string;
  es_efectivo: boolean;
  nombre: string;
};

export type IConfiguracionPedidos = {
  limite_cancelacion_preparacion_minutos: number;
  limite_cancelacion_enviado_cocina_minutos: number;
  limite_edicion_pedido_minutos: number;
};

type ConfiguracionState = {
  loading: boolean;
  mediosDePago: IMediosDePago[];
  configuracionPedidos: IConfiguracionPedidos | null;
  traerMediosDePago: () => Promise<void>;
  eliminarMedioDePago: (id: string) => Promise<void>;
  crearMedioDePago: (data: IFormMedioDePago) => Promise<void>;
  traerConfiguracionEstablecimiento: () => Promise<void>;
  crearOActualizarConfiguracionPedidos: (
    data: IConfiguracionPedidos,
  ) => Promise<void>;
};

export const useConfiguracionStore = create<ConfiguracionState>((set, get) => ({
  loading: false,
  mediosDePago: [],
  configuracionPedidos: null,

  traerMediosDePago: async () => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 

    try {
      const res = await fetch(`${RUTA}/medios-pago`, {
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
      set({
        mediosDePago: data.data,
        loading: false,
      });
    } catch (error: any) {
      const mensajeDev = "No se pudo traer los medios de pago";
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
      set({
        loading: false,
      });
    }
  },

  crearMedioDePago: async (data: IFormMedioDePago) => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 
    console.warn("Lo que le mando al crear (RAW): ", data);
    try {
      const res = await fetch(`${RUTA}/medios-pago`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message);
      }
      await get().traerMediosDePago();

      toast.success("Medio creada exitosamente");

      set({ loading: false });
    } catch (error: any) {
      const mensajeDelDev = "No se pudo crear el medio de pago";
      console.error(mensajeDelDev, error);
      toast.error(error.message || mensajeDelDev);
      set({ loading: false });
    }
  },

  eliminarMedioDePago: async (id: string) => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 

    try {
      const res = await fetch(`${RUTA}/medios-pago/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await get().traerMediosDePago();
      toast.success("Medio Eliminado.");
      set({ loading: true });
    } catch (error: any) {
      const mensajeDev = "No se pudo eliminar el medio de pago";
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
      set({ loading: true });
    }
  },

  // Mantengo el nombre de la función y elimino el parámetro `id`
  traerConfiguracionEstablecimiento: async () => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 

    try {
      const res = await fetch(`${RUTA}/configuracion-pedidos`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.status === 404) {
        set({ configuracionPedidos: null, loading: false });
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "Error al obtener la configuración.");
      }

      set({
        configuracionPedidos: data.data,
        loading: false,
      });
    } catch (error: any) {
      const mensajeDev = "No se pudo traer la configuración de pedidos";
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
      set({ loading: false });
    }
  },

  crearOActualizarConfiguracionPedidos: async (data: IConfiguracionPedidos) => {
    set({ loading: true });
    const token = useAuthStore.getState().token; 
    const configExistente = get().configuracionPedidos;
    const metodo = configExistente ? "PATCH" : "POST";
    const mensajeExito = configExistente
      ? "Configuración actualizada"
      : "Configuración creada";

    try {
      const res = await fetch(`${RUTA}/configuracion-pedidos`, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "Error en la operación.");
      }
      await get().traerConfiguracionEstablecimiento();
      toast.success(mensajeExito);
    } catch (error: any) {
      const mensajeDev = "No se pudo guardar la configuración de pedidos";
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
    } finally {
      set({ loading: false });
    }
  },
}));
