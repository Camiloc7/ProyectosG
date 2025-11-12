import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta'; 
export interface ProductCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string; 
  updated_at: string; 
}
interface ProductCategoriesState {
  categories: ProductCategory[];
  isLoading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
}
export const useCategoryStore = create<ProductCategoriesState>((set) => ({
  categories: [],
  isLoading: false,
  error: null,
  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}products/categories`); 
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cargar categorías de productos');
      }
      const data: ProductCategory[] = await response.json(); 
      set({ categories: data, isLoading: false });
    } catch (error: any) {
      console.error('Failed to fetch product categories:', error);
      set({ error: error.message || 'Error desconocido al cargar categorías de productos', isLoading: false });
    }
  },
}));