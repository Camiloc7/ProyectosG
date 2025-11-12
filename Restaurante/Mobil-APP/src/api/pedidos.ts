import { API_BASE_URL } from "./config";
import {
  Pedido,
  CreatePedidoDto,
  PedidoItem,
  CreatePedidoItemDto,
  UpdatePedidoItemDto,
  EstadoPedido,
  TipoPedido,
} from "../types/models";

interface ApiResponse<T> {
  status: boolean;
  message: string;
  data: T;
}

/**
 * Crea un nuevo pedido.
 * @param createPedidoDto Datos para crear el pedido.
 * @param token Token de autenticación del usuario.
 * @returns El pedido creado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const createPedido = async (
  createPedidoDto: CreatePedidoDto,
  token: string
): Promise<Pedido> => {
  const { establecimiento_id, ...safePedidoDto } = createPedidoDto;

  console.warn("Lo que envio RAW", safePedidoDto);

  try {
    const response = await fetch(`${API_BASE_URL}/pedidos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(safePedidoDto),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al crear el pedido.");
    }
    const responseBody: ApiResponse<Pedido> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error("Formato de respuesta inesperado al crear el pedido.");
    }
  } catch (error: any) {
    console.error("Error en createPedido:", error.message);
    throw error;
  }
};

/**
 * Busca un pedido por ID de mesa y estado.
 * @param mesaId ID de la mesa.
 * @param status Estado del pedido a buscar.
 * @param token Token de autenticación del usuario.
 * @returns El pedido encontrado, o null si no se encuentra.
 * @throws Error si la solicitud falla por otras razones.
 */
export const fetchPedidoByMesaIdAndStatus = async (
  mesaId: string,
  status: EstadoPedido,
  token: string
): Promise<Pedido | null> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/pedidos?mesaId=${mesaId}&estado=${status}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404 || response.status === 204) {
        return null;
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Error al buscar pedido para la mesa ${mesaId}.`
      );
    }
    const responseBody: ApiResponse<Pedido[]> = await response.json();
    if (
      responseBody &&
      Array.isArray(responseBody.data) &&
      responseBody.data.length > 0
    ) {
      return responseBody.data[0];
    } else {
      if (
        responseBody &&
        Array.isArray(responseBody.data) &&
        responseBody.data.length === 0
      ) {
        return null;
      }
      throw new Error(
        `Formato de respuesta inesperado al buscar pedido para la mesa ${mesaId}.`
      );
    }
  } catch (error: any) {
    console.error(
      `Error en fetchPedidoByMesaIdAndStatus (${mesaId}, ${status}):`,
      error.message
    );
    throw error;
  }
};

/**
 * Añade o actualiza un ítem en un pedido existente.
 * @param pedidoId ID del pedido.
 * @param createPedidoItemDto Datos del ítem a añadir/actualizar.
 * @param token Token de autenticación del usuario.
 * @returns El ítem del pedido añadido/actualizado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const addOrUpdatePedidoItem = async (
  pedidoId: string,
  createPedidoItemDto: CreatePedidoItemDto,
  token: string
): Promise<PedidoItem> => {
  // 🔥 Agregamos/forzamos el campo tipo_producto
  const dtoConTipo = {
    ...createPedidoItemDto,
    tipo_producto: "SIMPLE",
  };

  console.warn("DTO FINAL QUE SE ENVÍA:", dtoConTipo);

  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(dtoConTipo),
    });

    const responseBody: ApiResponse<PedidoItem> = await response.json();

    if (!response.ok) {
      throw new Error(
        responseBody.message ||
          `Error al añadir/actualizar ítem en pedido ${pedidoId}.`
      );
    }

    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(
        `Formato de respuesta inesperado al añadir/actualizar ítem en pedido ${pedidoId}.`
      );
    }
  } catch (error: any) {
    console.error("Error en addOrUpdatePedidoItem:", error.message);
    throw error;
  }
};

/**
 * Elimina un ítem de un pedido.
 * @param pedidoId ID del pedido.
 * @param itemId ID del ítem a eliminar.
 * @param token Token de autenticación del usuario.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const removePedidoItem = async (
  pedidoId: string,
  itemId: string,
  token: string
): Promise<void> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/pedidos/${pedidoId}/items/${itemId}`,
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
          `Error al eliminar ítem ${itemId} del pedido ${pedidoId}.`
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
    console.error("Error en removePedidoItem:", error.message);
    throw error;
  }
};

/**
 * Actualiza el estado de un pedido.
 * @param token Token de autenticación del usuario.
 * @param pedidoId ID del pedido.
 * @param newStatus Nuevo estado del pedido.
 * @returns El pedido actualizado.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */
export const updatePedidoStatus = async (
  token: string,
  pedidoId: string,
  newStatus: EstadoPedido
): Promise<Pedido> => {
  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ estado: newStatus }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message ||
          `Error al actualizar estado del pedido ${pedidoId}.`
      );
    }
    const responseBody: ApiResponse<Pedido> = await response.json();
    if (responseBody && responseBody.data) {
      return responseBody.data;
    } else {
      throw new Error(
        `Formato de respuesta inesperado al actualizar estado del pedido ${pedidoId}.`
      );
    }
  } catch (error: any) {
    console.error(
      `Error en updatePedidoStatus (${pedidoId}, ${newStatus}):`,
      error.message
    );
    throw error;
  }
};

/**
 * Obtiene todos los pedidos con filtros opcionales.
 * @param token Token de autenticación del usuario.
 * @param establecimientoId ID del establecimiento.
 * @param estado (Opcional) Filtrar por estado del pedido.
 * @param tipoPedido (Opcional) Filtrar por tipo de pedido.
 * @param mesaId (Opcional) Filtrar por ID de mesa.
 * @param usuarioCreadorId (Opcional) Filtrar por ID del usuario creador.
 * @returns Un array de pedidos.
 * @throws Error si la solicitud falla o el formato de respuesta es inesperado.
 */

export const fetchPedidos = async (
  token: string,
  establecimientoId: string,
  estado?: EstadoPedido,
  tipoPedido?: TipoPedido,
  mesaId?: string,
  usuarioCreadorId?: string
): Promise<Pedido[]> => {
  try {
    let queryParams = `establecimientoId=${establecimientoId}`;
    if (estado) queryParams += `&estado=${estado}`;
    if (tipoPedido) queryParams += `&tipoPedido=${tipoPedido}`;
    if (mesaId) queryParams += `&mesaId=${mesaId}`;
    if (usuarioCreadorId)
      queryParams += `&usuarioCreadorId=${usuarioCreadorId}`;

    const response = await fetch(`${API_BASE_URL}/pedidos?${queryParams}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al obtener los pedidos.");
    }
    const responseBody: ApiResponse<Pedido[]> = await response.json();
    if (responseBody && Array.isArray(responseBody.data)) {
      return responseBody.data;
    } else {
      throw new Error("Formato de respuesta inesperado al obtener pedidos.");
    }
  } catch (error: any) {
    console.error("Error en fetchPedidos:", error.message);
    throw error;
  }
};
