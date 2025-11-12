import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { getTokenPos } from '@/helpers/getTokenPOS';
import { handleApiResponse } from '@/helpers/handleApiResponse';
import { API_POS, RUTA_27001 } from '@/helpers/ruta';
import { fetchWithTimeout } from '@/helpers/timefetch';
import { create } from 'zustand';

interface LocationState {
  loading: boolean;
  departamentos: any;
  eliminarEstablecimiento: (id: string) => Promise<boolean>;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  loading: false,
  departamentos: [],

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

      const responseData = await handleApiResponse(
        response,
        'No se pudo eliminar el establecimiento'
      );

      showTemporaryToast(responseData.message);
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
