// import { create } from 'zustand';
// import { INVENTORY_URL } from '@/helpers/ruta';
// import { showErrorToast } from '@/components/feedback/toast'; 
// import type { InventoryItem, Product } from '@/types/inventory'; 
// interface InventoryStore {
//   inventoryItems: InventoryItem[]; 
//   isLoading: boolean; 
//   error: string | null;
//   fetchInventory: () => Promise<void>; 
// }
// export const useInventoryStore = create<InventoryStore>((set) => ({
//   inventoryItems: [], 
//   isLoading: false, 
//   error: null,
//   fetchInventory: async () => { 
//     set({ isLoading: true, error: null });
//     try {
//       const response = await fetch(`${INVENTORY_URL}inventory/snapshot`, { 
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       });

//       if (!response.ok) {
//         throw new Error(`Error al obtener el snapshot del inventario. Código: ${response.status}`);
//       }
//       const data: InventoryItem[] = await response.json();
//       set({ inventoryItems: data, isLoading: false }); 
//     } catch (error: any) {
//       console.error('Error al obtener snapshot del inventario:', error);
//       set({ error: error.message || 'Error desconocido', isLoading: false });
//       showErrorToast('Hubo un error al cargar el inventario');
//     }
//   },

// }));




// src/store/Inventario/useInventoryStore.ts

import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';
import { showErrorToast } from '@/components/feedback/toast';
import type { InventoryItem } from '@/types/inventory'; 
interface InventoryStore {
  inventoryItems: InventoryItem[]; 
  isLoading: boolean;
  error: string | null;
  fetchInventory: () => Promise<void>;
  fetchInventoryItemsByProduct: (productId: string) => Promise<void>;
  clearInventoryItems: () => void;
}
export const useInventoryStore = create<InventoryStore>((set) => ({
  inventoryItems: [],
  isLoading: false,
  error: null,
  fetchInventory: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}inventory/snapshot`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Error al obtener el snapshot del inventario. Código: ${response.status}`);
      }
      const data: InventoryItem[] = await response.json();
      set({ inventoryItems: data, isLoading: false });
    } catch (error: any) {
      console.error('Error al obtener snapshot del inventario:', error);
      set({ error: error.message || 'Error desconocido', isLoading: false });
      showErrorToast('Hubo un error al cargar el inventario');
    }
  },
  fetchInventoryItemsByProduct: async (productId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}inventory/product/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error al obtener items de inventario para el producto ${productId}`);
      }
      const data: InventoryItem[] = await response.json();
      set({ inventoryItems: data, isLoading: false });
    } catch (err: any) {
      console.error(`Error al obtener items de inventario para el producto ${productId}:`, err);
      set({ error: err.message, isLoading: false });
      showErrorToast(`Hubo un error al cargar el inventario del producto: ${err.message}`);
    }
  },
  clearInventoryItems: () => {
    set({ inventoryItems: [] });
  },
}));