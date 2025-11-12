import { create } from 'zustand';
import { INVENTORY_URL } from '@/helpers/ruta';
import { getTokenFromCookies } from '@/helpers/getTokenFromCookies';
import {
  FixedAsset,
  CreateFixedAssetDto,
  UpdateFixedAssetDto,
} from '@/types/fixed-assets';

/**
 * Interfaz para el estado de la tienda de activos fijos.
 * Define las propiedades y métodos disponibles.
 */
interface FixedAssetsStore {
  fixedAssets: FixedAsset[];
  uniqueLocations: string[];
  uniqueResponsibles: string[];
  isLoading: boolean;
  error: string | null;
  fetchFixedAssets: () => Promise<void>;
  fetchFixedAssetById: (id: string) => Promise<FixedAsset | null>;
  createFixedAsset: (
    fixedAssetData: CreateFixedAssetDto
  ) => Promise<FixedAsset[] | null>;
  updateFixedAsset: (
    id: string,
    fixedAssetData: UpdateFixedAssetDto
  ) => Promise<FixedAsset | null>;
  deleteFixedAsset: (id: string) => Promise<boolean>;
  fetchUniqueLocations: () => Promise<void>;
  fetchUniqueResponsibles: () => Promise<void>;
}

export const useFixedAssetsStore = create<FixedAssetsStore>((set, get) => ({
  fixedAssets: [],
  uniqueLocations: [],
  uniqueResponsibles: [],
  isLoading: false,
  error: null,

  /**
   * Obtiene todos los activos fijos para el inquilino autenticado.
   */
  fetchFixedAssets: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }
      const response = await fetch(`${INVENTORY_URL}fixed-assets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al obtener activos fijos');
      }

      const data: FixedAsset[] = await response.json();
      set({ fixedAssets: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  /**
   * Obtiene un activo fijo por su ID.
   * @param id El ID del activo fijo (UUID).
   */
  fetchFixedAssetById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }
      const response = await fetch(`${INVENTORY_URL}fixed-assets/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Error al obtener los detalles del activo'
        );
      }
      const data: FixedAsset = await response.json();
      set({ isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  /**
   * Crea uno o más activos fijos en un solo lote.
   * @param fixedAssetData Datos del activo o activos a crear.
   */
  createFixedAsset: async (fixedAssetData: CreateFixedAssetDto) => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }
      const response = await fetch(`${INVENTORY_URL}fixed-assets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fixedAssetData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear activo fijo');
      }
      const newAssets: FixedAsset[] = await response.json();
      set((state) => ({
        fixedAssets: [...state.fixedAssets, ...newAssets],
        isLoading: false,
      }));
      return newAssets;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  /**
   * Actualiza un activo fijo existente.
   * @param id El ID del activo a actualizar.
   * @param fixedAssetData Datos a actualizar.
   */
  updateFixedAsset: async (id: string, fixedAssetData: UpdateFixedAssetDto) => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }
      const response = await fetch(`${INVENTORY_URL}fixed-assets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(fixedAssetData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Error al actualizar el activo fijo'
        );
      }
      const updatedAsset: FixedAsset = await response.json();
      set((state) => ({
        fixedAssets: state.fixedAssets.map((asset) =>
          asset.id === id ? updatedAsset : asset
        ),
        isLoading: false,
      }));
      return updatedAsset;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  /**
   * Elimina un activo fijo por su ID.
   * @param id El ID del activo a eliminar.
   */
  deleteFixedAsset: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }
      const response = await fetch(`${INVENTORY_URL}fixed-assets/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el activo fijo');
      }
      set((state) => ({
        fixedAssets: state.fixedAssets.filter((asset) => asset.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return false;
    }
  },

  /**
   * Obtiene todas las ubicaciones únicas de los activos.
   */
  fetchUniqueLocations: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }
      const response = await fetch(
        `${INVENTORY_URL}fixed-assets/locations/unique`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Error al obtener ubicaciones únicas'
        );
      }
      const data: string[] = await response.json();
      set({ uniqueLocations: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  /**
   * Obtiene todos los responsables únicos de los activos.
   */
  fetchUniqueResponsibles: async () => {
    set({ isLoading: true, error: null });
    try {
      const token = getTokenFromCookies();
      if (!token) {
        throw new Error('No se encontró el token de autenticación.');
      }
      const response = await fetch(
        `${INVENTORY_URL}fixed-assets/responsibles/unique`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Error al obtener responsables únicos'
        );
      }
      const data: string[] = await response.json();
      set({ uniqueResponsibles: data, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));
