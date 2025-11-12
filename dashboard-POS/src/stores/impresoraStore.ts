import { RUTA } from "@/helpers/rutas";
import { create } from "zustand";
import toast from "react-hot-toast";
import { useAuthStore } from "./authStore";
import { handleApiResponse } from "@/helpers/handleApiResponse";
import { IImpresora } from "@/app/configuracion/page";

const PLUGIN_URL = "http://127.0.0.1:8000";

interface IImpresoraPlugin {
  nombre: string; 
  ruta: string;   
  tipo: string;   
}

type ImpresoraState = {
  loading: boolean;
  impresoras: IImpresora[];
  impresorasDisponibles: IImpresoraPlugin[];
  traerImpresoras: () => Promise<void>; 
  traerImpresorasDisponibles: () => Promise<void>; 
  crearImpresora: (nueva: Partial<IImpresora>, configPlugin: IImpresoraPlugin) => Promise<void>;
  eliminarImpresora: (id: number | string, nombrePlugin: string) => Promise<void>;
  actualizarImpresora: (cambios: Partial<IImpresora>, id: number | string) => Promise<void>; 
};

const callPlugin = async (method: string, endpoint: string, body?: any) => {
    const url = `${PLUGIN_URL}${endpoint}`;
    
    const res = await fetch(url, {
        method: method,
        headers: {
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        let errorMsg = `Error desconocido al contactar el Plugin (${url}).`;
        try {
            const errorData = await res.json();
            errorMsg = errorData.mensaje || errorMsg;
        } catch {
            errorMsg = `El Plugin respondió con estado ${res.status}. ${res.statusText}.`;
        }
        console.error(`[Plugin] Falló la respuesta. Status: ${res.status}. URL: ${url}`);
        throw new Error(errorMsg);
    }    
    return await res.json();
};
export const useImpresoraStore = create<ImpresoraState>((set, get) => ({
  loading: false,
  impresoras: [],
  impresorasDisponibles: [],

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
        mensajeDeFallo: "No se pudo traer las impresoras de la DB",
        debugg: false,
      });

      set({ impresoras: responseData.data });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al traer impresoras de la DB");
    } finally {
      set({ loading: false });
    }
  },

  traerImpresorasDisponibles: async () => {
    set({ loading: true });
    
    try {        
      const responseData = await callPlugin("GET", "/impresoras");
      set({
        impresorasDisponibles: responseData, 
      });
      toast.success("Impresoras locales detectadas");
    } catch (error: any) {
      console.error(error);
      toast.error(
        error.message || `Error: No se pudo conectar con el Plugin local en ${PLUGIN_URL}.`
      );
      set({ impresorasDisponibles: [] });
    } finally {
      set({ loading: false });
    }
  },

  crearImpresora: async (nueva, configPlugin) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    const pluginPayload = {
        nombre: nueva.nombre, 
        tipo: configPlugin.tipo,
        ruta: configPlugin.ruta,
    };
    
    try {
      await callPlugin("POST", "/impresoras", pluginPayload);
      const dbPayload = {
          ...nueva,
          tipo_conexion_tecnico: configPlugin.tipo, 
      };

      try {            
          const res = await fetch(`${RUTA}/impresoras`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(dbPayload), 
          });

          await handleApiResponse({
            backResponse: res,
            mensajeDeFallo: "No se pudo crear la impresora en la DB",
            debugg: false,
          });

          toast.success("Impresora creada y sincronizada correctamente");
          await get().traerImpresoras(); 
      } catch (dbError: any) {
            console.error("[Store:Crear]  FALLO DB. Iniciando Rollback:", dbError);
          try {
              const rollbackPayload = { nombre: nueva.nombre };
               
              await callPlugin("DELETE", "/impresoras", rollbackPayload);
              toast.error(`Error al guardar en la Nube. Se realizó Rollback local para ${nueva.nombre}.`);
          } catch (rollbackError: any) {
              console.error("¡ALERTA DE SINCRONIZACIÓN! Falló el Rollback:", rollbackError);
              toast.error(`Error de sincronización: Falló al guardar en la Nube y al deshacer el registro local. Contactar soporte.`);
          }
          
          throw dbError;
      }
    } catch (pluginError: any) {
      console.error("[Store:Crear]  FALLO PLUGIN (Paso 1):", pluginError);
      if (pluginError.message.includes(PLUGIN_URL)) {
          toast.error("Error LOCAL: El Plugin de impresión no está activo o rechazó la configuración.");
      } else {
          toast.error(pluginError.message || "Error desconocido en la configuración.");
      }
    } finally {
      set({ loading: false });
    }
  },
  actualizarImpresora: async (cambios, id) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    
    try {
      const res = await fetch(`${RUTA}/impresoras/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cambios),
      });

      await handleApiResponse({
        backResponse: res,
        mensajeDeFallo: "No se pudo actualizar la impresora",
        debugg: false,
      });

      toast.success("Impresora actualizada en la DB correctamente");
      await get().traerImpresoras(); 
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al actualizar impresora");
    } finally {
      set({ loading: false });
    }
  },

  eliminarImpresora: async (id, nombrePlugin) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    try {
      const pluginPayload = { nombre: nombrePlugin }; 
      await callPlugin("DELETE", "/impresoras", pluginPayload);
      const res = await fetch(`${RUTA}/impresoras/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
   await handleApiResponse({
        backResponse: res,
        mensajeDeFallo: "No se pudo eliminar la impresora de la DB",
      });

      toast.success("Impresora eliminada y des-sincronizada correctamente");
      await get().traerImpresoras(); 
    } catch (error: any) {
      console.error("[Store:Eliminar] ❌ FALLO General:", error);
      if (error.message.includes(PLUGIN_URL)) {
          toast.error(`Error LOCAL al eliminar el registro en el Plugin: ${error.message}. Se sugiere reintentar o borrar manualmente.`);
      } else {
          toast.error(error.message || "Error al eliminar impresora de la Nube/DB");
      }
    } finally {
      set({ loading: false });
    }
  },
}));