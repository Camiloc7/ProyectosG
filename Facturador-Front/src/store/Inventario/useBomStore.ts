import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';
import type { Category, Variant, Product, BillOfMaterialComponent as BomItem, BillOfMaterial} from '@/types/inventory'; 
export type CreateBomItemPayload = {
    component_product_id: string;
    quantity: number;
    unit: string;
};
export type CreateBomPayload = {
    product_id: string;
    name: string;
    description?: string | null; 
    quantity_produced: number;
    items: CreateBomItemPayload[];
};
export type UpdateBomPayload = Partial<CreateBomPayload>;
interface BomStore {
    boms: BillOfMaterial[];
    bom: BillOfMaterial | null;
    isLoading: boolean;
    error: string | null;
    fetchBoms: () => Promise<void>;
    fetchBomById: (id: string) => Promise<BillOfMaterial | null>;
    createBom: (bomData: CreateBomPayload) => Promise<BillOfMaterial | null>;
    updateBom: (id: string, bomData: UpdateBomPayload) => Promise<BillOfMaterial | null>;
    deleteBom: (id: string) => Promise<boolean>;
}
export const useBomStore = create<BomStore>((set, get) => ({
    boms: [],
    bom: null, 
    isLoading: false,
    error: null,
    fetchBoms: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}production/boms`);
            if (!response.ok) throw new Error('Error al obtener la lista de BOMs');
            const data: BillOfMaterial[] = await response.json();
            set({ boms: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
    fetchBomById: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}production/boms/${id}`);
            if (!response.ok) throw new Error(`Error al obtener la BOM con ID: ${id}`);
            const data: BillOfMaterial = await response.json();
            set({ isLoading: false, bom: data }); 
            return data;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
        }
    },
    createBom: async (bomData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}production/boms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bomData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear la BOM');
            }
            const newBom: BillOfMaterial = await response.json();
            set((state) => ({
                boms: [...state.boms, newBom],
                isLoading: false,
            }));
            return newBom;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
        }
    },
    updateBom: async (id, bomData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}production/boms/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bomData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar la BOM');
            }
            const updatedBom: BillOfMaterial = await response.json();
            set((state) => ({
                boms: state.boms.map((bom) =>
                    bom.id === id ? updatedBom : bom
                ),
                bom: state.bom?.id === id ? updatedBom : state.bom,
                isLoading: false,
            }));
            return updatedBom;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
        }
    },
    deleteBom: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}production/boms/${id}`, {
                method: 'DELETE',
                headers: {},
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar la BOM');
            }
            set((state) => ({
                boms: state.boms.filter((bom) => bom.id !== id),
                isLoading: false,
            }));
            return true;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
        }
    },
}));