import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';
import { showTemporaryToast, showErrorToast } from '@/components/feedback/toast';
import type { InventoryItem } from '@/types/inventory'; 
export interface ProductPayload {
  sku: string;
  name: string;
  barcode?: string;
  category_id: string;
}
export interface LotPayload {
  lot_number: string;
  manufacture_date: string; 
  expiration_date: string;  
  initial_quantity: number;
}
export interface MovementPayload {
  movement_type: string;
  quantity: number;
  movement_date: string; 
}
export interface CreateOrchestrationEntryPayload {
  product: ProductPayload;
  supplier_nit?: string; 
  lot?: LotPayload;
  location_id: string;
  movement: MovementPayload;
  serials?: string[]; 
}
interface InventoryEntryStore {
  isLoading: boolean;
  error: string | null;
  createInventoryEntry: (payload: CreateOrchestrationEntryPayload) => Promise<InventoryItem | null>;
}
export const useInventoryEntryStore = create<InventoryEntryStore>((set) => ({
  isLoading: false,
  error: null,
  createInventoryEntry: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}inventory/orchestration/entry`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la entrada de inventario.');
      }
      const newInventoryItem: InventoryItem = await response.json(); 
      showTemporaryToast('Entrada de inventario registrada con éxito.');
      set({ isLoading: false });
      return newInventoryItem;
    } catch (err: any) {
      console.error("Error creating inventory entry:", err);
      set({ error: err.message, isLoading: false });
      showErrorToast(err.message || 'Error desconocido al registrar la entrada.');
      return null;
    }
  },
}));