'use client';

import { create } from 'zustand';
import { BASE_URL, NODE_API } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import { fetchWithTimeout } from '@/helpers/timefetch';

export interface Item {
  id: string;
  codigo: string;
  idUsuario: string;
  porcentajeIva: string;
  tarifa: string;
  nombre: string;
  subtotal: string;
  iva: string;
  total: string;
  rutaImagen: string;
  retefuente: string;
  reteica: string;
}

interface ItemsStore {
  listaDeItems: Item[];
  isLoading: boolean;
  error: string | null;
  fetchListaDeItems: () => Promise<void>;
  createItem: (data: Item) => Promise<void>;
}

export const useItemStore = create<ItemsStore>((set, get) => ({
  listaDeItems: [],
  isLoading: false,
  error: null,

  fetchListaDeItems: async () => {
    set({ isLoading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ isLoading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const response = await fetchWithTimeout(`${NODE_API}ventas/get-items`, {
        headers: { authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!data.status) {
        console.log(data);
        throw new Error('Error al obtener la lista de items');
      }

      console.log('Back', data);

      const listaDeItems = data.data.map((item: any) => {
        return {
          id: item.id || '',
          nombre: item.descripcion || '',
          valorIvaItem: item.valorIva,
          porcentajeIva: item.porcentajeIva,
        };
      });
      //console.log('Front', listaDeItems);
      set({ listaDeItems, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },

  createItem: async (data: Item) => {
    set({ isLoading: true, error: null });

    const token = getTokenFromCookies();
    if (!token) {
      set({ isLoading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }

    try {
      const requestBody = JSON.stringify({
        CODIGO: data.codigo,
        NOMBRE: data.nombre,
        SUBTOTAL: data.subtotal,
        IVA: data.iva,
        TOTAL: data.total,
        RUTA_IMAGEN: data.rutaImagen,
        RETEFUENTE: data.retefuente,
        RETEICA: data.reteica,
      });

      console.log('Datos enviados en JSON:', requestBody);

      const response = await fetchWithTimeout(`${BASE_URL}api/items/create`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (!response.ok) {
        throw new Error('Error al realizar la solicitud al servidor');
      }

      const responseData = await response.json();

      if (responseData.resultado === 'error') {
        throw new Error(responseData.mensaje || 'Error al crear item');
      }

      //console.log(responseData);
      get().fetchListaDeItems();
      showTemporaryToast('Item creado con éxito');
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Error desconocido',
        isLoading: false,
      });
      console.error('Error al crear item:', error.message);
    }
  },
}));
