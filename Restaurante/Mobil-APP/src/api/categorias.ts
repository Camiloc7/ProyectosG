import { API_BASE_URL } from "./config";
import { Categoria } from "../types/models"; 

interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface CreateCategoriaDto {
  establecimiento_id: string;
  nombre: string;
  descripcion?: string;
  orden?: number;
}

interface UpdateCategoriaDto {
  nombre?: string;
  descripcion?: string;
  orden?: number;
}

/**
 * Obtiene todas las categorías.
 * @param token Token de autenticación del usuario.
 * @returns Un array de categorías.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const fetchCategorias = async (token: string): Promise<Categoria[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al obtener categorías");
    }
    const responseBody: ApiResponse<Categoria[]> = await response.json();
    if (responseBody && Array.isArray(responseBody.data)) {
      return responseBody.data;
    } else {
      throw new Error("Formato de respuesta inesperado al obtener categorías.");
    }
  } catch (error: any) {
    console.error("Error en fetchCategorias:", error.message);
    throw error;
  }
};

/**
 * Obtiene una categoría por su ID.
 * @param id ID de la categoría.
 * @param token Token de autenticación del usuario.
 * @returns La categoría encontrada.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const fetchCategoriaById = async (
  id: string,
  token: string
): Promise<Categoria> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error al obtener categoría con ID ${id}`
      );
    }
    const responseBody: ApiResponse<Categoria> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(`Formato de respuesta inesperado al obtener categoría con ID ${id}.`);
    }
  } catch (error: any) {
    console.error(`Error en fetchCategoriaById (${id}):`, error.message);
    throw error;
  }
};

/**
 * Crea una nueva categoría.
 * @param categoriaData Datos de la categoría a crear.
 * @param token Token de autenticación del usuario.
 * @returns La categoría creada.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const createCategoria = async (
  categoriaData: CreateCategoriaDto,
  token: string
): Promise<Categoria> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoriaData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al crear categoría");
    }
    const responseBody: ApiResponse<Categoria> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error("Formato de respuesta inesperado al crear categoría.");
    }
  } catch (error: any) {
    console.error("Error en createCategoria:", error.message);
    throw error;
  }
};

/**
 * Actualiza una categoría existente.
 * @param id ID de la categoría a actualizar.
 * @param categoriaData Datos para actualizar la categoría.
 * @param token Token de autenticación del usuario.
 * @returns La categoría actualizada.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const updateCategoria = async (
  id: string,
  categoriaData: UpdateCategoriaDto,
  token: string
): Promise<Categoria> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(categoriaData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error al actualizar categoría con ID ${id}`
      );
    }
    const responseBody: ApiResponse<Categoria> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(`Formato de respuesta inesperado al actualizar categoría con ID ${id}.`);
    }
  } catch (error: any) {
    console.error(`Error en updateCategoria (${id}):`, error.message);
    throw error;
  }
};

/**
 * Elimina una categoría.
 * @param id ID de la categoría a eliminar.
 * @param token Token de autenticación del usuario.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const deleteCategoria = async (
  id: string,
  token: string
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/categorias/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error al eliminar categoría con ID ${id}`
      );
    }
    const responseBody: ApiResponse<null> = await response.json(); 
    if (!responseBody || responseBody.status !== true) {
      console.warn('DELETE exitoso, pero la respuesta del cuerpo no confirma status: true', responseBody);
    }
  } catch (error: any) {
    console.error(`Error en deleteCategoria (${id}):`, error.message);
    throw error;
  }
};