import { create } from "zustand";
import { BASE_URL, RUTA } from "../helpers/rutas";
import { toast } from "sonner";
import { useAuthStore } from "./authStore";

type TipoDocumento = {
  id: string;
  nombre: string;
  codigo: string;
};

// Define el tipo de dato que esperamos de la API externa
type ClienteInfo = {
  nombre?: string;
  email?: string;
};

type ClienteState = {
  loading: boolean;
  clientes: any;
  tiposDocumentos: TipoDocumento[];
  traerTiposDeDocumento: () => Promise<void>; // 1. Agrega la nueva función al tipo de estado
  traerClientesQB: () => Promise<void>; // 1. Agrega la nueva función al tipo de estado

  fetchExternalClientInfo: (
    tipoDocumento: string,
    numeroDocumento: string
  ) => Promise<ClienteInfo | null>;
};

export const useClienteStore = create<ClienteState>((set) => ({
  loading: false,
  clientes: [],
  tiposDocumentos: [],

  traerTiposDeDocumento: async () => {
    const token = useAuthStore.getState().token;
    set({ loading: true });

    try {
      const res = await fetch(`${RUTA}/clientes/tipos-documento`, {
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
      set({
        tiposDocumentos: responseData.data as TipoDocumento[],
        loading: false,
      });
    } catch (error: any) {
      const mensajeDev = "No se pudo traer los tipos de documentos";
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
      set({ loading: false });
    }
  }, // 2. Implementa la lógica para la nueva función

  fetchExternalClientInfo: async (
    tipoDocumento: string,
    numeroDocumento: string
  ): Promise<ClienteInfo | null> => {
    const token = useAuthStore.getState().token;
    set({ loading: true });
    // console.warn("tipoDocumento", tipoDocumento);
    // console.warn("numeroDocumento", numeroDocumento);
    try {
      const url = `${RUTA}/clientes/external-info?tipoDocumento=${tipoDocumento}&numeroDocumento=${numeroDocumento}`;
      // console.warn(url);
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(
          responseData.message ||
            "Error al obtener información del cliente externo."
        );
      } // El ejemplo de respuesta de la API muestra que los datos están en `responseData.data.data`

      const clienteInfo = responseData.data as ClienteInfo;
      // toast.success("Información de cliente obtenida con éxito.");
      return clienteInfo;
      // const data = {
      //   nombre: "Hola",
      // };
      // return data;
    } catch (error: any) {
      const mensajeDev =
        "No se pudo obtener la información del cliente desde la API externa.";
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
      return null;
    } finally {
      set({ loading: false });
    }
  },
  traerClientesQB: async () => {
    const token = useAuthStore.getState().token;
    set({ loading: true });

    try {
      // Obtener token de QB
      const res = await fetch(`${BASE_URL}auth/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message);
      }

      // Traer clientes
      const res2 = await fetch(
        `https://facturador.qualitysoftservices.com/index.php/api/usuarios`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            authorization: `Bearer ${responseData.token}`,
          },
        }
      );

      const responseData2 = await res2.json();

      if (!res2.ok) {
        throw new Error(responseData2.message);
      }

      // Mapear a array de objetos con id, nombre y dv
      if (responseData2 === false) {
        return;
      }
      const clientesMapeados = responseData2.map((cliente: any) => ({
        // id: cliente.ID,
        nombre: cliente.NOMBRE,
        dv: cliente.DV,
        nit: cliente.NIT,
      }));

      set({
        clientes: clientesMapeados,
        loading: false,
      });
    } catch (error: any) {
      console.error("No se pudo traer los clientes", error);
      set({ loading: false });
    } finally {
      set({ loading: false });
    }
  },
}));
