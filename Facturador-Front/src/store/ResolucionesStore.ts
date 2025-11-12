import { create } from 'zustand';
import { BASE_URL, BASE_URL_SIN_INDEX } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import { handleApiResponse } from '@/helpers/handleApiResponse';
import { showErrorToast } from '@/components/feedback/toast';

export interface IResolucion {
  ID: string;
  ID_USUARIO: string;
  NOMBRE: string;
  NIT: string;
  NUMERO: string;
  LLAVE: string;
  FECHA: string;
  FECHA_INICIO: string;
  FECHA_FIN: string;
  PREFIJO: string;
  DESDE: string;
  HASTA: string;
  ADJUNTO: string;
  CONTEO: string;
  TIPO: string;
  ACTIVO: string;
  API: string;
  establecimiento_id: string;
}

interface REesolucionesState {
  loading: boolean;
  resoluciones: IResolucion[];
  selectResoluciones: { id: string; nombre: string }[]; // <-- agregado
  fetchTodasLasResoluciones: () => Promise<void>;
  setResolucion: () => Promise<boolean>;
}

export const useResolucionesStore = create<REesolucionesState>((set) => ({
  tiposDeOperacion: [],
  loading: false,
  resoluciones: [],
  selectResoluciones: [],

  fetchTodasLasResoluciones: async () => {
    set({ loading: true });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false });
      window.location.href = '/login';
      return;
    }
    try {
      const response = await fetch(
        `${BASE_URL_SIN_INDEX}api/obtenerResoluciones`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      const responseData = await handleApiResponse(
        response,
        'No se pudo traer las resoluciones'
      );

      set({ resoluciones: responseData.data.resoluciones });
      const select = responseData.data.resoluciones.map((r: IResolucion) => ({
        id: r.ID,
        nombre: r.NUMERO,
      }));
      set({ selectResoluciones: select });
    } catch (error: any) {
      console.error(error);
      showErrorToast(error);
    } finally {
      set({ loading: false });
    }
  },
  setResolucion: async () => {
    set({ loading: true });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false });
      window.location.href = '/login';
      return false;
    }
    try {
      const response = await fetch(`${BASE_URL}api/seleccionarResolucion`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const responseData = await handleApiResponse(
        response,
        'No se pudo setear la resolucion'
      );

      return true;
    } catch (error: any) {
      console.error(error);
      showErrorToast(error);
      return false;
    } finally {
      set({ loading: false });
    }
  },
}));
