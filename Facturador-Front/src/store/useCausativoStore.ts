import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { useFacturaStore } from './useFacturaStore';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import { showTemporaryToast } from '@/components/feedback/toast';

interface CausativoStore {
  loading: boolean;
  error: string | null;
  success: boolean;
  traerCausativo: (id: string, download?: boolean) => Promise<void>;
}

export const useCausativoStore = create<CausativoStore>((set) => ({
  loading: false,
  error: null,
  success: false,

  traerCausativo: async (id, download) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/causativo/generarindividual/${id}`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!download) return;

      if (!response.ok) {
        console.error('Error status:', response.status);
        throw new Error('Error al obtener la causacion');
      }

      // Obtener el tipo de contenido
      const contentType = response.headers.get('Content-Type');

      if (
        contentType?.includes(
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) ||
        contentType?.includes('application/vnd.ms-excel')
      ) {
        // Si es un archivo Excel, descargarlo
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `causativo_${id}.xlsx`; // Nombre del archivo
        a.click();
        window.URL.revokeObjectURL(url); // Limpiar el objeto URL
        // Llamar a la función fetchListaDeFacturas de useFacturasStore

        set({ success: true, loading: false });
        showTemporaryToast('EL archivo se descargo correctamente');
        const { fetchListaDeFacturas } = useFacturaStore.getState();
        fetchListaDeFacturas();
      } else if (contentType?.includes('application/json')) {
        // Si es un JSON, procesarlo normalmente
        const data = await response.json();

        set({ success: true, loading: false });
      } else if (contentType?.includes('text/plain')) {
        // Si es texto plano, mostrarlo en consola
        const text = await response.text();

        set({ success: true, loading: false });
      } else {
        console.warn('Tipo de contenido no manejado');
        throw new Error('Respuesta no válida');
      }
    } catch (error: any) {
      console.error('Fetch error:', error);
    } finally {
      set({ loading: false });
    }
  },
}));
