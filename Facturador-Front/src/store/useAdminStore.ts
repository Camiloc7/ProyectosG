import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import { todaLaInfoUsuario, UsuarioAdmin } from '@/types/types';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';

interface AdminStore {
  numeroDeFacturasEmitidas: number;
  loading: boolean;
  usuarios: UsuarioAdmin[];
  error: string | null; // Agregar esta línea
  infoUser: todaLaInfoUsuario | null;
  success: boolean;
  fetchCantidadDeFacturas: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  asignarAdminAUsuario: (idAdmin: string, idUsuario: string) => Promise<void>;
  desvincularAdminDeUsuario: (
    idAdmin: string,
    idUsuario: string
  ) => Promise<void>;

  fetchInfoUsuario: (idUsuario: string) => Promise<todaLaInfoUsuario | null>;
  fetchUsuariosByTokenAdmin: () => Promise<void>;
  actualizarInfoDeUsuario: (idUsuario: string, data: object) => Promise<void>;
  habilitarDeshabilitarUsuarios: (idUsuario: string) => Promise<void>;
}

export const useAdminStore = create<AdminStore>((set) => ({
  numeroDeFacturasEmitidas: 0,
  usuarios: [],
  infoUser: null,
  loading: false,
  error: null,
  success: false,

  fetchCantidadDeFacturas: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/facturas/getCantidad`,
        {
          method: 'GET',
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener respuesta del back');
      }
      const numeroDeFacturasEmitidas = await response.json();

      set({ numeroDeFacturasEmitidas, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  fetchAllUsers: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}/admin/usuarios/getAll`,
        {
          method: 'GET',
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener respuesta del back');
      }
      const allUsers = await response.json();

      if (!allUsers.status) {
        set({
          loading: false,
          error: 'Error al obtener usuarios',
          success: false,
        });
        throw new Error('Error al obtener usuarios');
      }

      const usuarios = Array.isArray(allUsers.usuarios)
        ? allUsers.usuarios.map((user: any) => {
            return {
              id: user.ID || '---',
              correo: user.CORREO || '---',
              nit: user.NIT || '---',
              nombre: user.NOMBRE || '---',
              telefono: user.TELEFONO || '---',
              imagen: user.IMAGEN
                ? `${BASE_URL.replace(
                    /index\.php\/?$/,
                    ''
                  )}${user.IMAGEN.replace(/^[\.\/]+/, '')}`
                : '---',
              rol: user.ID_ROL || '---',
              administradoresAsignados: user.ADMINISTRADORES,
              activo: user.ACTIVO,
            };
          })
        : [];

      set({ usuarios, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  asignarAdminAUsuario: async (idAdmin: string, idUsuario: string) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}admin/usuarios/asignar-admin-usuario/${idAdmin}/${idUsuario}`,
        {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener respuesta del back');
      }
      const responseData = await response.json();

      if (!responseData.status) {
        set({
          loading: false,
          error: 'Error al obtener usuarios',
          success: false,
        });
        showErrorToast('Algo salio mal al asignar el admin');
        throw new Error('Error al obtener usuarios');
      }

      const state = useAdminStore.getState();
      await state.fetchAllUsers();

      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  desvincularAdminDeUsuario: async (idAdmin: string, idUsuario: string) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}admin/usuarios/delete/${idAdmin}/${idUsuario}`,
        {
          method: 'DELETE',
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener respuesta del back');
      }
      const responseData = await response.json();

      if (!responseData.status) {
        showErrorToast('Algo salio mal al desasignar el admin');
        throw new Error('Error al desasignar el admin');
      }

      const state = useAdminStore.getState();
      await state.fetchAllUsers();

      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  fetchInfoUsuario: async (
    idUsuario: string
  ): Promise<todaLaInfoUsuario | null> => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return null;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}admin/usuarios/datos-usuario/${idUsuario}`,
        {
          method: 'GET',
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener respuesta del back');
      }
      const text = await response.text(); // Leer como texto primero
      if (!text) {
        showErrorToast('Respuesta vacia del servidor');
        throw new Error('Respuesta vacía del servidor');
      }

      const usuario = JSON.parse(text); // Ahora convertirlo a JSON

      if (!usuario.status) {
        set({
          loading: false,
          error: 'Error al obtener el usuario',
          success: false,
        });
        showErrorToast('Algo salio mal al obtener el usuario');
        throw new Error('Error al obtener el usuario');
      }

      const transformDataToInfoUser = (data: any): todaLaInfoUsuario => ({
        id: data.ID || '',
        idRol: data.ID_ROL || '',
        correo: data.CORREO || '',
        usuario: data.USUARIO || '',
        nombre: data.NOMBRE || '',
        nit: data.NIT || '',
        direccion: data.DIRECCION || '',
        telefono: data.TELEFONO || '',
        tipoDeOrganizacion: data.ID_TIPO_ORGANIZACION || '',
        regimen: data.REGIMEN || '',
        tipoDoc: data.tipoDocumento || '',
        constructor: data.CONSTRUCTOR || '',
        // password: data.ID||"",
        // estado:data.ESTADO||"",
        limiteDeFacturacion: data.LIMITE_DE_FACTURACION || '',
        limiteDisponible: data.LIMITE_DISPONIBLE || '',
        montoFacturado: data.monto_facturado || '',
        // ciiu: data.C||"",
        dv: data.DV || '',
        fechaDeRegistro: data.FECHA_REGISTRO || '',
        fechaVencimiento: data.FECHA_VENCIMIENTO || '',
      });

      const infoUser = transformDataToInfoUser(usuario.usuario);

      set({ infoUser, success: true, loading: false });
      return infoUser; // Se retorna la información para uso inmediato
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
      throw error;
    }
  },

  actualizarInfoDeUsuario: async (idUsuario: string, data: object) => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}admin/usuarios/update/${idUsuario}`,
        {
          method: 'PUT',
          headers: {
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json', // Se indica que se enviará JSON
          },
          body: JSON.stringify(data), // Se convierte el objeto a JSON correctamente
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error('Error al obtener respuesta del back');
      }

      if (!responseData.status) {
        set({
          loading: false,
          error: 'Error al actualizar el usuario',
          success: false,
        });
        showErrorToast('Algo salió mal al actualizar el usuario');
        throw new Error('Error al actualizar el usuario');
      }
      showTemporaryToast('Usuario  Actualizado', 1800);

      const state = useAdminStore.getState();
      await state.fetchAllUsers();

      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  fetchUsuariosByTokenAdmin: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}admin/usuarios/get-usuarios`,
        {
          method: 'GET',
          headers: { authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        throw new Error('Error al obtener respuesta del back');
      }
      const allUsers = await response.json();

      if (!allUsers.status) {
        set({
          loading: false,
          error: 'Error al obtener usuarios',
          success: false,
        });
        throw new Error('Error al obtener usuarios');
      }

      const usuarios = Array.isArray(allUsers.usuarios)
        ? allUsers.usuarios.map((user: any) => {
            return {
              id: user.ID || '---',
              correo: user.CORREO || '---',
              nit: user.NIT || '---',
              nombre: user.NOMBRE || '---',
              telefono: user.TELEFONO || '---',
              imagen: user.IMAGEN
                ? `${BASE_URL.replace(
                    /index\.php\/?$/,
                    ''
                  )}${user.IMAGEN.replace(/^[\.\/]+/, '')}`
                : '---',
              rol: user.ID_ROL || '---',
              administradoresAsignados: user.ADMINISTRADORES,
              activo: user.ACTIVO,
            };
          })
        : [];

      set({ usuarios, success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  habilitarDeshabilitarUsuarios: async (idUsuario: string) => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}admin/usuarios/activar-desactivar/${idUsuario}`,
        {
          method: 'PUT',
          headers: {
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json', // Se indica que se enviará JSON
          },
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error('Error al obtener respuesta del back');
      }

      if (!responseData.status) {
        set({
          loading: false,
          error: 'Error al actualizar el usuario',
          success: false,
        });
        showErrorToast('Algo salió mal al modificar el estado del usuario');
        throw new Error('Error al modificar el estado del usuario');
      }
      showTemporaryToast(responseData.message);

      const state = useAdminStore.getState();
      await state.fetchAllUsers();

      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },
}));
