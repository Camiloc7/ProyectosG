import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { useFacturaStore } from './useFacturaStore'; // Cambia la ruta según tu estructura de carpetas
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';

interface XMLStore {
  id: number | null; // Se permite null como valor inicial
  error: string | null;
  success: boolean;
  loading: boolean; // Agregar 'loading' a la interfaz
  subirXML: (id: number, file: File) => Promise<void>;
  verXML: (id: number) => Promise<void>;
}

export const useXMLStore = create<XMLStore>((set, get) => ({
  id: null, // Valor inicial para 'id'
  loading: false,
  error: null,
  success: false,

  subirXML: async (id: number, file: File) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    if (!file) {
      console.error('Archivo no recibido o es null');
      set({
        error: 'No se seleccionó ningún archivo',
        loading: false,
        success: false,
      });
      return;
    }

    try {
      // Crear un FormData para enviar el archivo
      const formData = new FormData();
      formData.append('pdf_prueba', file);
      formData.append('id', `api/facturas/guardararchivo/${id.toString()}`);

      // Mostrar claves y valores de FormData
      // formData.forEach((value, key) => {
      //   console.log(`${key}:`, value);
      // });

      const response = await fetchWithTimeout(
        `${BASE_URL}api/facturas/guardararchivo/${id}`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const responseData = await response.json();
      // console.log(responseData);

      if (responseData.status === false || responseData.status === 'error') {
        showErrorToast('Algo salio mal.');
      } else {
        showTemporaryToast('Se subio correctamente');
      }

      if (response.status === 200 || response.status === 201) {
        const state = useFacturaStore.getState(); // Obtén el estado de la tienda de facturas
        await state.fetchListaDeFacturas(); // Realiza el fetch a la lista de facturas
      } else {
        throw new Error('Error traer las facturas');
      }

      set({ loading: false, success: true });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error al subir el archivo:', error.message);
    }
  },

  verXML: async (id: number) => {
    set({ loading: true, error: null, success: false });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      // Realizar la solicitud GET para obtener el archivo XML
      const response = await fetchWithTimeout(
        `${BASE_URL}api/facturas/cargarXML/${id}`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`, // Enviar el token de autorización
          },
        }
      );
      if (!response.ok) {
        throw new Error('Error al abrir el xml');
      }
      const responseData = await response.json();

      const { contenidoZIP } = responseData;

      if (contenidoZIP) {
        const BASE_URL_FIXED = BASE_URL.replace('/index.php', '');
        const cleanedPath = contenidoZIP.replace(/^\.\//, '');
        const fullURL = `${BASE_URL_FIXED}${cleanedPath}`;
        window.open(fullURL, '_blank'); // Abrir en una nueva pestaña
      } else {
        throw new Error('El enlace contenidoZIP no está disponible.');
      }

      set({ loading: false, success: true });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error:', error.message);
    }
  },
}));
