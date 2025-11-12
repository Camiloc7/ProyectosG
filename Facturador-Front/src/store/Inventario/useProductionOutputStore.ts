import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';
import type { ProductionOutput, CreateProductionOutputPayload } from '@/types/inventory'; 
export interface ProductionOutputStore {
    isLoading: boolean;
    error: string | null;
    createOutput: (outputData: CreateProductionOutputPayload) => Promise<ProductionOutput | null>;
}
export const useProductionOutputStore = create<ProductionOutputStore>((set) => ({
    isLoading: false,
    error: null,
    createOutput: async (outputData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}production/outputs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(outputData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || JSON.stringify(errorData.errors) || 'Error al registrar la salida de producción.');
            }
            const newOutput: ProductionOutput = await response.json();
            set({ isLoading: false });
            return newOutput;
        } catch (err: any) {
            console.error("Error en createOutput:", err);
            set({ error: err.message, isLoading: false });
            return null;
        }
    },
}));