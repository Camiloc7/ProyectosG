import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { InfoProveedor } from '@/types/types';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import { confirm } from '@/components/feedback/ConfirmOption';

interface ProveedorData {
  id: string;
  nombre: string;
  nit: string;
  tipoDeDocumento: string;
  direccion: string;
  correo: string;
  telefono: string;
  ciudad: string;
  FIC: string;
  nombre1: string;
  nombre2: string;
  apellido1: string;
  apellido2: string;
  dv: string;
  nombreE: string;
  tipocuenta: string;
  numeroc: string;
  bancos: string;
  notificacion: string;
}

interface ProveedorStore {
  proveedores: { id: string; nombre: string }[]; // Cambiar el tipo para almacenar objetos con id y nombre
  proveedor: InfoProveedor | null;
  loading: boolean;
  listaDeProveedores: InfoProveedor[];
  error: string | null;
  success: boolean;
  fetchProveedor: (nit: string) => Promise<void>;
  createProveedor: (data: ProveedorData) => Promise<void>; // Cambiar 'object' por 'ProveedorData'
  actualizarProveedor: (data: InfoProveedor) => Promise<void>;
  fetchListaDeProveedores: () => Promise<void>;
  deleteProveedor: (nit: string) => Promise<void>;
  retencionesProveedor: (
    id: string | undefined,
    fecha: string,
    email: string
  ) => Promise<void>;
  saldosProveedor: (
    id: string | undefined,
    fecha: string,
    email: string
  ) => Promise<void>;
  reset: () => void;
}

const encodeData = (text: string): string => {
  return encodeURIComponent(Buffer.from(text, 'utf-8').toString('base64'));
};

const formatDate = (fecha: string): string => {
  const [year, month, day] = fecha.split('-');
  return `${day}-${month}-${year}`; // Convierte de yy-mm-dd a dd-mm-yy
};

export const useProveedorStore = create<ProveedorStore>((set, get) => ({
  proveedores: [],
  proveedor: null,
  listaDeProveedores: [],
  loading: false,
  error: null,
  success: false,

  // Función para obtener un proveedor
  fetchProveedor: async (nit) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/proveedores/oneProveedor?nitProveedor=${nit}`,
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Error al obtener proveedor');

      const { data } = await response.json();

      const proveedorTransformado = {
        id: data.ID,
        nombre: data.NOMBRE,
        nit: data.NIT,
        tipoDeDocumento: data.TIPOD,
        direccion: data.DIRECCION,
        correo: data.CORREO,
        telefono: data.TELEFONO,
        ciudad: data.CIUDAD,
        FIC: data.NOTI,
        nombre1: data.NOMBRE1,
        nombre2: data.NOMBRE2,
        apellido1: data.APELLIDO1,
        apellido2: data.APELLIDO2,
        dv: data.DV,
        nombreE: data.COMERCIO,
        tipocuenta: data.TIPOCUENTA,
        numeroc: data.NUMCUENTA,
        bancos: data.BANCO,
        notificacion: data.NOTI,
      };

      set({ proveedor: proveedorTransformado, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  // Función para crear proveedor
  createProveedor: async (data: ProveedorData) => {
    set({ loading: true, error: null, success: false });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const requestBody = JSON.stringify({
        nombre: data.nombre,
        nit: data.nit,
        tipoDeDocumento: data.tipoDeDocumento,
        direccion: data.direccion,
        correo: data.correo,
        telefono: data.telefono,
        ciudad: data.ciudad,
        FIC: data.FIC,
        nombre1: data.nombre1,
        nombre2: data.nombre2,
        apellido1: data.apellido1,
        apellido2: data.apellido2,
        dv: data.dv,
        nombreE: data.nombreE,
        tipocuenta: data.tipocuenta,
        numeroc: data.numeroc,
        bancos: data.bancos,
      });

      const response = await fetchWithTimeout(
        `${BASE_URL}api/proveedores/create`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: requestBody,
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
      get().fetchListaDeProveedores();
      set({ loading: false, success: true });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });
    }
  },

  // Función para obtener proveedores
  fetchListaDeProveedores: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/proveedores/getAll`,
        {
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Error al obtener los proveedores');
      }
      const { data } = await response.json();

      const statusOptions: Array<'enviando' | 'procesado' | 'completado'> = [
        'enviando',
        'procesado',
        'completado',
      ];

      const listaDeProveedores = Array.isArray(data)
        ? data.map((proveedor: any) => ({
            id: proveedor.ID,
            nombre: proveedor.NOMBRE,
            nit: proveedor.NIT,
            tipoDeDocumento: proveedor.TIPOD,
            direccion: proveedor.DIRECCION,
            correo: proveedor.CORREO,
            telefono: proveedor.TELEFONO,
            ciudad: proveedor.CIUDAD,
            FIC: proveedor.FIC,
            nombre1: proveedor.NOMBRE1,
            nombre2: proveedor.NOMBRE2,
            apellido1: proveedor.APELLIDO1,
            apellido2: proveedor.APELLIDO2,
            dv: proveedor.DV,
            nombreE: proveedor.COMERCIO,
            tipocuenta: proveedor.TIPOCUENTA,
            numeroc: proveedor.NUMCUENTA,
            bancos: proveedor.BANCO,
            notificacion:
              statusOptions[Math.floor(Math.random() * statusOptions.length)],
          }))
        : [];

      set({ listaDeProveedores, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  actualizarProveedor: async (data: InfoProveedor) => {
    set({ loading: true, error: null, success: false });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const requestBody = JSON.stringify({
        idProveedor: data.id,
        nombre: data.nombre,
        nit: data.nit,
        tipoDeDocumento: data.tipoDeDocumento,
        direccion: data.direccion,
        correo: data.correo,
        telefono: data.telefono,
        ciudad: data.ciudad,
        FIC: data.FIC,
        nombre1: data.nombre1,
        nombre2: data.nombre2,
        apellido1: data.apellido1,
        apellido2: data.apellido2,
        dv: data.dv,
        nombreE: data.nombreE,
        tipocuenta: data.tipocuenta,
        numeroc: data.numeroc,
        bancos: data.bancos,
        notificacion: data.notificacion,
      });

      const response = await fetchWithTimeout(
        `${BASE_URL}api/proveedores/update`,
        {
          method: 'PUT',
          headers: {
            authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: requestBody,
        }
      );

      if (!response.ok) {
        throw new Error('Error al realizar la solicitud al servidor');
      }

      const responseData = await response.json();

      if (responseData.status) {
        showTemporaryToast('Actualizado con éxito!');
        get().fetchListaDeProveedores();
        set({ loading: false, success: true, proveedor: null });
      } else {
        throw new Error(responseData.error || 'Error al actualizar el cliente');
      }
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });

      showErrorToast(`Error: ${error.message}`);
    }
  },

  //Funcion para eliminar un proveedor por nit
  deleteProveedor: async (nit) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const formData = new FormData();
      formData.append('nitProveedor', nit);

      const response = await fetchWithTimeout(
        `${BASE_URL}api/proveedores/delete`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Error al eliminar proveedor');

      get().fetchListaDeProveedores();
      showTemporaryToast('Proveedor Eliminado');
      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  // Función para saldos de un proveedor
  saldosProveedor: async (id, fecha, email) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    const fechaFormateada = formatDate(fecha);

    const fechaCodificada = encodeData(fechaFormateada);
    const emailCodificado = encodeData(email);

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}proveedores/saldos/${id}/${fechaCodificada}/${emailCodificado}`,
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Error al obtener saldos');

      const contentType = response.headers.get('Content-Type') || '';

      if (contentType.includes('application/pdf')) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const confirmado = await confirm({
          title: 'Se ha generado un archivo PDF. ¿Deseas descargarlo?',
        });
        if (confirmado) {
          const a = document.createElement('a');
          a.href = url;
          a.download = 'factura.pdf';
          a.click();
          URL.revokeObjectURL(url);
          set({ loading: false, error: null });

          // Recuperar el valor de vecesFacturado desde localStorage (si existe) o inicializar en 0
        } else {
          set({ loading: false, error: null });
        }

        // Incrementa el contador en localStorage
        const currentCount = parseInt(
          localStorage.getItem('facturasGeneradas') || '0',
          10
        );
        localStorage.setItem(
          'facturasGeneradas',
          (currentCount + 1).toString()
        );
      } else throw new Error('Error al obtener pdf');

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  // Función para retenciones de un proveedor
  retencionesProveedor: async (id, fecha, email) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    const fechaFormateada = formatDate(fecha);

    const fechaCodificada = encodeData(fechaFormateada);
    const emailCodificado = encodeData(email);

    try {
      const response = await fetch(
        `${BASE_URL}Certificado_Retenciones/certificadoretenciones/${id}/${fechaCodificada}/${emailCodificado}`,
        {
          headers: { authorization: `Bearer ${token}` },
        }
      );

      // const respuesta = response.json();

      // if (!response.ok) throw new Error('Error al obtener retenciones');
      const contentType = response.headers.get('Content-Type') || '';

      if (contentType.includes('application/pdf')) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const confirmado = await confirm({
          title: 'Se ha generado un archivo PDF. ¿Deseas descargarlo?',
        });
        if (confirmado) {
          const a = document.createElement('a');
          a.href = url;
          a.download = 'factura.pdf';
          a.click();
          URL.revokeObjectURL(url);
          set({ loading: false, error: null });

          // Recuperar el valor de vecesFacturado desde localStorage (si existe) o inicializar en 0
        } else {
          const respuesta = response.json();

          set({ loading: false, error: null });
        }

        // Incrementa el contador en localStorage
        const currentCount = parseInt(
          localStorage.getItem('facturasGeneradas') || '0',
          10
        );
        localStorage.setItem(
          'facturasGeneradas',
          (currentCount + 1).toString()
        );
      } else throw new Error('Error al obtener pdf');

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  reset: () => set({ proveedores: [] }),
}));
