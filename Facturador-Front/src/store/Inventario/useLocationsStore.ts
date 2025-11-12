import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta'; 
import type { Location, InventoryItem } from '@/types/inventory';
interface LocationStore {
  locations: Location[];
  fetchLocations: () => Promise<void>;
  createLocation: (name: string, description: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export const useLocationStore = create<LocationStore>((set, get) => ({
  locations: [],
  isLoading: false,
  error: null,

  fetchLocations: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}inventory/locations`);
      if (!response.ok) {
        throw new Error(`Error al obtener locaciones: ${response.statusText}`);
      }
      const data: Location[] = await response.json();
      set({ locations: data, isLoading: false });
    } catch (err: any) {
      console.error("Error fetching locations:", err);
      set({ error: err.message, isLoading: false });
    }
  },

  createLocation: async (name: string, description: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}inventory/locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Error al crear locación: ${errorData.message || response.statusText}`);
      }

      const newLocation: Location = await response.json(); 
      set((state) => ({
        locations: [...state.locations, newLocation],
        isLoading: false,
      }));
    } catch (err: any) {
      console.error("Error creating location:", err);
      set({ error: err.message, isLoading: false });
      throw err; 
    }
  },
}));