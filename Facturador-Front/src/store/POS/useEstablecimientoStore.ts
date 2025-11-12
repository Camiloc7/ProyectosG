import { create } from 'zustand';
import { API_POS } from '@/helpers/ruta';
import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import { IFormEstablecimientos } from '@/features/POS/formEstablecimientos';
import { handleApiResponse } from '@/helpers/handleApiResponse';
import { getTokenPos } from '@/helpers/getTokenPOS';
import { ISelect } from './useRolesStorePos';

interface EstablecimientoStore {
  loading: boolean;
  listaEstablecimientos: ISelect[];
  establecimientos: IFormEstablecimientos[];
  selectEstablecimientosPorNit: ISelect[];

  traerEstablecimientos: () => Promise<boolean>;

  traerEstablecimientosPorNit: (nit: string) => Promise<void>;
  crearEstablecimiento: (data: IFormEstablecimientos) => Promise<boolean>;
  actualizarEstablecimiento: (
    data: IFormEstablecimientos,
    id: string
  ) => Promise<boolean>;
  eliminarEstablecimiento: (id: string) => Promise<boolean>;
}

export const useEstablecimientoStore = create<EstablecimientoStore>(
  (set, get) => ({
    loading: false,
    establecimientos: [],
    listaEstablecimientos: [],
    selectEstablecimientosPorNit: [],

    traerEstablecimientos: async () => {
      set({ loading: true });
      const token = await getTokenPos();

      try {
        const response = await fetchWithTimeout(`${API_POS}establecimientos`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const responseData = await handleApiResponse(
          response,
          'No se pudo traer los establecimientos'
        );

        // Transformar la data para adaptarla a la interfaz IListaEstablecimientos
        const establecimientosFormateados: ISelect[] = (
          responseData.data || []
        ).map((rol: any) => ({
          id: rol.id,
          nombre: rol.nombre,
        }));

        set({
          listaEstablecimientos: establecimientosFormateados,
          establecimientos: responseData.data,
        });
        return true;
      } catch (error: any) {
        console.error(error);
        showErrorToast(error);
        return false;
      } finally {
        set({ loading: false });
      }
    },
    crearEstablecimiento: async (data) => {
      set({ loading: true });
      const token = await getTokenPos();

      console.warn('LO QUE MANDO RAW PARA CREAR: ', data);
      try {
        const response = await fetchWithTimeout(`${API_POS}establecimientos`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        const responseData = await handleApiResponse(
          response,
          'No se pudo crear el establecimiento'
        );

        if (
          responseData.statusCode === 500 ||
          responseData.statusCode === 400 ||
          responseData.statusCode === 401
        ) {
          showErrorToast(
            responseData.message || 'No se pudo crear el establecimiento'
          );
          return false;
        }
        showTemporaryToast(responseData.message);

        await get().traerEstablecimientos();
        return true;
      } catch (error: any) {
        console.error(error);
        showErrorToast(error);
        return false;
      } finally {
        set({ loading: false });
      }
    },

    actualizarEstablecimiento: async (data, id) => {
      set({ loading: true });
      const token = await getTokenPos();

      console.warn('LO QUE MANDO RAW PARA ACTUIALIZAR: ', data);

      try {
        const response = await fetchWithTimeout(
          `${API_POS}establecimientos/${id}`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          }
        );

        const responseData = await handleApiResponse(
          response,
          'No se pudo actualizar el establecimiento'
        );

        showTemporaryToast(responseData.message);
        await get().traerEstablecimientos();

        return true;
      } catch (error: any) {
        console.error(error);
        showErrorToast(error);
        return false;
      } finally {
        set({ loading: false });
      }
    },
    eliminarEstablecimiento: async (id) => {
      set({ loading: true });
      const token = await getTokenPos();

      try {
        const response = await fetchWithTimeout(
          `${API_POS}establecimientos/${id}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        const data = await handleApiResponse(
          response,
          'No se pudo eliminar el establecimiento'
        );
        if (data.statusCode === 500) {
          showErrorToast('No se pudo eliminar el establecimiento');
          return false;
        }

        showTemporaryToast(data.message);
        return true;
      } catch (error: any) {
        console.error(error);
        showErrorToast(error);
        return false;
      } finally {
        set({ loading: false });
      }
    },
    traerEstablecimientosPorNit: async (nit) => {
      set({ loading: true });

      try {
        const response = await fetch(
          `${API_POS}establecimientos/listar-por-nit/${nit}`,
          {
            method: 'GET',
          }
        );

        const responseData = await handleApiResponse(
          response,
          'No se pudo traer los establecimientos'
        );

        // Transformar la data para adaptarla a la interfaz IListaEstablecimientos
        const establecimientosFormateados: ISelect[] = (
          responseData.data.establecimientos || []
        ).map((rol: any) => ({
          id: rol.id,
          nombre: rol.nombre,
        }));

        set({ selectEstablecimientosPorNit: establecimientosFormateados });
      } catch (error: any) {
        console.error(error);
        showErrorToast(error);
      } finally {
        set({ loading: false });
      }
    },
  })
);
