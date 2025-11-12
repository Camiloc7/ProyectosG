import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';
import type { ProductionOrder, Product, ProductionInput, CreateProductionInputPayload } from '@/types/inventory'; 
interface ProductionInputStore {
  isLoading: boolean;
  error: string | null;
  createInput: (inputData: CreateProductionInputPayload) => Promise<ProductionInput | null>;
}
export const useProductionInputStore = create<ProductionInputStore>((set) => ({
  isLoading: false,
  error: null,
  createInput: async (inputData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}production/inputs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inputData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al registrar el consumo de insumo.');
      }
      const newInput: ProductionInput = await response.json();
      set({ isLoading: false });
      return newInput;
    } catch (err: any) {
      console.error("Error creating production input:", err);
      set({ error: err.message, isLoading: false });
      return null;
    }
  },
}));