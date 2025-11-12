import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';
import type { Supplier } from '@/types/inventory'; 
type NewSupplier = Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'category'>;
type UpdateSupplier = Partial<NewSupplier>;
type SupplierCategory = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};
type NewSupplierCategory = Omit<SupplierCategory, 'id' | 'created_at' | 'updated_at'>;
interface SupplierStore {
  suppliers: Supplier[];
  supplierCategories: SupplierCategory[]; 
  isLoading: boolean;
  error: string | null;
  selectedSupplier: Supplier | null; 
  fetchSuppliers: () => Promise<void>;
  fetchOneSupplier: (id: string) => Promise<void>;
  createSupplier: (newSupplier: NewSupplier) => Promise<void>;
  updateSupplier: (id: string, updatedFields: UpdateSupplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  fetchSupplierCategories: () => Promise<void>;
  createSupplierCategory: (newCategory: NewSupplierCategory) => Promise<void>;
  updateSupplierCategory: (id: string, updatedFields: Partial<NewSupplierCategory>) => Promise<void>;
  deleteSupplierCategory: (id: string) => Promise<void>;
}
export const useSuppliersStore = create<SupplierStore>((set, get) => ({
  suppliers: [],
  supplierCategories: [],
  isLoading: false,
  error: null,
  selectedSupplier: null,
  fetchSuppliers: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}api/proveedores/getAll`);
      if (!res.ok) throw new Error('Error al cargar proveedores');
      const data: Supplier[] = await res.json();
      set({ suppliers: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },
  fetchOneSupplier: async (id: string) => {
    set({ isLoading: true, error: null, selectedSupplier: null });
    try {
      const res = await fetch(`${INVENTORY_URL}api/proveedores/oneProveedor/${id}`);
      if (!res.ok) throw new Error('Error al cargar el proveedor');
      const data: Supplier = await res.json();
      set({ selectedSupplier: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },
  createSupplier: async (newSupplier: NewSupplier) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}api/proveedores/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier),
      });
      if (!res.ok) throw new Error('Error al crear proveedor');
      const createdSupplier: Supplier = await res.json();
      set((state) => ({
        suppliers: [...state.suppliers, createdSupplier],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },
  updateSupplier: async (id: string, updatedFields: UpdateSupplier) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}api/proveedores/update/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) throw new Error('Error al actualizar proveedor');
      const updatedSupplier: Supplier = await res.json(); 
      set((state) => ({
        suppliers: state.suppliers.map((s) =>
          s.id === id ? { ...s, ...updatedSupplier } : s
        ),
        selectedSupplier: state.selectedSupplier?.id === id ? { ...state.selectedSupplier, ...updatedSupplier } : state.selectedSupplier,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },
  deleteSupplier: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}api/proveedores/delete/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar proveedor');
      set((state) => ({
        suppliers: state.suppliers.filter((s) => s.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },
  fetchSupplierCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}api/proveedores/categories`);
      if (!res.ok) throw new Error('Error al cargar categorías de proveedores');
      const data: SupplierCategory[] = await res.json();
      set({ supplierCategories: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },
  createSupplierCategory: async (newCategory: NewSupplierCategory) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}api/proveedores/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });
      if (!res.ok) throw new Error('Error al crear categoría de proveedor');
      const createdCategory: SupplierCategory = await res.json();
      set((state) => ({
        supplierCategories: [...state.supplierCategories, createdCategory],
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },
  updateSupplierCategory: async (id: string, updatedFields: Partial<NewSupplierCategory>) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}api/proveedores/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (!res.ok) throw new Error('Error al actualizar categoría de proveedor');
      const updatedCategory: SupplierCategory = await res.json();
      set((state) => ({
        supplierCategories: state.supplierCategories.map((cat) =>
          cat.id === id ? { ...cat, ...updatedCategory } : cat
        ),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },
  deleteSupplierCategory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${INVENTORY_URL}api/proveedores/categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Error al eliminar categoría de proveedor');
      set((state) => ({
        supplierCategories: state.supplierCategories.filter((cat) => cat.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message || 'Error desconocido', isLoading: false });
    }
  },
}));