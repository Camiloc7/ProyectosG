import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';
import { SupplierCategory, Supplier } from '@/types/inventory';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies'; 

export type CreateSupplierCategoryPayload = {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
};

export type UpdateSupplierCategoryPayload = Partial<CreateSupplierCategoryPayload>;

interface SupplierCategoriesState {
  categories: SupplierCategory[];
  selectedCategory: SupplierCategory | null; 
  loading: boolean;
  error: string | null;
  fetchCategories: () => Promise<void>;
  fetchCategoryById: (id: string) => Promise<SupplierCategory | null>;
  createCategory: (categoryData: CreateSupplierCategoryPayload) => Promise<SupplierCategory | null>;
  updateCategory: (id: string, categoryData: UpdateSupplierCategoryPayload) => Promise<SupplierCategory | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  clearSelectedCategory: () => void; 
}

export const useSupplierCategoriesStore = create<SupplierCategoriesState>((set, get) => ({
  categories: [],
  selectedCategory: null,
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const token = getTokenFromCookies(); // <-- Obtener el token
      if (!token) {
        set({ error: 'No authentication token found.', loading: false });
        // Opcional: Redirigir al login si no hay token
        // window.location.href = '/login'; 
        return;
      }

      const res = await fetch(`${INVENTORY_URL}api/proveedores/categories`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // <-- Añadir el encabezado de autorización
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al obtener categorías de proveedores');
      }
      const data: SupplierCategory[] = await res.json();
      set({ categories: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCategoryById: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = getTokenFromCookies(); // <-- Obtener el token
      if (!token) {
        set({ error: 'No authentication token found.', loading: false });
        // window.location.href = '/login';
        return null;
      }

      const res = await fetch(`${INVENTORY_URL}api/proveedores/categories/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // <-- Añadir el encabezado de autorización
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Error al obtener la categoría con ID: ${id}`);
      }
      const data: SupplierCategory = await res.json();
      set({ loading: false, selectedCategory: data });
      return data;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  createCategory: async (categoryData) => {
    set({ loading: true, error: null });
    try {
      const token = getTokenFromCookies(); // <-- Obtener el token
      if (!token) {
        set({ error: 'No authentication token found.', loading: false });
        // window.location.href = '/login';
        return null;
      }

      const res = await fetch(`${INVENTORY_URL}api/proveedores/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // <-- Añadir el encabezado de autorización
        },
        body: JSON.stringify(categoryData),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al crear la categoría de proveedor');
      }
      const newCategory: SupplierCategory = await res.json();
      set((state) => ({
        categories: [...state.categories, newCategory], 
        loading: false,
      }));
      return newCategory;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  updateCategory: async (id, categoryData) => {
    set({ loading: true, error: null });
    try {
      const token = getTokenFromCookies(); // <-- Obtener el token
      if (!token) {
        set({ error: 'No authentication token found.', loading: false });
        // window.location.href = '/login';
        return null;
      }

      const res = await fetch(`${INVENTORY_URL}api/proveedores/categories/${id}`, {
        method: 'PATCH', 
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // <-- Añadir el encabezado de autorización
        },
        body: JSON.stringify(categoryData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al actualizar la categoría de proveedor');
      }
      const updatedCategory: SupplierCategory = await res.json();
      set((state) => ({
        categories: state.categories.map((cat) =>
          cat.id === id ? updatedCategory : cat 
        ),
        selectedCategory: state.selectedCategory?.id === id ? updatedCategory : state.selectedCategory, 
        loading: false,
      }));
      return updatedCategory;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true, error: null });
    try {
      const token = getTokenFromCookies(); // <-- Obtener el token
      if (!token) {
        set({ error: 'No authentication token found.', loading: false });
        // window.location.href = '/login';
        return false;
      }

      const res = await fetch(`${INVENTORY_URL}api/proveedores/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`, // <-- Añadir el encabezado de autorización
        },
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Error al eliminar la categoría de proveedor');
      }
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id), 
        loading: false,
      }));
      return true;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return false;
    }
  },

  clearSelectedCategory: () => {
    set({ selectedCategory: null });
  },
}));
