import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';
import type { ProductionOrder } from '@/types/inventory'; 
export type CreateProductionOrderPayload = {
    product_id: string;
    bom_id?: string | null;
    quantity_to_produce: number;
    status?: string;
    production_location_id?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    notes?: string | null;
};
export type UpdateProductionOrderPayload = Partial<CreateProductionOrderPayload> & {
    order_number?: string;
    quantity_produced?: number;
};
interface ProductionOrderStore {
    orders: ProductionOrder[];
    order: ProductionOrder | null; 
    isLoading: boolean;
    error: string | null;
    fetchOrders: () => Promise<void>;
    fetchOrderById: (id: string) => Promise<ProductionOrder | null>;
    createOrder: (orderData: CreateProductionOrderPayload) => Promise<ProductionOrder | null>;
    updateOrder: (id: string, orderData: UpdateProductionOrderPayload) => Promise<ProductionOrder | null>;
    deleteOrder: (id: string) => Promise<boolean>;
}
export const useProductionOrderStore = create<ProductionOrderStore>((set, get) => ({
    orders: [],
    order: null,
    isLoading: false,
    error: null,
    fetchOrders: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}production/orders`);
            if (!response.ok) throw new Error('Error al obtener la lista de Órdenes de Producción');
            const data: ProductionOrder[] = await response.json();
            set({ orders: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
    fetchOrderById: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}production/orders/${id}`);
            if (!response.ok) throw new Error(`Error al obtener la Orden de Producción con ID: ${id}`);
            const data: ProductionOrder = await response.json();
            set({ isLoading: false, order: data }); 
            return data;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
        }
    },
    createOrder: async (orderData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}production/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear la Orden de Producción');
            }
            const newOrder: ProductionOrder = await response.json();
            set((state) => ({
                orders: [...state.orders, newOrder],
                isLoading: false,
            }));
            return newOrder;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
        }
    },
    updateOrder: async (id, orderData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}production/orders/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar la Orden de Producción');
            }
            const updatedOrder: ProductionOrder = await response.json();
            set((state) => ({
                orders: state.orders.map((order) =>
                    order.id === id ? updatedOrder : order
                ),
                order: state.order?.id === id ? updatedOrder : state.order, 
                isLoading: false,
            }));
            return updatedOrder;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
        }
    },
    deleteOrder: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}production/orders/${id}`, {
                method: 'DELETE',
                headers: {
                },
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar la Orden de Producción');
            }
            set((state) => ({
                orders: state.orders.filter((order) => order.id !== id),
                isLoading: false,
            }));
            return true;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
        }
    },
}));