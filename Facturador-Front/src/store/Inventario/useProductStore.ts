import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';
import type {
  Product,
  CreateProductPayload,
  UpdateProductPayload,
} from '@/types/inventory';

type ProductOperationPayload = CreateProductPayload | UpdateProductPayload;

interface ProductStore {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  createProduct: (productData: CreateProductPayload) => Promise<Product | null>;
  updateProduct: (
    id: string,
    productData: UpdateProductPayload
  ) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  isLoading: false,
  error: null,

  fetchProducts: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}products`);

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || 'Error al obtener productos');
      }

      const data: Product[] = await response.json();

      set({ products: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createProduct: async (productData: CreateProductPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || 'Error al crear producto');
      }

      const newProduct: Product = await response.json();

      set((state) => ({
        products: [...state.products, newProduct],
        isLoading: false,
      }));
      return newProduct;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  updateProduct: async (id: string, productData: UpdateProductPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || 'Error al actualizar producto');
      }

      const updatedProduct: Product = await response.json();

      set((state) => ({
        products: state.products.map((product) =>
          product.id === id ? updatedProduct : product
        ),
        isLoading: false,
      }));
      return updatedProduct;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  deleteProduct: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}products/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();

        throw new Error(errorData.message || 'Error al eliminar producto');
      }

      set((state) => ({
        products: state.products.filter((product) => product.id !== id),
        isLoading: false,
      }));

      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },
}));

// import { create } from 'zustand';
// import { INVENTORY_URL } from '@/helpers/ruta';
// import type { Product, CreateProductPayload, UpdateProductPayload } from '@/types/inventory';
// type ProductOperationPayload = CreateProductPayload | UpdateProductPayload;
// interface ProductStore {
//     products: Product[];
//     isLoading: boolean;
//     error: string | null;
//     fetchProducts: () => Promise<void>;
//     createProduct: (productData: CreateProductPayload) => Promise<Product | null>;
//     updateProduct: (id: string, productData: UpdateProductPayload) => Promise<Product | null>;
//     deleteProduct: (id: string) => Promise<boolean>;
// }
// export const useProductStore = create<ProductStore>((set, get) => ({
//     products: [],
//     isLoading: false,
//     error: null,
//     fetchProducts: async () => {
//         set({ isLoading: true, error: null });
//         try {
//             const response = await fetch(`${INVENTORY_URL}products`);
//             if (!response.ok) throw new Error('Error al obtener productos');
//             const data: Product[] = await response.json();
//             set({ products: data, isLoading: false });
//         } catch (err: any) {
//             set({ error: err.message, isLoading: false });
//         }
//     },
//     createProduct: async (productData: CreateProductPayload) => {
//         set({ isLoading: true, error: null });
//         try {
//             const response = await fetch(`${INVENTORY_URL}products`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(productData),
//             });
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Error al crear producto');
//             }
//             const newProduct: Product = await response.json();
//             set((state) => ({
//                 products: [...state.products, newProduct],
//                 isLoading: false,
//             }));
//             return newProduct;
//         } catch (err: any) {
//             set({ error: err.message, isLoading: false });
//             return null;
//         }
//     },
//     updateProduct: async (id: string, productData: UpdateProductPayload) => {
//         set({ isLoading: true, error: null });
//         try {
//             const response = await fetch(`${INVENTORY_URL}products/${id}`, {
//                 method: 'PATCH',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify(productData),
//             });
//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Error al actualizar producto');
//             }
//             const updatedProduct: Product = await response.json();
//             set((state) => ({
//                 products: state.products.map((product) =>
//                     product.id === id ? updatedProduct : product
//                 ),
//                 isLoading: false,
//             }));
//             return updatedProduct;
//         } catch (err: any) {
//             set({ error: err.message, isLoading: false });
//             return null;
//         }
//     },
//     deleteProduct: async (id) => {
//         set({ isLoading: true, error: null });
//         try {
//             const response = await fetch(`${INVENTORY_URL}products/${id}`, {
//                 method: 'DELETE',
//                 headers: {},
//             });

//             if (!response.ok) {
//                 const errorData = await response.json();
//                 throw new Error(errorData.message || 'Error al eliminar producto');
//             }
//             set((state) => ({
//                 products: state.products.filter((product) => product.id !== id),
//                 isLoading: false,
//             }));
//             return true;
//         } catch (err: any) {
//             set({ error: err.message, isLoading: false });
//             return false;
//         }
//     },
// }));
