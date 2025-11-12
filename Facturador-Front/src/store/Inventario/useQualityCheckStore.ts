import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';
import type {
    QualityCheck,
    CreateQualityCheckPayload,
    UpdateQualityCheckPayload,
} from '@/types/inventory'; 
interface QualityCheckStore {
  qualityChecks: QualityCheck[];
  isLoading: boolean;
  error: string | null;
  fetchQualityChecks: () => Promise<void>;
  fetchQualityCheckById: (id: string) => Promise<QualityCheck | null>;
  createQualityCheck: (checkData: CreateQualityCheckPayload) => Promise<QualityCheck | null>;
  updateQualityCheck: (id: string, checkData: UpdateQualityCheckPayload) => Promise<QualityCheck | null>;
  deleteQualityCheck: (id: string) => Promise<boolean>;
}
export const useQualityCheckStore = create<QualityCheckStore>((set) => ({
  qualityChecks: [],
  isLoading: false,
  error: null,
  fetchQualityChecks: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}production/quality-checks`);
      if (!response.ok) throw new Error('Error al obtener la lista de Controles de Calidad');
      const data: QualityCheck[] = await response.json();
      set({ qualityChecks: data, isLoading: false });
    } catch (err: any) {
      console.error("Error fetching quality checks:", err);
      set({ error: err.message, isLoading: false });
    }
  },
  fetchQualityCheckById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}production/quality-checks/${id}`);
      if (!response.ok) throw new Error(`Error al obtener el Control de Calidad con ID: ${id}`);
      const data: QualityCheck = await response.json();
      set({ isLoading: false });
      return data;
    } catch (err: any) {
      console.error(`Error fetching quality check ${id}:`, err);
      set({ error: err.message, isLoading: false });
      return null;
    }
  },
  createQualityCheck: async (checkData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}production/quality-checks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el Control de Calidad');
      }
      const newCheck: QualityCheck = await response.json();
      set((state) => ({
        qualityChecks: [...state.qualityChecks, newCheck],
        isLoading: false,
      }));
      return newCheck;
    } catch (err: any) {
      console.error("Error creating quality check:", err);
      set({ error: err.message, isLoading: false });
      return null;
    }
  },
  updateQualityCheck: async (id, checkData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}production/quality-checks/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar el Control de Calidad');
      }
      const updatedCheck: QualityCheck = await response.json();
      set((state) => ({
        qualityChecks: state.qualityChecks.map((check) =>
          check.id === id ? updatedCheck : check
        ),
        isLoading: false,
      }));
      return updatedCheck;
    } catch (err: any) {
      console.error("Error updating quality check:", err);
      set({ error: err.message, isLoading: false });
      return null;
    }
  },
  deleteQualityCheck: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${INVENTORY_URL}production/quality-checks/${id}`, {
        method: 'DELETE',
        headers: {
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el Control de Calidad');
      }
      set((state) => ({
        qualityChecks: state.qualityChecks.filter((check) => check.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      console.error("Error deleting quality check:", err);
      set({ error: err.message, isLoading: false });
      return false;
    }
  },
}));