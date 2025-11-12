import { create } from 'zustand';
import { BASE_URL, NODE_API } from '@/helpers/ruta';
import { useFacturaStore } from './useFacturaStore';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import { fetchWithTimeout } from '@/helpers/timefetch';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import { ItemsVentaFront } from '@/types/types';
import { useItemStore } from './useItemStore';

interface ItemsVentaStore {
  loading: boolean;
  error: string | null;
  success: boolean;
  allItems: ItemsVentaFront[];
  postItem: (formData: object) => Promise<void>;
  fetchProximoCodigoItem: (idCategoriaProducto: number) => Promise<number>;
  fetchListaDeItems: () => Promise<void>;
  fetchItemInfo: (id: string) => Promise<ItemsVentaFront>;
  deleteItem: (id: string) => Promise<void>;
  actualizarItem: (formData: object, id: string) => Promise<void>;
}

export const useItemsVentaStore = create<ItemsVentaStore>((set) => ({
  loading: false,
  allItems: [],
  error: null,
  success: false,

  postItem: async (values: any) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('descripcion', values.descripcion);
      formData.append('subtotal', values.subtotal);
      formData.append('unidadDeMedida', values.unidadDeMedida);
      formData.append('cantidad', values.cantidad);
      formData.append('porcentajeIva', values.porcentajeIva);
      formData.append('iva', values.iva);
      formData.append('total', values.total);
      formData.append('retefuente', values.retefuente);
      formData.append('reteica', values.reteica);
      formData.append('descuentoVenta', values.descuentoVenta);
      formData.append(
        'valorFinalConRetenciones',
        values.valorFinalConRetenciones
      );
      formData.append('idCategoria', values.idCategoria);

      //Si hay urlImagen entronces abrimos una image
      if (values.urlImagen) {
        formData.append('image', values.urlImagen);
      }

      //Debuggeo
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(
            `${key}: File -> name: ${value.name}, type: ${value.type}, size: ${value.size} bytes`
          );
        } else {
          console.log(`${key}: ${value} (tipo: ${typeof value})`);
        }
      }

      const response = await fetchWithTimeout(`${NODE_API}ventas/item`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!data.status) {
        showErrorToast(data.message);
        throw new Error('Error al mandar la info');
      }

      showTemporaryToast('Item Agregado Correctamente');
      set({ loading: false, error: null });
      const state = useItemsVentaStore.getState();
      await state.fetchListaDeItems();
      const state2 = useItemStore.getState();
      await state2.fetchListaDeItems();
    } catch (error: any) {
      console.error('Fetch error:', error);
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  fetchProximoCodigoItem: async (idCategoriaProducto: number) => {
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${NODE_API}ventas/proximo-codigo/${idCategoriaProducto}`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
          // body: idCategoriaProducto,
        }
      );

      const data = await response.json();

      if (!data.status) {
        showErrorToast(data.message);

        throw new Error('Error en el back');
      }
      return data.data;
    } catch (error: any) {
      console.error('Fetch error:', error);
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  fetchListaDeItems: async () => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(`${NODE_API}ventas/get-items`, {
        method: 'GET',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!data.status) {
        showErrorToast(data.message);

        throw new Error('Error en el back');
      }

      const allItems = data.data;
      set({ allItems, loading: false });
    } catch (error: any) {
      console.error('Fetch error:', error);
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  fetchItemInfo: async (id: string) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(
        `${NODE_API}ventas/get-item/${id}`,
        {
          method: 'GET',
          headers: {
            authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (!data.status) {
        showErrorToast(data.message);

        throw new Error('Error en el back');
      }

      const infoItem = data.data;

      set({ loading: false });
      return infoItem;
    } catch (error: any) {
      console.error('Fetch error:', error);
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  deleteItem: async (id: string) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';

      return;
    }
    try {
      const response = await fetchWithTimeout(`${NODE_API}ventas/item/${id}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: id,
      });

      const data = await response.json();

      if (!data.status) {
        showErrorToast(data.message);

        throw new Error('Error en el back');
      }

      showTemporaryToast('Item Eliminado');
      const state = useItemsVentaStore.getState();
      await state.fetchListaDeItems();
      set({ loading: false });
    } catch (error: any) {
      console.error('Fetch error:', error);
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },

  actualizarItem: async (data: any, id: string) => {
    set({ loading: true, error: null });
    const token = getTokenFromCookies();
    if (!token) {
      set({ loading: false, error: 'Token no disponible' });
      window.location.href = '/login';
      return;
    }

    const formData = new FormData();
    formData.append('descripcion', data.descripcion);
    formData.append('subtotal', data.subtotal);
    formData.append('unidadDeMedida', data.unidadDeMedida);
    formData.append('cantidad', data.cantidad);
    formData.append('porcentajeIva', data.porcentajeIva);
    formData.append('iva', data.iva);
    formData.append('total', data.total);
    formData.append('retefuente', data.retefuente);
    formData.append('reteica', data.reteica);
    formData.append('descuentoVenta', data.descuentoVenta);
    formData.append('valorFinalConRetenciones', data.valorFinalConRetenciones);
    formData.append('idCategoria', data.idCategoria);

    //Si hay urlImagen entronces abrimos una image
    if (data.urlImagen) {
      formData.append('image', data.urlImagen);
    }

    try {
      // Debug
      console.log('Enviando al backend FormData con los siguientes valores:');
      for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value} (type: ${typeof value})`);
      }

      // Nota: No se agrega el header 'Content-Type', el browser lo setea automáticamente para FormData
      const response = await fetchWithTimeout(`${NODE_API}ventas/item/${id}`, {
        method: 'PUT',
        headers: {
          authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const dataResponse = await response.json();

      if (!dataResponse.status) {
        console.log(dataResponse);
        showErrorToast(`${dataResponse.message}`);
        throw new Error('Error en el back');
      }

      showTemporaryToast('Item Actualizado Exitosamente');
      const state = useItemsVentaStore.getState();
      await state.fetchListaDeItems();
      set({ loading: false });
    } catch (error: any) {
      console.error('Fetch error:', error);
      set({ error: error.message || 'Error desconocido', loading: false });
    }
  },
}));
