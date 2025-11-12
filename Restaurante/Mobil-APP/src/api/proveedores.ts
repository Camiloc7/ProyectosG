import { API_BASE_URL } from './config';
import { Proveedor } from '../types/models';

/**
 * Crea un nuevo proveedor.
 * @param proveedorData Datos del proveedor a crear.
 * @param token Token de autenticación del usuario.
 * @returns El proveedor creado.
 * @throws Error si la solicitud falla.
 */
export const createProveedor = async (proveedorData: Omit<Proveedor, 'id' | 'created_at' | 'updated_at' | 'activo'>, token: string): Promise<Proveedor> => {
  try {
    const response = await fetch(`${API_BASE_URL}/proveedores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(proveedorData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al crear el proveedor.');
    }


    const responseBody = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data; 
    } else {
      throw new Error('Formato de respuesta inesperado al crear proveedor.');
    }


  } catch (error: any) {
    console.error('Error en createProveedor:', error.message);
    throw error;
  }
};

/**
 * Obtiene todos los proveedores.
 * @param token Token de autenticación del usuario.
 * @returns Un array de proveedores.
 * @throws Error si la solicitud falla.
 */
export const fetchProveedores = async (token: string): Promise<Proveedor[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/proveedores`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al obtener los proveedores.');
    }
    const responseBody = await response.json();
    if (responseBody && Array.isArray(responseBody.data)) {
      return responseBody.data;
    } else {
      throw new Error('Formato de respuesta inesperado al obtener proveedores.');
    }
  } catch (error: any) {
    console.error('Error en fetchProveedores:', error.message);
    throw error;
  }
};

/**
 * Obtiene un proveedor por su ID.
 * @param proveedorId ID del proveedor.
 * @param token Token de autenticación del usuario.
 * @returns El proveedor encontrado.
 * @throws Error si la solicitud falla o el proveedor no se encuentra.
 */
export const fetchProveedorById = async (proveedorId: string, token: string): Promise<Proveedor> => {
  try {
    const response = await fetch(`${API_BASE_URL}/proveedores/${proveedorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error al obtener el proveedor con ID ${proveedorId}.`);
    }
    const responseBody = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data; 
    } else {
      throw new Error(`Formato de respuesta inesperado al obtener proveedor con ID ${proveedorId}.`);
    }
  } catch (error: any) {
    console.error('Error en fetchProveedorById:', error.message);
    throw error;
  }
};

/**
 * Actualiza un proveedor existente.
 * @param proveedorId ID del proveedor a actualizar.
 * @param updateData Datos para actualizar el proveedor.
 * @param token Token de autenticación del usuario.
 * @returns El proveedor actualizado.
 * @throws Error si la solicitud falla.
 */
export const updateProveedor = async (proveedorId: string, updateData: Partial<Omit<Proveedor, 'id' | 'created_at' | 'updated_at'>>, token: string): Promise<Proveedor> => {
  try {
    const response = await fetch(`${API_BASE_URL}/proveedores/${proveedorId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error al actualizar el proveedor con ID ${proveedorId}.`);
    }
    const responseBody = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data; 
    } else {
      throw new Error(`Formato de respuesta inesperado al actualizar proveedor con ID ${proveedorId}.`);
    }

  } catch (error: any) {
    console.error('Error en updateProveedor:', error.message);
    throw error;
  }
};
/**
 * Elimina un proveedor.
 * @param proveedorId ID del proveedor a eliminar.
 * @param token Token de autenticación del usuario.
 * @throws Error si la solicitud falla.
 */
export const deleteProveedor = async (proveedorId: string, token: string): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/proveedores/${proveedorId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error al eliminar el proveedor con ID ${proveedorId}.`);
    }
    const responseBody = await response.json();
    if (!responseBody || responseBody.status !== true) {
      console.warn('DELETE exitoso, pero la respuesta del cuerpo no confirma status: true', responseBody);
    }
  } catch (error: any) {
    console.error('Error en deleteProveedor:', error.message);
    throw error;
  }
};




