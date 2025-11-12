import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';

interface MetodosDePago {
  nombresDeMetodosDePago: string[]; // Array de strings para los nombres
  loading: boolean;
  error: string | null;
  success: boolean;
  fetchMetodosDePago: () => Promise<void>;
}

export const useMetodosDePagoStore = create<MetodosDePago>((set) => ({
  nombresDeMetodosDePago: [],
  loading: false,
  error: null,
  success: false,

  fetchMetodosDePago: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/facturas/obtenerMetodosPago`,
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

      const data: MetodosDePago[] = await response.json(); // Definir el tipo esperado

      // Aquí ahora podemos acceder a la propiedad 'nombre' sin errores
      const mappedData = data.map((item: any) => item.nombre);

      set({
        nombresDeMetodosDePago: mappedData,
        success: true,
        loading: false,
      });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },
}));
