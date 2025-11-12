import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies'; //!No se necesita en este caso
import { fetchWithTimeout } from '@/helpers/timefetch';

interface LandingStore {
  error: string | null;
  success: boolean;
  loading: boolean; // Agregar el estado de loading
  enviarMensaje: (data: object) => Promise<void>;
}

export const useLandingStore = create<LandingStore>((set) => ({
  loading: false,
  error: null,
  success: false,

  // Función para enviar mensaje
  enviarMensaje: async (data: any) => {
    set({ loading: true, error: null, success: false });
    try {
      // Crear FormData con los datos
      const formData = new FormData();

      // Agregar los datos al FormData
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          formData.append(key, data[key]);
        }
      }

      // Hacer la solicitud POST con FormData
      const response = await fetchWithTimeout(
        `${BASE_URL}api/notificaciones/enviarMensaje`,
        {
          method: 'POST',
          body: formData, // Usar formData directamente
        }
      );

      // Verificar la respuesta
      if (!response.ok) {
        throw new Error('Error al realizar la solicitud al servidor');
      }

      const responseData = await response.json();

      // Verificar el resultado de la respuesta
      if (responseData.resultado === 'error') {
        throw new Error(responseData.mensaje || 'Error al crear el cliente');
      }
      set({ loading: false, success: true });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error al enviar mensaje:', error.message);
    }
  },
}));
