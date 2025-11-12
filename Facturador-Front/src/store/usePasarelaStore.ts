import { create } from 'zustand';
import { BASE_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import { FormPasarelaDePagos, FormTarjeta } from '@/types/types';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';

interface PasarelaStore {
  loading: boolean;
  dataPlanes: object;
  error: string | null;
  success: boolean;
  sendTarjetaForm: (data: FormTarjeta) => Promise<void>;
  sendConfirmacionDePago: (
    data: FormPasarelaDePagos,
    id: string
  ) => Promise<void>;
  fetchPlanes: () => Promise<void>;
}

export const usePasarelaStore = create<PasarelaStore>((set) => ({
  dataPlanes: [],
  loading: false,
  error: null,
  success: false,

  sendTarjetaForm: async (data: FormTarjeta) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    const formData = new FormData();
    formData.append('card_name', data.nombreDeTarjeta);
    formData.append('card_number', data.numeroDeTarjeta);
    formData.append('card_cvc', data.CVC);
    formData.append('card_exp_month', data.mesExp);
    formData.append('card_exp_year', data.añoExp);

    // Log para depuración con objeto estructurado
    const formDataObject: Record<string, string> = {};
    for (const pair of formData.entries()) {
      formDataObject[pair[0]] = pair[1] as string;
    }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/suscripcion/tokenizar`,
        {
          method: 'POST',
          headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener las regiones');
      }

      const data = await response.json();

      if (data && !data.error) {
        showTemporaryToast('Tarjeta agregada exitosamente!');
        set({ success: true, loading: false });
      } else {
        showErrorToast(`Algo salio mal${data.error}`);

        set({ success: false, loading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  sendConfirmacionDePago: async (data: FormPasarelaDePagos, id: string) => {
    set({ loading: true, error: null, success: false });

    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    const formattedData = {
      id_plan: id,
      doc_type: data.documento,
      doc_number: data.tipoDeDocumento,
    };

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/suscripcion/pagoSuscripcion`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token}`,
          },
          body: formattedData,
        }
      );

      if (!response.ok) {
        throw new Error('Error al realizar la solicitud al servidor');
      }

      const responseData = await response.json();

      if (!responseData.status) {
        showTemporaryToast(responseData.message);
        set({
          loading: false,
          success: false,
        });
        return;
      }
      set({
        loading: false,
        success: true,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        loading: false,
        success: false,
      });

      showErrorToast(`Error: ${error.message}`);
    }
  },

  fetchPlanes: async () => {
    set({ loading: true, error: null });
    // const token = getTokenFromCookies();
    // if (!token) {
    //   set({ loading: false, error: 'Token no disponible' });
    //   return;
    // }

    try {
      const response = await fetchWithTimeout(
        `${BASE_URL}api/planes/getPlanes2`,
        {
          method: 'GET',
          // headers: { authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error('Error al obtener los planes');
      }

      const data = await response.json();
      if (data.status) {
        const dataPlanes = data.planes.planes;
        set({ dataPlanes, success: true, loading: false });
      } else {
        set({ success: false, loading: false });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        set({ error: error.message || 'Error desconocido', loading: false });
      } else {
        set({ error: 'Error desconocido', loading: false });
      }
    }
  },
}));
