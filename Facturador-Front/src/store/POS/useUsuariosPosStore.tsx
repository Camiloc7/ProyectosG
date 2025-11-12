import { create } from 'zustand';
import { API_POS, BASE_URL } from '@/helpers/ruta';
import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import { IFormUsuariosPos } from '@/features/POS/formUsuariosPos';
import { handleApiResponse } from '@/helpers/handleApiResponse';
import { getTokenPos } from '@/helpers/getTokenPOS';

function mapUsuarioPos(data: any): IFormUsuariosPos {
  return {
    id: data.id,
    establecimientoName: data.establecimiento_id,
    password: data.password,
    nombre: data.nombre,
    apellido: data.apellido,
    username: data.username,
    activo: data.activo,
    created_at: data.created_at,
    updated_at: data.updated_at,
    rolName: data.rol?.nombre || '',
  };
}
interface ICreateUserPos {
  establecimientoName: string;
  rolName: string;
  nombre: string;
  apellido: string;
  username: string;
  password: string;
  activo: boolean;
}
interface IUpdateUserPos {
  establecimientoName: string;
  rolName: string;
  nombre: string;
  apellido: string;
  username: string;
  password_nueva: string;
  activo: boolean;
}
interface UsuariosPosStore {
  loading: boolean;
  UsuariosPos: IFormUsuariosPos[];
  traerUsuariosPos: () => Promise<boolean>;
  crearUsuariosPos: (data: ICreateUserPos) => Promise<boolean>;
  actualizarUsuariosPos: (data: IUpdateUserPos, id: string) => Promise<boolean>;
  eliminarUsuariosPos: (id: string) => Promise<boolean>;
}

export const useUsuariosPosStore = create<UsuariosPosStore>((set, get) => ({
  loading: false,
  UsuariosPos: [],

  traerUsuariosPos: async () => {
    set({ loading: true });
    const token = await getTokenPos();

    try {
      const response = await fetchWithTimeout(`${API_POS}usuarios`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await handleApiResponse(
        response,
        'No se pudo traer a los usuarios'
      );

      const usuariosMapeados = responseData.data.map(mapUsuarioPos);
      set({ UsuariosPos: usuariosMapeados });

      return true;
    } catch (error: any) {
      console.error(error);
      showErrorToast(error);
      return false;
    } finally {
      set({ loading: false });
    }
  },
  crearUsuariosPos: async (data) => {
    set({ loading: true });
    const token = await getTokenPos();

    console.warn('LO QUE MANDO RAW PARA CREAR: ', data);
    try {
      const response = await fetchWithTimeout(`${API_POS}usuarios`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('No se pudo crear el usuario');
      }
      const responseData = await handleApiResponse(
        response,
        'No se pudo crear el usuario'
      );
      showTemporaryToast(responseData.message);
      await get().traerUsuariosPos();
      return true;
    } catch (error: any) {
      console.error(error);
      showErrorToast(error);
      return false;
    } finally {
      set({ loading: false });
    }
  },

  actualizarUsuariosPos: async (data, id) => {
    set({ loading: true });
    const token = await getTokenPos();

    console.warn('LO QUE MANDO RAW PARA ACTUIALIZAR: ', data);
    console.warn('ID', id);
    try {
      const response = await fetchWithTimeout(`${API_POS}usuarios/${id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await handleApiResponse(
        response,
        'No se pudo actualizar el usuario'
      );

      if (responseData.statusCode == '400') {
        showErrorToast(responseData.message);
        return false;
      }
      console.log(responseData);
      showTemporaryToast(responseData.message);
      await get().traerUsuariosPos();

      return true;
    } catch (error: any) {
      console.error(error);
      showErrorToast(error);
      return false;
    } finally {
      set({ loading: false });
    }
  },
  eliminarUsuariosPos: async (id) => {
    set({ loading: true });
    const token = await getTokenPos();

    console.warn('LO QUE MANDO RAW PARA Eliminar: ', id);
    try {
      const response = await fetchWithTimeout(`${API_POS}usuarios/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const responseData = await handleApiResponse(
        response,
        'No se pudo eliminar el usuario'
      );

      showTemporaryToast(responseData.message);
      await get().traerUsuariosPos();

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
