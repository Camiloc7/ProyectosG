import { create } from 'zustand';
import { RUTA } from '../helpers/rutas';
import { toast } from 'sonner';
import { useAuthStore } from './authStore';

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
  tiposDocumentos: TipoDocumento[];
  traerTiposDeDocumento: () => Promise<void>;
  // 1. Agrega la nueva función al tipo de estado
  fetchExternalClientInfo: (tipoDocumento: string, numeroDocumento: string) => Promise<ClienteInfo | null>;
};

export const useClienteStore = create<ClienteState>((set) => ({
  loading: false,
  tiposDocumentos: [],

  traerTiposDeDocumento: async () => {
    const token = useAuthStore.getState().token; 
    set({ loading: true });

    try {
      const res = await fetch(`${RUTA}/clientes/tipos-documento`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message);
      }
      
      set({
        tiposDocumentos: responseData.data as TipoDocumento[],
        loading: false
      });
    } catch (error: any) {
      const mensajeDev = 'No se pudo traer los tipos de documentos';
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
      set({ loading: false });
    }
  },

  // 2. Implementa la lógica para la nueva función
  fetchExternalClientInfo: async (tipoDocumento: string, numeroDocumento: string): Promise<ClienteInfo | null> => {
    const token = useAuthStore.getState().token;
    set({ loading: true });

    try {
      const url = `${RUTA}/clientes/external-info?tipoDocumento=${tipoDocumento}&numeroDocumento=${numeroDocumento}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || 'Error al obtener información del cliente externo.');
      }

      // El ejemplo de respuesta de la API muestra que los datos están en `responseData.data.data`
      const clienteInfo = responseData.data as ClienteInfo;
      toast.success('Información de cliente obtenida con éxito.');
      return clienteInfo;

    } catch (error: any) {
      const mensajeDev = 'No se pudo obtener la información del cliente desde la API externa.';
      console.error(mensajeDev, error);
      toast.error(error.message || mensajeDev);
      return null;
    } finally {
      set({ loading: false });
    }
  },
}));





// import { create } from 'zustand';
// import { RUTA } from '../helpers/rutas';
// import { toast } from 'sonner';
// import { useAuthStore } from './authStore';

// type TipoDocumento = {
//   id: string;
//   nombre: string;
//   codigo: string;
// };


// type ClienteState = {
//   loading: boolean;
//   tiposDocumentos: TipoDocumento[];
//   traerTiposDeDocumento: () => Promise<void>;
// };

// export const useClienteStore = create<ClienteState>((set) => ({
//   loading: false,
//   tiposDocumentos: [],

//   traerTiposDeDocumento: async () => {
//     const token = useAuthStore.getState().token; 
//     set({ loading: true });

//     try {
//       const res = await fetch(`${RUTA}/clientes/tipos-documento`, {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//           Authorization: `Bearer ${token}`
//         }
//       });

//       const responseData = await res.json();

//       if (!res.ok) {
//         throw new Error(responseData.message);
//       }
      
//       set({
//         tiposDocumentos: responseData.data as TipoDocumento[],
//         loading: false
//       });
//     } catch (error: any) {
//       const mensajeDev = 'No se pudo traer los tipos de documentos';
//       console.error(mensajeDev, error);
//       toast.error(error.message || mensajeDev);
//       set({ loading: false });
//     }
//   }
// }));
