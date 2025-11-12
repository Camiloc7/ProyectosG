// src/api/productos.ts
import { API_BASE_URL } from "./config";
import { Producto } from "../types/models";

interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

interface RecetaItemDto {
  ingrediente_id: string;
  cantidad_necesaria: number;
}

interface CreateProductoDto {
  establecimiento_id: string;
  categoria_id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  imagen_url?: string;
  activo: boolean;
  receta?: RecetaItemDto[];
}

interface UpdateProductoDto {
  categoria_id?: string;
  nombre?: string;
  descripcion?: string;
  precio?: number;
  imagen_url?: string;
  activo?: boolean;
  receta?: RecetaItemDto[];
}

/**
 * Obtiene todos los productos.
 * @param token Token de autenticación del usuario.
 * @returns Un array de productos.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const fetchProductos = async (token: string): Promise<Producto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/productos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al obtener productos.");
    }
    const responseBody: ApiResponse<Producto[]> = await response.json();

    if (responseBody && Array.isArray(responseBody.data)) {
      return responseBody.data;
    } else {
      throw new Error("Formato de respuesta inesperado al obtener productos.");
    }
  } catch (error: any) {
    console.error("Error en fetchProductos:", error.message);
    throw error;
  }
};

/**
 * Obtiene un producto por su ID.
 * @param id ID del producto.
 * @param token Token de autenticación del usuario.
 * @returns El producto encontrado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const fetchProductoById = async (
  id: string,
  token: string
): Promise<Producto> => {
  try {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error al obtener producto con ID ${id}.`
      );
    }
    const responseBody: ApiResponse<Producto> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(
        `Formato de respuesta inesperado al obtener producto con ID ${id}.`
      );
    }
  } catch (error: any) {
    console.error(`Error en fetchProductoById (${id}):`, error.message);
    throw error;
  }
};

/**
 * Crea un nuevo producto.
 * @param productoData Datos del producto a crear.
 * @param token Token de autenticación del usuario.
 * @returns El producto creado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const createProducto = async (
  productoData: CreateProductoDto,
  token: string
): Promise<Producto> => {
  try {
    const response = await fetch(`${API_BASE_URL}/productos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productoData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al crear producto.");
    }
    const responseBody: ApiResponse<Producto> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error("Formato de respuesta inesperado al crear producto.");
    }
  } catch (error: any) {
    console.error("Error en createProducto:", error.message);
    throw error;
  }
};

/**
 * Actualiza un producto existente.
 * @param id ID del producto a actualizar.
 * @param productoData Datos para actualizar el producto.
 * @param token Token de autenticación del usuario.
 * @returns El producto actualizado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const updateProducto = async (
  id: string,
  productoData: UpdateProductoDto,
  token: string
): Promise<Producto> => {
  try {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productoData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error al actualizar producto con ID ${id}.`
      );
    }
    const responseBody: ApiResponse<Producto> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(
        `Formato de respuesta inesperado al actualizar producto con ID ${id}.`
      );
    }
  } catch (error: any) {
    console.error(`Error en updateProducto (${id}):`, error.message);
    throw error;
  }
};

/**
 * Elimina un producto.
 * @param id ID del producto a eliminar.
 * @param token Token de autenticación del usuario.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const deleteProducto = async (
  id: string,
  token: string
): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error al eliminar producto con ID ${id}.`
      );
    }
    const responseBody: ApiResponse<null> = await response.json();
    if (!responseBody || responseBody.status !== true) {
      console.warn(
        "DELETE exitoso, pero la respuesta del cuerpo no confirma status: true",
        responseBody
      );
    }
  } catch (error: any) {
    console.error(`Error en deleteProducto (${id}):`, error.message);
    throw error;
  }
};
