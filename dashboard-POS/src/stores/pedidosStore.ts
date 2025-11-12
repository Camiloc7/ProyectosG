import { create } from "zustand";
import toast from "react-hot-toast";
import { RUTA } from "@/helpers/rutas";
import { useAuthStore } from "./authStore";
import { useEstablecimientosStore } from "./establecimientosStore";
import { IFormPedidos, IPedidos } from "@/types/models";

type PedidosState = {
  loading: boolean;
  loadingComanda: boolean;
  pedidos: IPedidos[];
  pedidosTotal: number;
  pedidosPendientes: any[];
  traerPedidos: () => Promise<void>;
  traerPedidoPorId: (id: string) => Promise<any | null>;
  crearPedido: (data: IFormPedidos) => Promise<string>;
  actualizarPedido: (data: IFormPedidos) => Promise<void>;
  cambiarEstadoPedido: (id: string, estado: string) => Promise<boolean>;
  eliminarPedido: (id: string) => Promise<boolean>;
  transferirMesa: (id: string, newMesaId: string) => Promise<boolean>;
  agregarItem: (pedidoId: string, itemData: any) => Promise<boolean>;
  actualizarItem: (
    pedidoId: string,
    itemId: string,
    itemData: any
  ) => Promise<boolean>;
  eliminarItem: (pedidoId: string, itemId: string) => Promise<boolean>;
  imprimirComanda: (pedidoId: string) => Promise<void>;
  takePedido: (pedidoId: string) => Promise<boolean>;
  traerPedidosPaginados: (
    page?: number,
    limit?: number,
    search?: string,
    fechaInicio?: string,
    fechaFin?: string,
    estado?: string
  ) => Promise<void>;
  actualizarEstadoPedido: (id: string, estado: string) => Promise<void>;
};

const transformarPedido = (dataOriginal: IFormPedidos) => {
  const payload: any = {
    mesa_id: dataOriginal.origen === "MESA" ? dataOriginal.mesa : null,
    tipo_pedido: dataOriginal.origen,
    cliente_nombre: null,
    cliente_telefono: null,
    cliente_direccion: null,

    notas: dataOriginal.notas || null,
    pedidoItems: dataOriginal.productos.map((prod) => ({
      producto_id: prod.id,
      cantidad: prod.cantidad,
      notas_item: prod.nota || "",
      tipo_producto: "SIMPLE",
    })),
  };
  if (dataOriginal.origen === "DOMICILIO") {
    payload.cliente_nombre = dataOriginal.nombre || null;
    payload.cliente_telefono = dataOriginal.telefono || null;
    payload.cliente_direccion = dataOriginal.direccion || null;
  } else {
    payload.cliente_nombre = null;
    payload.cliente_telefono = null;
    payload.cliente_direccion = null;
  }
  return payload;
};
export const formatearPedidos = (dataOriginal: any[]): IPedidos[] => {
  return dataOriginal.map((pedido) => ({
    id: pedido.id,
    created_at: new Date(pedido.created_at), // <-- added
    codigo_pedido: pedido.codigo_pedido || "", // <-- added
    mesa_id: pedido.mesa?.id || "",
    mesa_numero: pedido.mesa?.numero || "",
    usuario_domiciliario_id: pedido.usuario_domiciliario_id || "",
    estado: pedido.estado,
    tipo_pedido: pedido.tipo_pedido,
    cliente_nombre: pedido.cliente_nombre || "",
    cliente_telefono: pedido.cliente_telefono || "",
    cliente_direccion: pedido.cliente_direccion || "",
    total_estimado: pedido.total_estimado,
    descuentos_aplicados: pedido.descuentos_aplicados,
    notas: pedido.notas || "",
    numero_secuencial_diario: pedido.numero_secuencial_diario || "", // <-- added
    pedidoItems: (pedido.pedidoItems || []).map((item: any) => ({
      id: item.id,
      nombre: item.producto?.nombre || "",
      cantidad: item.cantidad,
      precio: parseFloat(item.precio_unitario_al_momento_venta),
      notas: item.notas_item || "",
    })),
  }));
};

const filtrarPedidos = (pedidos: any[]) => {
  return pedidos.filter(
    (pedido) =>
      pedido.estado !== "CANCELADO" &&
      pedido.estado !== "CERRADO" &&
      pedido.estado !== "PAGADO"
  );
};

export const usePedidosStore = create<PedidosState>((set, get) => ({
  loading: false,
  loadingComanda: false,
  pedidos: [],
  pedidosTotal: 0,
  pedidosPendientes: [],

  traerPedidos: async () => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch(`${RUTA}/pedidos/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);
      const pedidosFiltrados = filtrarPedidos(responseData.data);

      const pedidosFormateados = formatearPedidos(pedidosFiltrados);
      set({ pedidos: pedidosFormateados, loading: false });
    } catch (error: any) {
      console.error("No se pudo traer los pedidos", error);
      toast.error(error.message || "No se pudo traer los pedidos");
      set({ loading: false });
    }
  },

  traerPedidosPaginados: async (
    page = 1,
    limit = 25,
    search = "",
    fechaInicio = "",
    fechaFin = "",
    estado = ""
  ) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;

    try {
      const url = new URL(`${RUTA}/pedidos/historial`);
      url.searchParams.append("page", page.toString());
      url.searchParams.append("limit", limit.toString());

      if (search) url.searchParams.append("search", search);
      if (fechaInicio) url.searchParams.append("fechaInicio", fechaInicio);
      if (fechaFin) url.searchParams.append("fechaFin", fechaFin);
      if (estado && estado.toUpperCase() !== "TODOS")
        url.searchParams.append("estado", estado);

      const res = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);

      const { data, total } = responseData.data;
      const pedidosFormateados = formatearPedidos(data);

      set({
        pedidos: pedidosFormateados,
        pedidosTotal: total,
        loading: false,
      });
    } catch (error: any) {
      console.error("No se pudo traer los pedidos paginados", error);
      toast.error(error.message || "No se pudo traer los pedidos");
      set({ loading: false });
    }
  },

  crearPedido: async (data) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    const payload = transformarPedido(data);
    console.warn("RAW crear: ", payload);
    try {
      const res = await fetch(`${RUTA}/pedidos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const responseData = await res.json();

      if (!res.ok) throw new Error(responseData.message);
      toast.success(responseData.message);
      const pedidoId = responseData.data.id;

      set({ loading: false });
      return pedidoId;
    } catch (error: any) {
      console.error("Error al generar el pedido", error);
      toast.error(error.message || "Error al generar el pedido");
      set({ loading: false });
      return "error";
    }
  },

  actualizarPedido: async (data) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    const payload = transformarPedido(data);
    try {
      const res = await fetch(`${RUTA}/pedidos/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);
      toast.success(responseData.message);
      set({ loading: false });
    } catch (error: any) {
      console.error("Error al actualizar el pedido", error);
      toast.error(error.message || "Error al actualizar el pedido");
      set({ loading: false });
    }
  },

  traerPedidoPorId: async (id: string) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch(`${RUTA}/pedidos/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const responseData = await res.json();
      if (!res.ok)
        throw new Error(responseData.message || "Pedido no encontrado.");
      const pedidoCompleto = responseData.data;
      set({ loading: false });
      return pedidoCompleto;
    } catch (error: any) {
      console.error("No se pudo traer el pedido:", error);
      toast.error(error.message || "No se pudo encontrar el pedido.");
      set({ loading: false });
      return null;
    }
  },

  cambiarEstadoPedido: async (id, estado) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch(`${RUTA}/pedidos/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);
      toast.success(
        responseData.message || `Estado del pedido #${id} actualizado.`
      );
      await get().traerPedidos();
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error("Error al cambiar el estado del pedido:", error);
      toast.error(
        error.message || "No se pudo actualizar el estado del pedido."
      );
      set({ loading: false });
      return false;
    }
  },

  eliminarPedido: async (id) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch(`${RUTA}/pedidos/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);
      toast.success(
        responseData.message || `Pedido #${id} eliminado exitosamente.`
      );
      await get().traerPedidos();
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error("Error al eliminar el pedido:", error);
      toast.error(error.message || "No se pudo eliminar el pedido.");
      set({ loading: false });
      return false;
    }
  },

  transferirMesa: async (id, newMesaId) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch(`${RUTA}/pedidos/${id}/transfer-table`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ newMesaId }),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);
      toast.success(
        responseData.message || "Pedido transferido de mesa exitosamente."
      );
      await get().traerPedidos();
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error("Error al transferir la mesa:", error);
      toast.error(error.message || "No se pudo transferir la mesa.");
      set({ loading: false });
      return false;
    }
  },

  agregarItem: async (pedidoId, itemData) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    console.warn("LO QUE MANDO AL AGREGAR ITEMS: ", itemData);
    try {
      const ruta = `${RUTA}/pedidos/${pedidoId}/items`;
      console.warn("Ruta: ", ruta);
      const res = await fetch(ruta, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemData),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);
      toast.success(responseData.message || "Ítem agregado exitosamente.");
      // await get().traerPedidos();
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error("Error al agregar el ítem:", error);
      toast.error(error.message || "No se pudo agregar el ítem.");
      set({ loading: false });
      return false;
    }
  },

  actualizarItem: async (pedidoId, itemId, itemData) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch(`${RUTA}/pedidos/${pedidoId}/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(itemData),
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);
      toast.success(responseData.message || "Ítem actualizado exitosamente.");
      await get().traerPedidos();
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error("Error al actualizar el ítem:", error);
      toast.error(error.message || "No se pudo actualizar el ítem.");
      set({ loading: false });
      return false;
    }
  },

  eliminarItem: async (pedidoId, itemId) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;

    try {
      const res = await fetch(`${RUTA}/pedidos/${pedidoId}/items/${itemId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);
      toast.success(responseData.message || "Ítem eliminado exitosamente.");
      await get().traerPedidos();
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error("Error al eliminar el ítem:", error);
      toast.error(error.message || "No se pudo eliminar el ítem.");
      set({ loading: false });
      return false;
    }
  },

  imprimirComanda: async (pedidoId) => {
    const token = useAuthStore.getState().token;
    set({ loadingComanda: true });
    try {
      const res = await fetch(`${RUTA}/impresoras/comanda/${pedidoId}/pdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Error al generar el PDF.");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      window.open(url, "_blank");

      toast.success("PDF de la comanda generado exitosamente.");
    } catch (error: any) {
      console.error("Error al generar el PDF de la comanda:", error);
      toast.error(error.message || "Error al generar el PDF de la comanda.");
    } finally {
      set({ loadingComanda: false });
    }
  },

  takePedido: async (pedidoId) => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch(
        `${RUTA}/pedidos/${pedidoId}/asignar-domiciliario`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(
          responseData.message || "No se pudo asignar el pedido."
        );
      }
      toast.success(responseData.message || "Pedido asignado exitosamente.");
      await get().traerPedidos();
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error("Error al tomar el pedido:", error);
      toast.error(error.message || "No se pudo asignar el pedido.");
      set({ loading: false });
      return false;
    }
  },
  actualizarEstadoPedido: async (id, estado) => {
    const token = useAuthStore.getState().token;
    set({ loading: true });

    try {
      const res = await fetch(`${RUTA}/pedidos/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: estado }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }
      if (data.status) {
        toast.success(data.message);
        await get().traerPedidos(); //No eliminar estos
      } else {
        toast.error(data.message);
      }

      set({ loading: false });
    } catch (error: any) {
      const mensajeDev = "Error al cambiar el estado del  pedido";
      console.error(mensajeDev, error);
      set({ loading: false });
    }
  },
}));
