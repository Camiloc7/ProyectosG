import { create } from 'zustand';
import { INVENTORY_URL } from '../../helpers/ruta';
import { showErrorToast, showTemporaryToast } from '@/components/feedback/toast';
import { useInventoryStore } from './useInventoryStore';

interface EntradaForm {
  product: {
    sku: string;
    name: string;
    barcode: string;
    category_id: string;
  };
  supplier_nit: string;
  lot: {
    lot_number: string;
    manufacture_date: string;
    expiration_date: string;
    initial_quantity: number;
  };
  location_id: string;
  movement: {
    movement_type: string;
    quantity: number;
    movement_date: string;
  };
  serials: string[];
}

interface OrquestacionStore {
  loading: boolean;
  createEntradaInventario: (data: EntradaForm) => Promise<boolean>;
}

export const useOrquestacionStore = create<OrquestacionStore>((set) => ({
  loading: false,

  createEntradaInventario: async (data) => {
    set({ loading: true });
    try {
      const res = await fetch(`${INVENTORY_URL}orchestration/entry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const msg = await res.json();
        throw new Error(msg.message || 'Error en entrada de inventario');
      }

      showTemporaryToast('Entrada registrada correctamente');
      set({ loading: false });
      const { fetchInventory } = useInventoryStore.getState();
      fetchInventory();

      return true;
    } catch (error: any) {
      showErrorToast(error.message || 'Error inesperado');
      set({ loading: false });
      return false;
    }
  },
}));
