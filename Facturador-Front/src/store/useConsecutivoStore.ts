import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';

interface ConsecutivosStore {
  consecutivos: any; // Asegúrate de que sea un arreglo de números
  loading: boolean;
  error: string | null;
  success: boolean;
  fetchConsecutivos: () => Promise<void>;
}

export const useConsecutivosStore = create<ConsecutivosStore>((set) => ({
  consecutivos: null, // Inicializamos consecutivos
  loading: false,
  error: null,
  success: false,

  fetchConsecutivos: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/facturas/obtenerConsecutivosSiguienteAnterior`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener los consecutivos');
      }
      const data = await response.json();

      // Asegurarse de que los valores "anterior" y "siguiente" sean números
      const consecutivos = {
        anterior: Number(data.anterior),
        siguiente: Number(data.siguiente),
      };
      // console.log('consecutivos listos', consecutivos);

      set({ consecutivos, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },
}));
