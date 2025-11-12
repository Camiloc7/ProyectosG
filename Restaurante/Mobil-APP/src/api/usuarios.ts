import { API_BASE_URL } from "./config";
import { Usuario } from "../types/models"; // Asumimos que tienes un tipo 'Usuario' similar a los otros.

// Definimos las interfaces DTO directamente en este archivo
interface CreateUsuarioDto {
  establecimientoName: string;
  rolName: string;
  nombre: string;
  apellido: string;
  username: string;
  password: string;
  activo?: boolean;
}

interface UpdateUsuarioDto {
  nombre?: string;
  apellido?: string;
  username?: string;
  password_nueva?: string;
  rolName?: string;
  activo?: boolean;
}

interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

/**
 * Obtiene todos los usuarios, con un filtro opcional por establecimiento.
 * @param token Token de autenticación.
 * @param establecimientoId (Opcional) ID del establecimiento para filtrar usuarios.
 * @returns Un array de usuarios.
 */
export const fetchUsuarios = async (token: string, establecimientoId?: string): Promise<Usuario[]> => {
  let url = `${API_BASE_URL}/usuarios`;
  if (establecimientoId) {
    url += `?establecimientoId=${establecimientoId}`;
  }

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al obtener usuarios.');
  }
  
  const responseBody: ApiResponse<Usuario[]> = await response.json();
  if (responseBody && Array.isArray(responseBody.data)) {
    return responseBody.data;
  } else {
    throw new Error('Formato de respuesta inesperado al obtener usuarios.');
  }
};

/**
 * Crea un nuevo usuario.
 * @param userData Datos del usuario a crear.
 * @param token Token de autenticación.
 * @returns El usuario creado.
 */
export const createUsuario = async (userData: CreateUsuarioDto, token: string): Promise<Usuario> => {
  const response = await fetch(`${API_BASE_URL}/usuarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al crear el usuario.');
  }
  
  const responseBody: ApiResponse<Usuario> = await response.json();
  if (responseBody && responseBody.data) {
    return responseBody.data;
  } else {
    throw new Error('Formato de respuesta inesperado al crear el usuario.');
  }
};

/**
 * Actualiza un usuario existente.
 * @param id ID del usuario a actualizar.
 * @param updateData Datos para actualizar el usuario.
 * @param token Token de autenticación.
 * @returns El usuario actualizado.
 */
export const updateUsuario = async (id: string, updateData: UpdateUsuarioDto, token: string): Promise<Usuario> => {
  const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error al actualizar el usuario con ID ${id}.`);
  }
  
  const responseBody: ApiResponse<Usuario> = await response.json();
  if (responseBody && responseBody.data) {
    return responseBody.data;
  } else {
    throw new Error(`Formato de respuesta inesperado al actualizar el usuario con ID ${id}.`);
  }
};

/**
 * Elimina un usuario.
 * @param id ID del usuario a eliminar.
 * @param token Token de autenticación.
 */
export const deleteUsuario = async (id: string, token: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/usuarios/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error al eliminar el usuario con ID ${id}.`);
  }
};