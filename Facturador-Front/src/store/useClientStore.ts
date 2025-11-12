import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { InfoClientes } from '@/types/types';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';

interface ClientData {
  nombre: string;
  NIT: string;
  direccion: string;
  correo: string;
  resposabilidadFiscal: string;
  tipoDeContribuyente: string;
  pais: string;
  departamento: string;
  tipoDeOrganizacion: string;
  doc: string;
  CODIGO: string;
  nombre1: string;
  nombre2: string;
  apellido1: string;
  apellido2: string;
  telefono: string;
  ciudad: string;
  FIC: string;
  DV: string;
  nombreE: string;
  tipo_documento_id: string;
}

interface ClientStore {
  clientes: { id: string; nombre: string }[]; // Cambiar el tipo para almacenar objetos con id y nombre
  loading: boolean;
  listaDeClientes: InfoClientes[];
  error: string | null;
  success: boolean;
  codigoClienteNuevo: string;
  fetchClientes: () => Promise<void>;
  createCliente: (data: ClientData) => Promise<void>; // Cambiar 'object' por 'ClientData'
  actualizarCliente: (data: InfoClientes) => Promise<void>;
  fetchCodigoClienteNuevo: () => Promise<void>;
  fetchListaDeClientes: () => Promise<void>;
  reset: () => void;
}

export const useClientStore = create<ClientStore>((set, get) => ({
  clientes: [],
  listaDeClientes: [],
  codigoClienteNuevo: '',
  loading: false,
  error: null,
  success: false,

  // Función para obtener clientes
  fetchClientes: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(`${BASE_URL}api/usuarios/`, {
        headers: { authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Error al obtener los clientes');

      const data = await response.json();
      const clientes = Array.isArray(data)
        ? data.map((cliente: any) => ({
            id: cliente.ID,
            nombre: cliente.NOMBRE,
          }))
        : [];

      set({ clientes, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  // Función para crear cliente
  createCliente: async (data: ClientData) => {
    set({ loading: true, error: null, success: false });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const formData = new FormData();

      formData.append('nombre', data.nombre);
      formData.append('nit', data.NIT);
      formData.append('direccion', data.direccion);
      formData.append('correo', data.correo);
      formData.append('resposabilidadFiscal', data.resposabilidadFiscal);
      formData.append('tipoDeContribuyente', data.tipoDeContribuyente);
      formData.append('pais', data.pais);
      formData.append('departamento', data.departamento);
      formData.append('tipoDeOrganizacion', data.tipoDeOrganizacion);
      formData.append('doc', data.doc);
      formData.append('CODIGO', data.CODIGO);
      formData.append('nombre1', data.nombre1);
      formData.append('nombre2', data.nombre2);
      formData.append('apellido1', data.apellido1);
      formData.append('apellido2', data.apellido2);
      formData.append('telefono', data.telefono);
      formData.append('ciudad', data.ciudad);
      formData.append('FIC', data.FIC);
      formData.append('DV', data.DV);
      formData.append('nombreE', data.nombreE);
      formData.append('tipo_documento_id', data.tipo_documento_id);

      // Log para depuración
      const formDataObject: Record<string, string> = {};
      for (const pair of formData.entries()) {
        formDataObject[pair[0]] = pair[1] as string;
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}api/usuarios/crearcliente`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al realizar la solicitud al servidor');
      }

      const responseData = await response.json();

      if (responseData.resultado === 'error') {
        throw new Error(responseData.mensaje || 'Error al crear el cliente');
      }

      showTemporaryToast('Creado con éxito!');

      if (response.status === 200 || response.status === 201) {
        await get().fetchClientes();
      } else {
        throw new Error('Error al crear el cliente');
      }

      set({ loading: false, success: true });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error al crear cliente:', error.message);
    }
  },

  fetchCodigoClienteNuevo: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/usuarios/codigoClienteNuevo`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener el codigo del cliente nuevo');
      }

      const data = await response.json();

      const codigoClienteNuevo = data.Codigo_Nuevo_Cliente;

      set({ codigoClienteNuevo, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  // Función para obtener clientes
  fetchListaDeClientes: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(`${BASE_URL}api/usuarios/`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Error al obtener los clientes');
      }
      const data = await response.json();

      const listaDeClientes = Array.isArray(data)
        ? data.map((cliente: any) => ({
            id: cliente.ID,
            cliente: cliente.NOMBRE || '',
            correo: cliente.CORREO || '',
            codigo: cliente.CODIGO || '',
            documento: cliente.NIT || '',
            telefono: cliente.TELEFONO || '',
            pais: cliente.PAIS || '',
            tipoDeDocumento: cliente.tipo_documento_id || '',
            dv: cliente.DV || '',
            tipoDeOrganizacion: cliente.TIPOPERSONA || '',
            notificaciones: cliente.NOTI || '',
            direccion: cliente.DIRECCION || '',
            responsabilidadesFiscales: cliente.RESPONSABILIDADTRI || '',
            tipoDeContribuyente: cliente.TIPOCON || '',
            departamento: cliente.DEPARTAMENTO || '',
            municipio: cliente.CIUDAD || '',
          }))
        : [];

      set({ listaDeClientes, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  actualizarCliente: async (data: InfoClientes) => {
    set({ loading: true, error: null, success: false });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const formData = new FormData();

      formData.append('ID', data.id);
      formData.append('NOMBRE', data.cliente);
      formData.append('CORREO', data.correo);
      formData.append('CODIGO', data.codigo);
      formData.append('PAIS', data.pais);
      formData.append('TELEFONO', data.telefono);
      formData.append('DV', data.dv);
      formData.append('TIPOPERSONA', data.tipoDeOrganizacion);
      formData.append('NOTI', data.notificaciones);
      formData.append('DIRECCION', data.direccion);
      formData.append('RESPONSABILIDADTRI', data.responsabilidadesFiscales);
      formData.append('TIPOCON', data.tipoDeContribuyente);
      formData.append('DEPARTAMENTO', data.departamento);
      formData.append('CIUDAD', data.municipio);
      formData.append('NIT', data.documento);
      formData.append('TIPOD', data.tipoDeDocumento);
      formData.append('tipo_documento_id', data.tipoDeDocumento);

      // Log para depuración con objeto estructurado
      const formDataObject: Record<string, string> = {};
      for (const pair of formData.entries()) {
        formDataObject[pair[0]] = pair[1] as string;
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}api/usuarios/actualizarCliente2/${data.id}`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al realizar la solicitud al servidor');
      }

      const responseData = await response.json();

      if (responseData.status) {
        showTemporaryToast('Actualizado con éxito!');
        get().fetchListaDeClientes();
        set({ loading: false, success: true });
      } else {
        throw new Error(responseData.error || 'Error al actualizar el cliente');
      }
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
      console.error('Error al actualizar cliente:', error.message);
      showErrorToast(`Error: ${error.message}`);
    }
  },

  reset: () => set({ clientes: [] }),
}));
