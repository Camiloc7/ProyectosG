import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';

interface TiposDeOperacionStore {
  tiposDeOperacion: string[]; // Array de strings para los nombres
  loading: boolean;
  error: string | null;
  success: boolean;
  fetchTiposDeOperacion: () => Promise<void>;
}

interface TipoOperacion {
  nombre: string; // Tipo esperado del objeto
}

export const useTiposDeOperacionStore = create<TiposDeOperacionStore>(
  (set) => ({
    tiposDeOperacion: [],
    loading: false,
    error: null,
    success: false,

    fetchTiposDeOperacion: async () => {
      set({ loading: true, error: null });
      const token = getTokenFromCookies();
      if (!token) {
        set({ loading: false, error: 'Token no disponible' });
        window.location.href = '/login';

        return;
      }
      try {
        const response = await fetchWithTimeout(
          `${BASE_URL}api/facturas/obtenerTiposOperacion`,
          {
            method: 'GET',
            headers: {
              authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Error al obtener los tipos de operación');
        }

        const data: TipoOperacion[] = await response.json(); // Definir el tipo esperado

        // Aquí ahora podemos acceder a la propiedad 'nombre' sin errores
        const mappedData = data.map((item) => item.nombre);

        set({ tiposDeOperacion: mappedData, success: true, loading: false });
      } catch (error: any) {
        set({ error: error.message || 'Error desconocido', loading: false });
      }
    },
  })
);
