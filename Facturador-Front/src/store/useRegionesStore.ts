import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';

interface RegionStore {
  paises: string[];
  municipios: string[];
  departamentos: string[];
  loading: boolean;
  error: string | null;
  success: boolean;
  fetchRegiones: () => Promise<void>;
}

export const useRegionesStore = create<RegionStore>((set) => ({
  paises: [],
  departamentos: [],
  municipios: [],
  loading: false,
  error: null,
  success: false,

  fetchRegiones: async () => {
    set({ loading: true, error: null });
    // const token = getTokenFromCookies();
    // if (!token) {
    //   set({ loading: false, error: 'Token no disponible' });
    //   return;
    // }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/regiones/obtenerRegiones`,
        {
          method: 'POST',
          // headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener las regiones');
      }

      const data = await response.json();

      // console.log(data);
      // Extraer los nombres de los países
      const paises = Array.isArray(data.paises)
        ? data.paises.map((pais: { nombre: string; numero: string }) => ({
            id: pais.numero, // ID basado en el índice
            nombre: pais.nombre,
          }))
        : [];

      // Obtener los municipios

      const municipios = Array.isArray(data.municipios)
        ? data.municipios.map(
            (municipio: { nombre: string; numero: string }) => ({
              id: municipio.numero, // ID basado en el índice
              nombre: municipio.nombre,
            })
          )
        : [];

      // Obtener los departamentos
      const departamentos = Array.isArray(data.departamentos)
        ? data.departamentos.map(
            (departamento: { nombre: string; numero: string }) => ({
              id: departamento.numero, // ID basado en el índice
              nombre: departamento.nombre,
            })
          )
        : [];
      set({ paises, municipios, departamentos, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },
}));
