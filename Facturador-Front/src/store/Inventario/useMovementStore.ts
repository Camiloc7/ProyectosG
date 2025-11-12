// src/store/Inventario/useMovementStore.ts

import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta'; // Asegúrate de que esta ruta sea correcta
import type { Movement, CreateMovementPayload, UpdateMovementPayload } from '@/types/inventory';

interface MovementStore {
    movements: Movement[];
    isLoading: boolean;
    error: string | null;
    fetchMovements: () => Promise<void>;
    createMovement: (movementData: CreateMovementPayload) => Promise<Movement | null>;
    updateMovement: (id: string, movementData: UpdateMovementPayload) => Promise<Movement | null>;
    deleteMovement: (id: string) => Promise<boolean>;
    // Puedes añadir más métodos de filtrado si tu API los soporta, ej:
    fetchMovementsByProduct: (productId: string) => Promise<void>;
    fetchMovementsByLocation: (locationId: string) => Promise<void>;
}

export const useMovementStore = create<MovementStore>((set, get) => ({
    movements: [],
    isLoading: false,
    error: null,

    // Obtener todos los movimientos
    fetchMovements: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}movements`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al obtener movimientos');
            }
            const data: Movement[] = await response.json();
            set({ movements: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    // Crear un nuevo movimiento
    createMovement: async (movementData: CreateMovementPayload) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}movements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(movementData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear movimiento');
            }
            const newMovement: Movement = await response.json();
            set((state) => ({
                movements: [...state.movements, newMovement],
                isLoading: false,
            }));
            return newMovement;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
        }
    },

    // Actualizar un movimiento existente
    updateMovement: async (id: string, movementData: UpdateMovementPayload) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}movements/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(movementData),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar movimiento');
            }
            const updatedMovement: Movement = await response.json();
            set((state) => ({
                movements: state.movements.map((movement) =>
                    movement.id === id ? updatedMovement : movement
                ),
                isLoading: false,
            }));
            return updatedMovement;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return null;
        }
    },

    // Eliminar un movimiento
    deleteMovement: async (id) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}movements/${id}`, {
                method: 'DELETE',
                headers: {},
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al eliminar movimiento');
            }
            set((state) => ({
                movements: state.movements.filter((movement) => movement.id !== id),
                isLoading: false,
            }));
            return true;
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
            return false;
        }
    },

    // Métodos para filtrar por ID de producto o ubicación (basados en tu Swagger)
    fetchMovementsByProduct: async (productId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}movements/product/${productId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al obtener movimientos para el producto ${productId}`);
            }
            const data: Movement[] = await response.json();
            set({ movements: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },

    fetchMovementsByLocation: async (locationId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch(`${INVENTORY_URL}movements/location/${locationId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error al obtener movimientos para la ubicación ${locationId}`);
            }
            const data: Movement[] = await response.json();
            set({ movements: data, isLoading: false });
        } catch (err: any) {
            set({ error: err.message, isLoading: false });
        }
    },
}));