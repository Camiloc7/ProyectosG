import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';

interface ConfigApiStore {
  documentos: string[];
  companyInfo: Object | null;
  responsabilidades: string[];
  loading: boolean;
  error: string | null;
  success: boolean;
  sendApiCompany: (form: object) => Promise<void>;
  sendApiSoftware: (form: object) => Promise<void>;
  sendApiCertificado: (form: object) => Promise<void>;
  sendApiResolucion: (form: object) => Promise<void>;
  sendTestID: (form: object) => Promise<void>;
  getCompany: () => Promise<void>;
  configApiResoluciones: () => Promise<void>;
  sendPrimerosEnvios: () => Promise<void>;
  pasarAProduccion: () => Promise<void>;
}

export const useConfigApiStore = create<ConfigApiStore>((set) => ({
  documentos: [],
  responsabilidades: [],
  companyInfo: null,
  loading: false,
  error: null,
  success: false,

  sendApiCompany: async (form: object) => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      // Convertir el objeto form en FormData
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as string | Blob);
        }
      });

      // Log del FormData antes de enviarlo

      for (const pair of formData.entries()) {
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}config-api/formulario/company`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData, // Enviar el FormData en el body
        }
      );

      const contentType = response.headers.get('Content-Type');

      // const html = await response.text();

      const data = await response.json();

      if (data.status === 'error') {
        showErrorToast('Hubo un error. ' + data.message);
      } else {
        showTemporaryToast('Se actualizo correctamente!');
      }

      set({ success: true, loading: false });
    } catch (error: any) {
      showErrorToast('Hubo un error. ' + error);

      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  getCompany: async () => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}config-api/formulario/company`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      const contentType = response.headers.get('Content-Type');

      const data = await response.json();

      const companyInfo = {
        nombre: data.NOMBRE,
        correo: data.CORREO,
      };

      set({ companyInfo, success: true, loading: false });
    } catch (error: any) {
      showErrorToast('Hubo un error. ' + error);

      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  sendApiSoftware: async (form: object) => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      // Convertir el objeto form en FormData
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as string | Blob);
        }
      });

      // Log del FormData antes de enviarlo

      for (const pair of formData.entries()) {
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}config-api/formulario/sofware`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData, // Enviar el FormData en el body
        }
      );

      const contentType = response.headers.get('Content-Type');

      const data = await response.json();

      showTemporaryToast('Se actualizo correctamente!');
      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  sendApiCertificado: async (form: object) => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      // Convertir el objeto form en FormData
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as string | Blob);
        }
      });

      // Log del FormData antes de enviarlo

      for (const pair of formData.entries()) {
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}config-api/formulario/certificate`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData, // Enviar el FormData en el body
        }
      );

      const contentType = response.headers.get('Content-Type');

      // const html = await response.text();

      const data = await response.json();

      if (data === 'Faltan campos.') {
        showErrorToast('Faltan campos.');
      } else if (!data.status) {
        showErrorToast(data.message);
      } else {
        showTemporaryToast('Se actualizo correctamente!');
      }
      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  sendApiResolucion: async (form: object) => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      // Convertir el objeto form en FormData
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as string | Blob);
        }
      });

      // Log del FormData antes de enviarlo

      for (const pair of formData.entries()) {
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}config-api/formulario/resolution`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData, // Enviar el FormData en el body
        }
      );

      const contentType = response.headers.get('Content-Type');

      // const html = await response.text();

      const data = await response.json();

      if (!data.status) {
        showErrorToast(data.message);
      } else {
        showTemporaryToast('Se actualizo correctamente!');
      }

      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  sendTestID: async (form: object) => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      // Convertir el objeto form en FormData
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as string);
        }
      });

      // Log del FormData antes de enviarlo

      for (const pair of formData.entries()) {
      }

      const response = await fetchWithTimeout(
        `${BASE_URL}config-api/formulario/test-id`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formData, // Enviar el FormData en el body
        }
      );

      const contentType = response.headers.get('Content-Type');

      const data = await response.json();

      if (data.status) {
        showTemporaryToast('Se actualizo correctamente!');
      } else {
        showErrorToast('Hubo un error. ' + data.message);
      }

      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  configApiResoluciones: async () => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}config-api/resolutiones`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      const contentType = response.headers.get('Content-Type');

      const data = await response.json();

      if (data.status) {
        const state = useConfigApiStore.getState();
        await state.sendPrimerosEnvios();
      } else {
        showErrorToast('Hubo un error. ' + data.message);
      }

      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  sendPrimerosEnvios: async () => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}config-api/primeros-envios`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      const contentType = response.headers.get('Content-Type');

      const data = await response.json();

      if (data.status) {
        showTemporaryToast('Se actualizo correctamente!');
      } else {
        showErrorToast('Hubo un error. ' + data.message);
      }

      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  pasarAProduccion: async () => {
    set({ loading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}config-api/pasarAProduccion`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      const contentType = response.headers.get('Content-Type');

      // const data = await response.json();
      const data = await response.text();

      // if (data.status) {
      //   showErrorToast('Se actualizo correctamente!');
      // } else {
      //   showErrorToast('Hubo un error. ' + data.message);
      // }

      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },
}));
