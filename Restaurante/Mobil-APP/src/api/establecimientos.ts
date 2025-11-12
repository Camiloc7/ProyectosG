// src/api/establecimientos.ts
import { API_BASE_URL } from './config';
import { Establecimiento } from '../types/models';

interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface CreateEstablecimientoDto {
  nombre: string;
  direccion: string;
  telefono: string;
  activo?: boolean;
  impuesto_porcentaje?: string; 
}

interface UpdateEstablecimientoDto {
  nombre?: string;
  direccion?: string;
  telefono?: string;
  activo?: boolean;
  impuesto_porcentaje?: string;
}

/**
 * Obtiene todos los establecimientos, con un filtro opcional por estado activo.
 * @param token Token de autenticación del usuario.
 * @param activo (Opcional) Filtrar por establecimientos activos (true) o inactivos (false).
 * @returns Un array de establecimientos.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const fetchEstablecimientos = async (token: string, activo?: boolean): Promise<Establecimiento[]> => {
  let url = `${API_BASE_URL}/establecimientos`;
  if (typeof activo === 'boolean') {
    url += `?activo=${activo}`; 
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al obtener establecimientos.');
    }
    const responseBody: ApiResponse<Establecimiento[]> = await response.json();
    if (responseBody && Array.isArray(responseBody.data)) {
      return responseBody.data;
    } else {
      throw new Error('Formato de respuesta inesperado al obtener establecimientos.');
    }
  } catch (error: any) {
    console.error('Error en fetchEstablecimientos:', error.message);
    throw error;
  }
};

/**
 * Obtiene un establecimiento por su ID.
 * @param id ID del establecimiento.
 * @param token Token de autenticación del usuario.
 * @returns El establecimiento encontrado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const fetchEstablecimientoById = async (id: string, token: string): Promise<Establecimiento> => {
  try {
    const response = await fetch(`${API_BASE_URL}/establecimientos/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al obtener establecimiento con ID ${id}.`);
    }
    const responseBody: ApiResponse<Establecimiento> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(`Formato de respuesta inesperado al obtener establecimiento con ID ${id}.`);
    }
  } catch (error: any) {
    console.error(`Error en fetchEstablecimientoById (${id}):`, error.message);
    throw error;
  }
};

/**
 * Crea un nuevo establecimiento.
 * @param establecimientoData Datos del establecimiento a crear.
 * @param token Token de autenticación del usuario.
 * @returns El establecimiento creado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const createEstablecimiento = async (
  establecimientoData: CreateEstablecimientoDto,
  token: string
): Promise<Establecimiento> => {
  try {
    const response = await fetch(`${API_BASE_URL}/establecimientos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(establecimientoData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Error al crear el establecimiento.');
    }
    const responseBody: ApiResponse<Establecimiento> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error('Formato de respuesta inesperado al crear el establecimiento.');
    }
  } catch (error: any) {
    console.error('Error en createEstablecimiento:', error.message);
    throw error;
  }
};

/**
 * Actualiza un establecimiento existente.
 * @param id ID del establecimiento a actualizar.
 * @param updateData Datos para actualizar el establecimiento.
 * @param token Token de autenticación del usuario.
 * @returns El establecimiento actualizado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const updateEstablecimiento = async (
  id: string,
  updateData: UpdateEstablecimientoDto,
  token: string
): Promise<Establecimiento> => {
  try {
    const response = await fetch(`${API_BASE_URL}/establecimientos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al actualizar el establecimiento con ID ${id}.`);
    }

    const responseBody: ApiResponse<Establecimiento> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(`Formato de respuesta inesperado al actualizar el establecimiento con ID ${id}.`);
    }
  } catch (error: any) {
    console.error(`Error en updateEstablecimiento (${id}):`, error.message);
    throw error;
  }
};

/**
 * Elimina un establecimiento.
 * @param id ID del establecimiento a eliminar.
 * @param token Token de autenticación del usuario.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const deleteEstablecimiento = async (id: string, token: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/establecimientos/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al eliminar el establecimiento con ID ${id}.`);
    }
    const responseBody: ApiResponse<null> = await response.json(); 
    if (!responseBody || responseBody.status !== true) {
      console.warn('DELETE exitoso, pero la respuesta del cuerpo no confirma status: true', responseBody);
    }
  } catch (error: any) {
    console.error(`Error en deleteEstablecimiento (${id}):`, error.message);
    throw error;
  }
};
