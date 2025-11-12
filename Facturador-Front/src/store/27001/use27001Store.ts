import { create } from 'zustand';
import { RUTA_27001 } from '@/helpers/ruta';

import { fetchWithTimeout } from '@/helpers/timefetch';
import { IPDF } from '@/types/Planificacion/Planificacion.types';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import { compressImage } from '@/helpers/CompressImage';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';

// Definimos tipos correctos de datos primitivos
export interface IUsuarioItem {
  peso: number;
  calificacionItem: 0 | 1 | 2;
  cumplimiento: number;
}

// Extendemos IItems, normalizando numéricos
export interface IPlaneacionItem {
  id: number;
  actividad: string;
  codigo: string;
  valorItemEstandar: number;
  usuarioItem?: IUsuarioItem;
}

interface PlaneacionState {
  info: any;
  listaDeItems: IPlaneacionItem[];
  loading: boolean;
  error: string | null;
  success: boolean;
  fetchPDFInfo: (itemId: number) => Promise<IPDF | void>;
  uploadImage: (image: File) => Promise<string>;
  deleteImage: (key: String) => Promise<void>;
  proxyImage: (url: String) => Promise<any>;
  cleanPDFData: () => Promise<void>;
  fetchLista: () => Promise<void>;
  postPDF: (data: object, wannaShowToast: boolean) => Promise<void>;
  updateUsuarioItem: (data: {
    itemId: number;
    peso: number;
    calificacionItem: 0 | 1 | 2;
    cumplimiento: number;
  }) => Promise<void>;
  updateLocalUsuarioItem: (
    itemId: number,
    changes: Partial<IUsuarioItem>
  ) => void;
}

export const usePlaneacionStore = create<PlaneacionState>((set, get) => ({
  info: null,
  listaDeItems: [],
  loading: false,
  error: null,
  success: false,

  updateLocalUsuarioItem: (itemId, changes) =>
    set((state) => ({
      listaDeItems: state.listaDeItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              usuarioItem: {
                peso:
                  changes.peso ??
                  item.usuarioItem?.peso ??
                  Number(item.valorItemEstandar),
                calificacionItem:
                  changes.calificacionItem ??
                  item.usuarioItem?.calificacionItem ??
                  0,
                cumplimiento:
                  changes.cumplimiento ?? item.usuarioItem?.cumplimiento ?? 0,
              },
            }
          : item
      ),
    })),

  fetchPDFInfo: async (itemId) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const url = `${RUTA_27001}planeacion/pdf/${itemId}`;
      // const url = `${RUTA_27001}auxiliar/pdf/${itemId}`;
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error('Error al obtener los datos');
      set({ success: true, loading: false, info: data.data });
      return data.data;
    } catch (error: any) {
      console.error(error);
      set({ error: error.message, loading: false });
    }
  },

  fetchLista: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const url = `${RUTA_27001}planeacion/lista`;
      const response = await fetchWithTimeout(url, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!data.status) {
        console.error(data);
        showErrorToast(data.message);
      }
      // Normalizamos los items a primitivos
      const normalized: IPlaneacionItem[] = data.data.map((it: any) => ({
        id: it.id,
        actividad: String(it.actividad),
        codigo: String(it.codigo),
        valorItemEstandar: Number(it.valorItemEstandar),
        usuarioItem: it.usuarioItem
          ? {
              peso: Number(it.usuarioItem.peso),
              calificacionItem: it.usuarioItem.calificacionItem,
              cumplimiento: Number(it.usuarioItem.cumplimiento),
            }
          : undefined,
      }));
      set({ success: true, loading: false, listaDeItems: normalized });
    } catch (error: any) {
      console.error(error);
      set({ error: error.message, loading: false });
    }
  },

  postPDF: async (pdfData, wannaShowToast) => {
    const token = getTokenFromCookies();
    set({ loading: true, error: null });

    try {
      const url = `${RUTA_27001}planeacion/pdf`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,

          'Content-Type': 'application/json', // solo content-type
        },
        body: JSON.stringify(pdfData),
      });

      const responseData = await response.json();
      if (!responseData.status) {
        showErrorToast(responseData.message);
        throw new Error('No se pudo guardar el pdf');
      }

      if (wannaShowToast) showTemporaryToast('PDF guardado correctamente');

      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  updateUsuarioItem: async (data) => {
    // 1) optimistic update local
    get().updateLocalUsuarioItem(data.itemId, data);
    // 2) persistir en backend
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const url = `${RUTA_27001}planeacion/item-usuario`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      if (!responseData.status) {
        showErrorToast(responseData.message);
      }
      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      // opcional: revertir cambio local llamando a fetchLista(token)
    }
  },

  uploadImage: async (image) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      throw new Error('Token no disponible');
    }

    const fileToUpload = await compressImage(image, 2);

    try {
      const url = `${RUTA_27001}upload/planeacion/pdf`;
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!responseData.status) {
        showErrorToast('No se pudo adjuntar la imagen');
      }

      set({ success: true, loading: false });
      return responseData.key as string;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  deleteImage: async (key) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      throw new Error('Token no disponible');
    }
    try {
      const url = `${RUTA_27001}upload/delete-image`;
      const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',

          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ key }),
      });

      const responseData = await response.text();

      set({ success: true, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  proxyImage: async (url) => {
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      throw new Error('Token no disponible');
    }

    try {
      const endpoint = `${RUTA_27001}proxy/proxy`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        throw new Error(`Fallo el fetch: ${response.status}`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      return objectUrl || '';
    } catch (error) {
      console.error('Error en proxyImage:', error);
      throw error;
    }
  },

  cleanPDFData: async () => {
    set({
      info: null,
    });
  },
}));
