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

export interface ISelect {
  id: string;
  nombre: string;
}
interface RolesPosState {
  loading: boolean;
  rolesPos: ISelect[];
  traerRoles: () => Promise<boolean>;
  //   crearEstablecimiento: (data: IFormrolesPos) => Promise<boolean>;
  //   eliminarEstablecimiento: (id: string) => Promise<boolean>;
}

export const useRolesPosStore = create<RolesPosState>((set, get) => ({
  loading: false,
  rolesPos: [],

  traerRoles: async () => {
    set({ loading: true });
    const token = await getTokenPos();

    try {
      const response = await fetchWithTimeout(`${API_POS}roles`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await handleApiResponse(
        response,
        'No se pudo traer los roles'
      );

      // Transformar la data para adaptarla a la interfaz ISelect
      const rolesAdaptados: ISelect[] = (responseData.data || []).map(
        (rol: any) => ({
          id: rol.id,
          nombre: rol.nombre,
        })
      );

      set({ rolesPos: rolesAdaptados });
      return true;
    } catch (error: any) {
      console.error(error);
      // showErrorToast(error);
      return false;
    } finally {
      set({ loading: false });
    }
  },
  // crearEstablecimiento: async (data) => {
  //   set({ loading: true });
  //   const token = await getTokenPos();

  //   console.warn('LO QUE MANDO RAW PARA CREAR: ', data);
  //   try {
  //     const response = await fetchWithTimeout(`${API_POS}establecimientos`, {
  //       method: 'POST',
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(data),
  //     });

  //     const responseData = await handleApiResponse(
  //       response,
  //       'No se pudo crear el establecimiento'
  //     );

  //     showTemporaryToast(responseData.message);

  //     await get().traerEstablecimientos();
  //     return true;
  //   } catch (error: any) {
  //     console.error(error);
  //     showErrorToast(error);
  //     return false;
  //   } finally {
  //     set({ loading: false });
  //   }
  // },

  // eliminarEstablecimiento: async (id) => {
  //   set({ loading: true });
  //   const token = await getTokenPos();

  //   try {
  //     const response = await fetchWithTimeout(
  //       `${API_POS}establecimientos/${id}`,
  //       {
  //         method: 'DELETE',
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           'Content-Type': 'application/json',
  //         },
  //       }
  //     );

  //     const data = await handleApiResponse(
  //       response,
  //       'No se pudo eliminar el establecimiento'
  //     );

  //     showTemporaryToast(data.message);
  //     return true;
  //   } catch (error: any) {
  //     console.error(error);
  //     showErrorToast(error);
  //     return false;
  //   } finally {
  //     set({ loading: false });
  //   }
  // },
}));
