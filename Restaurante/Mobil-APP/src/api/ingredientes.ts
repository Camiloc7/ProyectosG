import { API_BASE_URL } from "./config";
import {
  Ingrediente,
  CreateIngredienteDto,
  UpdateIngredienteDto,
} from "../types/models";
interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

/**
 * Crea un nuevo ingrediente.
 * @param ingredienteData Datos del ingrediente a crear.
 * @param token Token de autenticación del usuario.
 * @returns El ingrediente creado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const createIngrediente = async (
  ingredienteData: CreateIngredienteDto,
  token: string
): Promise<Ingrediente> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ingredientes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ingredienteData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al crear el ingrediente.");
    }
    const responseBody: ApiResponse<Ingrediente> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(
        "Formato de respuesta inesperado al crear el ingrediente."
      );
    }
  } catch (error: any) {
    console.error("Error en createIngrediente:", error.message);
    throw error;
  }
};

/**
 * Obtiene todos los ingredientes de un establecimiento.
 * @param token Token de autenticación del usuario.
 * @param establecimientoId ID del establecimiento.
 * @returns Un array de ingredientes.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const fetchIngredientes = async (
  token: string
): Promise<Ingrediente[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ingredientes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al obtener ingredientes.");
    }

    const responseBody: ApiResponse<Ingrediente[]> = await response.json();
    if (responseBody && Array.isArray(responseBody.data)) {
      return responseBody.data;
    } else {
      throw new Error(
        "Formato de respuesta inesperado al obtener ingredientes."
      );
    }
  } catch (error: any) {
    console.error("Error en fetchIngredientes:", error.message);
    throw error;
  }
};

/**
 * Obtiene un ingrediente por su ID.
 * @param ingredienteId ID del ingrediente.
 * @param token Token de autenticación del usuario.
 * @returns El ingrediente encontrado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const fetchIngredienteById = async (
  ingredienteId: string,
  token: string
): Promise<Ingrediente> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ingredientes/${ingredienteId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error al obtener el ingrediente con ID ${ingredienteId}.`
      );
    }

    const responseBody: ApiResponse<Ingrediente> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(
        `Formato de respuesta inesperado al obtener el ingrediente con ID ${ingredienteId}.`
      );
    }
  } catch (error: any) {
    console.error("Error en fetchIngredienteById:", error.message);
    throw error;
  }
};

/**
 * Actualiza un ingrediente existente.
 * @param ingredienteId ID del ingrediente a actualizar.
 * @param updateData Datos para actualizar el ingrediente.
 * @param token Token de autenticación del usuario.
 * @returns El ingrediente actualizado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const updateIngrediente = async (
  ingredienteId: string,
  updateData: UpdateIngredienteDto,
  token: string
): Promise<Ingrediente> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ingredientes/${ingredienteId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error al actualizar el ingrediente con ID ${ingredienteId}.`
      );
    }
    const responseBody: ApiResponse<Ingrediente> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(
        `Formato de respuesta inesperado al actualizar el ingrediente con ID ${ingredienteId}.`
      );
    }
  } catch (error: any) {
    console.error("Error en updateIngrediente:", error.message);
    throw error;
  }
};

/**
 * Elimina un ingrediente.
 * @param ingredienteId ID del ingrediente a eliminar.
 * @param token Token de autenticación del usuario.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const deleteIngrediente = async (
  ingredienteId: string,
  token: string
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/ingredientes/${ingredienteId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error al eliminar el ingrediente con ID ${ingredienteId}.`
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
    console.error("Error en deleteIngrediente:", error.message);
    throw error;
  }
};
