import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { API_POS, BASE_URL } from '@/helpers/ruta';
import handleGlobalLogOut from '../helpers/logOutGlobal';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import { todaLaInfoUsuario } from '@/types/types';
import { useAdminStore } from './useAdminStore';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';

interface User {
  id: string;
  usuario: string;
  nombre: string;
  correo: string;
  telefono?: string;
  nit: string;
  imagen: string;
  regimen: string;
  constructor: string;
  tipo_usuario: string;
  direccion?: string;
  [key: string]: any;
}

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  todaLaInfoUsuario: todaLaInfoUsuario | null;
  loading: boolean;
  error: string | null;
  infoDelUsuario: any;
  login: (
    username: string,
    password: string
  ) => Promise<{
    status: boolean;
    token: string;
    message: string;
    user: User;
  }>;

  loginGastro: (username: string, password: string) => Promise<void>;

  actualizarUsuario: (formData: Record<string, any>) => Promise<void>;

  register: (
    formData: Record<string, any>,
    imagen: File | null
  ) => Promise<User>;
  traerInfoDeUsuarios: () => Promise<
    | {
        nombre: string;
        correo: string;
        imagen: string;
        rol: string;
        constructora: string;
      }
    | undefined
  >;
  logout: () => void;
}

export const useUserStore = create<UserStore>()((set) => ({
  user: null,
  isAuthenticated: false,
  todaLaInfoUsuario: null,
  loading: false,
  error: null,
  infoDelUsuario: null,

  login: async (username, password) => {
    handleGlobalLogOut();
    set({ loading: true, error: null });
    try {
      const response = await fetchWithTimeout(`${BASE_URL}auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el login');
      }

      const data = await response.json();
      const { status, token, response: message, user } = data;

      if (!status) throw new Error(message || 'Error en el login');
      if (!token) throw new Error('Token no recibido');

      const expirationDate = new Date();
      expirationDate.setMinutes(expirationDate.getMinutes() + 120);
      const expires = `expires=${expirationDate.toUTCString()};`;

      const isLocal = window.location.hostname === 'localhost';
      const cookieOptions = `path=/; SameSite=Strict;`;

      if (isLocal) {
        document.cookie = `tokenFacturador=${token}; ${expires} ${cookieOptions}`;
      } else {
        document.cookie = `tokenFacturador=${token}; Secure; ${expires} ${cookieOptions}`;
      }

      set({
        isAuthenticated: true,
        user,
        loading: false,
        error: null,
      });

      return {
        status,
        token,
        message,
        user,
      };
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
      throw error;
    }
  },

  loginGastro: async (username, password) => {
    set({ loading: true });
    try {
      const response = await fetch(`${API_POS}auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el login');
      }

      const data = await response.json();

      if (data?.data?.access_token) {
        sessionStorage.setItem('tokenPOS', data.data.access_token);
      }
      set({
        loading: false,
      });
    } catch (error: any) {
      set({ loading: false });
    }
  },

  actualizarUsuario: async (datosUsuario) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();

    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }

    // Creamos FormData
    const formData = new FormData();
    for (const key in datosUsuario) {
      const value = datosUsuario[key];
      if (Array.isArray(value)) {
        // 👇 Convertimos el array a string separado por comas
        formData.append(key, value.join(','));
      } else {
        formData.append(key, value);
      }
    }

    console.warn(
      'DATOS QUE PASO AL BACK:',
      Object.fromEntries(formData.entries())
    );

    try {
      const url = `${BASE_URL}api/usuarios/actualizar`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          // NO agregues Content-Type con FormData, fetch lo maneja automáticamente
          authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const contentType = response.headers.get('Content-Type');

      if (!response.ok) {
        if (contentType?.includes('application/json')) {
          const respuestaJson = await response.json();
          console.error(respuestaJson);
          showErrorToast(
            respuestaJson.message ||
              'Hubo una respuesta inesperada del servidor. Por favor, contacta al soporte técnico.'
          );
          throw new Error(JSON.stringify(respuestaJson));
        } else {
          const texto = await response.text();
          showErrorToast(
            'Hubo una respuesta inesperada del servidor. Por favor, contacta al soporte técnico.'
          );
          throw new Error(texto);
        }
      }

      const respuestaJson = await response.json();
      if (respuestaJson.status) {
        showTemporaryToast(respuestaJson.message);
      } else {
        showErrorToast(respuestaJson.message);
      }

      // console.log(respuestaJson);
      set({ loading: false });
    } catch (error: any) {
      console.error('ERROR AL HACER POST EN ACTUALIZAR USUARIO', error);
      set({ loading: false });
    }
  },

  traerInfoDeUsuarios: async () => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/usuarios/obtenerUsuario`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener la información del usuario');
      }

      const objetos = await response.json();

      if (!objetos) {
        throw new Error('No se encontraron datos del usuario');
      }
      const objeto = objetos[0];

      if (!objeto) {
        throw new Error('No se encontraron datos del usuario');
      }

      // console.log(objetos);

      let imagenURL = objeto.IMAGEN.startsWith('./')
        ? `${BASE_URL}${objeto.IMAGEN.slice(2)}`
        : `${BASE_URL}${objeto.IMAGEN}`;

      imagenURL = imagenURL.replace('/index.php', '');

      const infoDelUsuario = {
        id: objeto.ID,
        nombre: objeto.NOMBRE,
        nit: objeto.NIT,
        correo: objeto.CORREO,
        imagen: imagenURL,
        rol: objeto.ID_ROL,
        limiteDisponible: objeto.LIMITE_DISPONIBLE,
        constructora: objeto.CONSTRUCTOR,
        fechaDeVencimiento: objeto.FECHA_VENCIMIENTO,
      };

      const todaLaInfoUsuario = {
        id: objeto.ID,
        idRol: objeto.ID_ROL,
        usuario: objeto.USUARIO,
        password: objeto.PASSWORD,
        nombre: objeto.NOMBRE,
        nit: objeto.NIT,
        fechaRegistro: objeto.FECHA_REGISTRO,
        fechaVencimiento: objeto.FECHA_VENCIMIENTO,
        limiteDeFacturacion: objeto.LIMITE_DE_FACTURACION,
        limiteDisponible: objeto.LIMITE_DISPONIBLE,
        montoFacturado: objeto.monto_facturado,
        regimen: objeto.REGIMEN,
        resolucion: objeto.RESOLUCION,
        resolucione: objeto.RESOLUCIONE,
        fechaResolucion: objeto.FECHA_RESOLUCION,
        fechaResolucion1: objeto.FECHA_RESOLUCION1,
        fechaResolucion2: objeto.FECHA_RESOLUCION2,
        fechaResolucionC: objeto.FECHA_RESOLUCIONC,
        actividadEconomica: objeto.ACTIVIDAD_ECONOMICA,
        facturaDesde: objeto.FACTURA_DESDE,
        facturaHasta: objeto.FACTURA_HASTA,
        prefijoe: objeto.PREFIJOE,
        facturaDesdeE: objeto.FACTURA_DESDEE,
        facturaHastaE: objeto.FACTURA_HASTAE,
        resolucionC: objeto.RESOLUCIONC,
        prefijoC: objeto.PREFIJOC,
        facturaDesdeC: objeto.FACTURA_DESDEC,
        facturaHastaC: objeto.FACTURA_HASTAC,
        responsabilidad: objeto.RESPONSABILIDAD,
        ica: objeto.ICA,
        direccion: objeto.DIRECCION,
        telefono: objeto.TELEFONO,
        correo: objeto.CORREO,
        correoAlt: objeto.CORREO_ALT,
        prefijo: objeto.PREFIJO,
        imagen: objeto.IMAGEN,
        imagen2: objeto.IMAGEN2,
        conteoFactura: objeto.CONTEO_FACTURA,
        conteoFactura2: objeto.CONTEO_FACTURA2,
        renovacion: objeto.RENOVACION,
        constructor: objeto.CONSTRUCTOR,
        recredito: objeto.RECREDITO,
        recredito2: objeto.RECREDITO2,
        numCredito: objeto.NUMCREDITO,
        membrete: objeto.MEMBRETE,
        membrete2: objeto.MEMBRETE2,
        consecutivoPago: objeto.CONSECUTIVOPAGO,
        tipoUsuario: objeto.TIPO_USUARIO,
        per1: objeto.PER1,
        responsabilidadTri: objeto.RESPONSABILIDADTRI,
        tipoCon: objeto.TIPOCON,
        pais: objeto.PAIS,
        departamento: objeto.DEPARTAMENTO,
        municipio: objeto.MUNICIPIO,
        ciiu: objeto.CIIU ? objeto.CIIU.split(',') : [],
        nomActividad: objeto.NOMACTIVIDAD,
        entidad: objeto.ENTIDAD,
        tipoCuenta: objeto.TIPOCUENTA,
        noCuenta: objeto.NOCUENTA,
        tipoDocEntidad: objeto.TIPODOCENTIDAD,
        identidad: objeto.IDENTIDAD,
        testid: objeto.TESTID,
        fechaCamara: objeto.FECHA_CAMARA,
        tsociedad: objeto.TSOCIEDAD,
        fechaCons: objeto.FECHA_CONS,
        representante: objeto.REPRESENTANTE,
        tipoPersona: objeto.TIPOPERSONA,
        dv: objeto.DV,
        tipoDoc: objeto.TIPODOC,
        conteoCarta: objeto.CONTEOCARTA,
        tokenApi: objeto.TOKENAPI,
        softwareId: objeto.SOFTWAREID,
        softwareCode: objeto.SOFTWARECODE,
        claveTecnica: objeto.CLAVETECNICA,
        registroMercantil: objeto.registro_mercantil,
        typeEnvironmentId: objeto.type_environment_id,
      };
      // console.log('Hecho', todaLaInfoUsuario);
      // Aquí almacenamos la información del usuario en el estado global
      set({ todaLaInfoUsuario, infoDelUsuario, loading: false });

      return infoDelUsuario;
    } catch (error) {
      let errorMessage = 'Error desconocido';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      window.location.href = '/login';

      set({ error: errorMessage, loading: false });
    }
  },

  register: async (formData, imagen) => {
    set({ loading: true, error: null });
    try {
      const jsonData = { ...formData };
      if (imagen) {
        const convertImageToBase64 = async (file: File) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        };
        jsonData.imagen = await convertImageToBase64(imagen);
      }

      const response = await fetchWithTimeout(`${BASE_URL}api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      const contentType = response.headers.get('Content-Type');

      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();

        //!EL BACK END RESPONDE ASI APESAR DE QUE SE CREE  BIEN EL USUARIO ASI QUE SOLO CONTINUAMOS CON EL PROCESO
        if (data.success === false && !data.error) {
          showTemporaryToast('Se creo el usuario exitosamente!');
          const state = useAdminStore.getState();
          await state.fetchAllUsers();
          set({ loading: false });
          return { success: true };
        }
        if (data.success === true) {
          showTemporaryToast('Se creo el usuario exitosamente!');
          set({ loading: false });
          const state = useAdminStore.getState();
          await state.fetchAllUsers();
          return { success: true };
        }
        set({ loading: false });
        showErrorToast(data.error);
        const state = useAdminStore.getState();

        await state.fetchAllUsers();
        return { success: true };
        return data;
      } else {
        const dataText = await response.text();
        throw new Error('Respuesta inesperada del servidor');
      }
    } catch (error: any) {
      set({ loading: false, error: error.message || 'Error desconocido' });
      throw error;
    }
  },

  logout: () => {
    Cookies.remove('gastroToken'); //ELiminamos el token del admin gastro si hay

    set({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      infoDelUsuario: null,
    });
  },
  // Función de reset del store
  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      infoDelUsuario: null,
    }),
}));
