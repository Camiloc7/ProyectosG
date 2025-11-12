import { create } from 'zustand';
import { BASE_URL, NODE_API } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import { showErrorToast } from '@/components/feedback/toast';

interface SubidaArchivosStore {
  loading: boolean;
  error: string | null;
  success: boolean;
  subirImagenes: (imagen: File) => Promise<string | null>;
}

export const useSubidaArchivosStore = create<SubidaArchivosStore>((set) => ({
  loading: false,
  error: null,
  success: false,

  subirImagenes: async (imagen: File) => {
    // Indica que se está procesando la carga
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      // Crea un objeto FormData y añade el archivo al campo "image"
      const formData = new FormData();
      formData.append('image', imagen);

      // Realiza la petición usando fetch, enviando el FormData como body
      const response = await fetchWithTimeout(
        `${NODE_API}upload/upload-image/`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      console.log(data);

      if (!data.status) {
        showErrorToast(data.message);
        throw new Error('Error al subir las imágenes');
      }

      // Retorna los datos recibidos (puede incluir la URL del archivo, etc.)
      return data.data;
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },
}));
