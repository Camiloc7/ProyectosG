// src/api/mesas.ts
import { API_BASE_URL } from './config';
import { Mesa } from '../types/models'; 

/**
 * Crea una nueva mesa.
 * @param mesaData Datos de la mesa a crear (omitir ID y fechas).
 * @param token Token de autenticación del usuario.
 * @returns La mesa creada.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const createMesa = async (
  mesaData: Omit<Mesa, 'id' | 'created_at' | 'updated_at' | 'establecimiento'>, 
  token: string
): Promise<Mesa> => {
  try {
    const response = await fetch(`${API_BASE_URL}/mesas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(mesaData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al crear la mesa.');
    }

    const responseBody = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error('Formato de respuesta inesperado al crear la mesa.');
    }
  } catch (error: any) {
    console.error('Error en createMesa:', error.message);
    throw error;
  }
};
/**
 * Obtiene todas las mesas de un establecimiento.
 * @param token Token de autenticación del usuario.
 * @param establecimientoId ID del establecimiento para filtrar. 👈 Añadido
 * @returns Un array de mesas.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const fetchMesas = async (token: string, establecimientoId: string): Promise<Mesa[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/mesas?establecimientoId=${establecimientoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener mesas.');
    }

    const responseBody = await response.json();
    if (responseBody && Array.isArray(responseBody.data)) {
      return responseBody.data;
    } else {
      throw new Error('Formato de respuesta inesperado al obtener mesas.');
    }
  } catch (error: any) {
    console.error('Error en fetchMesas:', error.message);
    throw error;
  }
};

/**
 * Obtiene una mesa por su ID.
 * @param mesaId ID de la mesa.
 * @param token Token de autenticación del usuario.
 * @returns La mesa encontrada.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const fetchMesaById = async (mesaId: string, token: string): Promise<Mesa> => {
  try {
    const response = await fetch(`${API_BASE_URL}/mesas/${mesaId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener la mesa con ID ${mesaId}.`);
    }

    const responseBody = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(`Formato de respuesta inesperado al obtener mesa con ID ${mesaId}.`);
    }
  } catch (error: any) {
    console.error('Error en fetchMesaById:', error.message);
    throw error;
  }
};

/**
 * Actualiza una mesa existente.
 * @param mesaId ID de la mesa a actualizar.
 * @param updateData Datos para actualizar la mesa.
 * @param token Token de autenticación del usuario.
 * @returns La mesa actualizada.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const updateMesa = async (
  mesaId: string,
  updateData: Partial<Omit<Mesa, 'id' | 'created_at' | 'updated_at' | 'establecimiento'>>,
  token: string
): Promise<Mesa> => {
  try {
    const response = await fetch(`${API_BASE_URL}/mesas/${mesaId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al actualizar la mesa con ID ${mesaId}.`);
    }

    const responseBody = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(`Formato de respuesta inesperado al actualizar mesa con ID ${mesaId}.`);
    }
  } catch (error: any) {
    console.error('Error en updateMesa:', error.message);
    throw error;
  }
};

/**
 * Elimina una mesa.
 * @param mesaId ID de la mesa a eliminar.
 * @param token Token de autenticación del usuario.
 * @throws Error si la solicitud falla.
 */
export const deleteMesa = async (mesaId: string, token: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/mesas/${mesaId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al eliminar la mesa con ID ${mesaId}.`);
    }
    const responseBody = await response.json();
    if (!responseBody || responseBody.status !== true) {
      console.warn('DELETE exitoso, pero la respuesta del cuerpo no confirma status: true', responseBody);
    }
  } catch (error: any) {
    console.error('Error en deleteMesa:', error.message);
    throw error;
  }
};