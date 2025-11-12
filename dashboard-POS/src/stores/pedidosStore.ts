import { create } from "zustand";
import toast from "react-hot-toast";
import { RUTA } from "@/helpers/rutas";
import { useAuthStore } from "./authStore";
import { useEstablecimientosStore } from "./establecimientosStore";
import { IFormPedidos, IPedidos } from "@/types/models";

type PedidosState = {
  loading: boolean;
  pedidos: IPedidos[];
  pedidosTotal: number;
  pedidosPendientes: any[];
  traerPedidos: () => Promise<void>;
  traerPedidoPorId: (id: string) => Promise<IPedidos | null>;
  crearPedido: (data: IFormPedidos) => Promise<boolean>;
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
    mesa_id: pedido.mesa?.id || "",
    mesa_numero: pedido.mesa?.numero || "",
    usuario_domiciliario_id: pedido.usuario_domiciliario_id || "",
    estado: pedido.estado,
    tipo_pedido: pedido.tipo_pedido,
    cliente_nombre: pedido.cliente_nombre || "",
    cliente_telefono: pedido.cliente_telefono || "",
    cliente_direccion: pedido.cliente_direccion || "",
    total_estimado: parseFloat(pedido.total_estimado),
    descuentos_aplicados: pedido.descuentos_aplicados,
    notas: pedido.notas || "",
    pedidoItems: (pedido.pedidoItems || []).map((item: any) => ({
      id: item.id,
      nombre: item.producto?.nombre || "Producto Desconocido",
      cantidad: item.cantidad,
      precio: parseFloat(item.precio_unitario_al_momento_venta || "0"),
      notas: item.notas_item || "",
    })),
    created_at: new Date(pedido.created_at),
    codigo_pedido: pedido.codigo_pedido,
    numero_secuencial_diario: pedido.numero_secuencial_diario,
  }));
};

const getNombreEstablecimiento = () => {
  const authStore = useAuthStore.getState();
  const establecimientosStore = useEstablecimientosStore.getState();
  const establecimientoId = authStore.user?.establecimiento_id;
  const establecimiento = establecimientosStore.establecimientos.find(
    (est) => est.id === establecimientoId
  );
  return establecimiento?.nombre || "Establecimiento no encontrado";
};

export const usePedidosStore = create<PedidosState>((set, get) => ({
  loading: false,
  pedidos: [],
  pedidosTotal: 0,
  pedidosPendientes: [],

  traerPedidos: async () => {
    set({ loading: true });
    const token = useAuthStore.getState().token;
    try {
      const res = await fetch(`${RUTA}/pedidos`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.message);
      const pedidosFormateados = formatearPedidos(responseData.data);
      const pedidosFiltrados = pedidosFormateados.filter(
        (pedido) =>
          pedido.estado.toUpperCase() !== "PAGADO" &&
          pedido.estado.toUpperCase() !== "CANCELADO"
      );
      const pedidosOrdenados = pedidosFiltrados.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      set({ pedidos: pedidosOrdenados, loading: false });
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
      const establecimientosStore = useEstablecimientosStore.getState();
      if (establecimientosStore.establecimientos.length === 0) {
        await establecimientosStore.fetchEstablecimientos();
      }
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
      await get().traerPedidos();
      set({ loading: false });
      return true;
    } catch (error: any) {
      console.error("Error al generar el pedido", error);
      toast.error(error.message || "Error al generar el pedido");
      set({ loading: false });
      return false;
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
      await get().traerPedidos();
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
    try {
      const res = await fetch(`${RUTA}/pedidos/${pedidoId}/items`, {
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
      await get().traerPedidos();
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
    set({ loading: true });
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
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `comanda-${pedidoId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("PDF de la comanda generado exitosamente.");
    } catch (error: any) {
      console.error("Error al generar el PDF de la comanda:", error);
      toast.error(error.message || "Error al generar el PDF de la comanda.");
    } finally {
      set({ loading: false });
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
}));

// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { RUTA } from "@/helpers/rutas";
// import { useAuthStore } from "./authStore";
// import { useEstablecimientosStore } from "./establecimientosStore";
// import { IFormPedidos, IPedidos } from "@/types/models";

// type PedidosState = {
//   loading: boolean;
//   pedidos: IPedidos[];
//   pedidosTotal: number; // NUEVO: Estado para almacenar el total de pedidos
//   pedidosPendientes: any[];
//   traerPedidos: () => Promise<void>;
//   traerTodosLosPedidos: () => Promise<void>;
//   traerPedidoPorId: (id: string) => Promise<IPedidos | null>;
//   crearPedido: (data: IFormPedidos) => Promise<boolean>;
//   actualizarPedido: (data: IFormPedidos) => Promise<void>;
//   cambiarEstadoPedido: (id: string, estado: string) => Promise<boolean>;
//   eliminarPedido: (id: string) => Promise<boolean>;
//   transferirMesa: (id: string, newMesaId: string) => Promise<boolean>;
//   agregarItem: (pedidoId: string, itemData: any) => Promise<boolean>;
//   actualizarItem: (pedidoId: string, itemId: string, itemData: any) => Promise<boolean>;
//   eliminarItem: (pedidoId: string, itemId: string) => Promise<boolean>;
//   imprimirComanda: (pedidoId: string) => Promise<void>;
//   takePedido: (pedidoId: string) => Promise<boolean>;
//     traerTodosLosPedidosPaginado: (
//     page?: number,
//     limit?: number
//   ) => Promise<void>;
// };

// const transformarPedido = (dataOriginal: IFormPedidos) => {
//   const payload: any = {
//     mesa_id: dataOriginal.origen === "MESA" ? dataOriginal.mesa : null,
//     tipo_pedido: dataOriginal.origen,
//     cliente_nombre: null,
//     cliente_telefono: null,
//     cliente_direccion: null,
//     notas: dataOriginal.idOrdenExterna || null,
//     pedidoItems: dataOriginal.productos.map((prod) => ({
//       producto_id: prod.id,
//       cantidad: prod.cantidad,
//       notas_item: prod.nota || "",
//       tipo_producto: "SIMPLE",
//     })),
//   };
//   if (dataOriginal.origen === "DOMICILIO") {
//     payload.cliente_nombre = dataOriginal.nombre || null;
//     payload.cliente_telefono = dataOriginal.telefono || null;
//     payload.cliente_direccion = dataOriginal.direccion || null;
//   } else {
//     payload.cliente_nombre = null;
//     payload.cliente_telefono = null;
//     payload.cliente_direccion = null;
//   }
//   return payload;
// };

// export const formatearPedidos = (dataOriginal: any[]): IPedidos[] => {
//   return dataOriginal.map((pedido) => ({
//     id: pedido.id,
//     mesa_id: pedido.mesa?.id || "",
//     mesa_numero: pedido.mesa?.numero || "",
//     usuario_domiciliario_id: pedido.usuario_domiciliario_id || "",
//     estado: pedido.estado,
//     tipo_pedido: pedido.tipo_pedido,
//     cliente_nombre: pedido.cliente_nombre || "",
//     cliente_telefono: pedido.cliente_telefono || "",
//     cliente_direccion: pedido.cliente_direccion || "",
//     total_estimado: parseFloat(pedido.total_estimado),
//     descuentos_aplicados: pedido.descuentos_aplicados,
//     notas: pedido.notas || "",
//     pedidoItems: (pedido.pedidoItems || []).map((item: any) => ({
//       id: item.id,
//       nombre: item.producto?.nombre || "Producto Desconocido",
//       cantidad: item.cantidad,
//       precio: parseFloat(item.precio_unitario_al_momento_venta || "0"),
//       notas: item.notas_item || "",
//     })),
//     created_at: new Date(pedido.created_at),
//     codigo_pedido: pedido.codigo_pedido,
//     numero_secuencial_diario: pedido.numero_secuencial_diario,
//   }));
// };
// const getNombreEstablecimiento = () => {
//   const authStore = useAuthStore.getState();
//   const establecimientosStore = useEstablecimientosStore.getState();
//   const establecimientoId = authStore.user?.establecimiento_id;
//   const establecimiento = establecimientosStore.establecimientos.find(
//     (est) => est.id === establecimientoId
//   );
//   return establecimiento?.nombre || "Establecimiento no encontrado";
// };
// export const usePedidosStore = create<PedidosState>((set, get) => ({
//   loading: false,
//   pedidos: [],
//   pedidosPendientes: [],
//   traerPedidos: async () => {
//     set({ loading: true });
//     const token = useAuthStore.getState().token;
//     try {
//       const res = await fetch(`${RUTA}/pedidos`, {
//         method: "GET",x
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const responseData = await res.json();
//       if (!res.ok) throw new Error(responseData.message);
//       const pedidosFormateados = formatearPedidos(responseData.data);
//       const pedidosFiltrados = pedidosFormateados.filter(
//         (pedido) => pedido.estado.toUpperCase() !== "PAGADO" && pedido.estado.toUpperCase() !== "CANCELADO"
//       );
//       const pedidosOrdenados = pedidosFiltrados.sort(
//         (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//       );
//       set({ pedidos: pedidosOrdenados, loading: false });
//     } catch (error: any) {
//       console.error("No se pudo traer los pedidos", error);
//       toast.error(error.message || "No se pudo traer los pedidos");
//       set({ loading: false });
//     }
//   },
//   crearPedido: async (data) => {
//     set({ loading: true });
//     const token = useAuthStore.getState().token;
//     const payload = transformarPedido(data);
//     try {
//       const establecimientosStore = useEstablecimientosStore.getState();
//       if (establecimientosStore.establecimientos.length === 0) {
//         await establecimientosStore.fetchEstablecimientos();
//       }
//       const res = await fetch(`${RUTA}/pedidos`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(payload),
//       });
//       const responseData = await res.json();
//       if (!res.ok) throw new Error(responseData.message);
//       toast.success(responseData.message);
//       const pedidoId = responseData.data.id;
//       await get().traerPedidos();
//       set({ loading: false });
//       return true;
//     } catch (error: any) {
//       console.error("Error al generar el pedido", error);
//       toast.error(error.message || "Error al generar el pedido");
//       set({ loading: false });
//       return false;
//     }
//   },
//   actualizarPedido: async (data) => {
//     set({ loading: true });
//     const token = useAuthStore.getState().token;
//     const payload = transformarPedido(data);
//     try {
//       const res = await fetch(`${RUTA}/pedidos/${data.id}`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(payload),
//       });
//       const responseData = await res.json();
//       if (!res.ok) throw new Error(responseData.message);
//       toast.success(responseData.message);
//       await get().traerPedidos();
//       set({ loading: false });
//     } catch (error: any) {
//       console.error("Error al actualizar el pedido", error);
//       toast.error(error.message || "Error al actualizar el pedido");
//       set({ loading: false });
//     }
//   },
//   traerPedidoPorId: async (id: string) => {
//     set({ loading: true });
//     const token = useAuthStore.getState().token;
//     try {
//         const res = await fetch(`${RUTA}/pedidos/${id}`, {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${token}`,
//             },
//         });
//         const responseData = await res.json();
//         if (!res.ok) throw new Error(responseData.message || "Pedido no encontrado.");
//         const pedidoCompleto = responseData.data;
//         set({ loading: false });
//         return pedidoCompleto;
//     } catch (error: any) {
//         console.error("No se pudo traer el pedido:", error);
//         toast.error(error.message || "No se pudo encontrar el pedido.");
//         set({ loading: false });
//         return null;
//     }
//   },
//   cambiarEstadoPedido: async (id, estado) => {
//     set({ loading: true });
//     const token = useAuthStore.getState().token;
//     try {
//       const res = await fetch(`${RUTA}/pedidos/${id}/status`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ estado }),
//       });
//       const responseData = await res.json();
//       if (!res.ok) throw new Error(responseData.message);
//       toast.success(responseData.message || `Estado del pedido #${id} actualizado.`);
//       await get().traerPedidos();
//       set({ loading: false });
//       return true;
//     } catch (error: any) {
//       console.error("Error al cambiar el estado del pedido:", error);
//       toast.error(error.message || "No se pudo actualizar el estado del pedido.");
//       set({ loading: false });
//       return false;
//     }
//   },
//   eliminarPedido: async (id) => {
//     set({ loading: true });
//     const token = useAuthStore.getState().token;
//     try {
//       const res = await fetch(`${RUTA}/pedidos/${id}`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const responseData = await res.json();
//       if (!res.ok) throw new Error(responseData.message);
//       toast.success(responseData.message || `Pedido #${id} eliminado exitosamente.`);
//       await get().traerPedidos();
//       set({ loading: false });
//       return true;
//     } catch (error: any) {
//       console.error("Error al eliminar el pedido:", error);
//       toast.error(error.message || "No se pudo eliminar el pedido.");
//       set({ loading: false });
//       return false;
//     }
//   },
//   transferirMesa: async (id, newMesaId) => {
//     set({ loading: true });
//     const token = useAuthStore.getState().token;
//     try {
//       const res = await fetch(`${RUTA}/pedidos/${id}/transfer-table`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify({ newMesaId }),
//       });
//       const responseData = await res.json();
//       if (!res.ok) throw new Error(responseData.message);
//       toast.success(responseData.message || "Pedido transferido de mesa exitosamente.");
//       await get().traerPedidos();
//       set({ loading: false });
//       return true;
//     } catch (error: any) {
//       console.error("Error al transferir la mesa:", error);
//       toast.error(error.message || "No se pudo transferir la mesa.");
//       set({ loading: false });
//       return false;
//     }
//   },
//   agregarItem: async (pedidoId, itemData) => {
//     set({ loading: true });
//     const token = useAuthStore.getState().token;
//     try {
//       const res = await fetch(`${RUTA}/pedidos/${pedidoId}/items`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(itemData),
//       });
//       const responseData = await res.json();
//       if (!res.ok) throw new Error(responseData.message);
//       toast.success(responseData.message || "Ítem agregado exitosamente.");
//       await get().traerPedidos();
//       set({ loading: false });
//       return true;
//     } catch (error: any) {
//       console.error("Error al agregar el ítem:", error);
//       toast.error(error.message || "No se pudo agregar el ítem.");
//       set({ loading: false });
//       return false;
//     }
//   },
//   actualizarItem: async (pedidoId, itemId, itemData) => {
//     set({ loading: true });
//     const token = useAuthStore.getState().token;
//     try {
//       const res = await fetch(`${RUTA}/pedidos/${pedidoId}/items/${itemId}`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//         body: JSON.stringify(itemData),
//       });
//       const responseData = await res.json();
//       if (!res.ok) throw new Error(responseData.message);
//       toast.success(responseData.message || "Ítem actualizado exitosamente.");
//       await get().traerPedidos();
//       set({ loading: false });
//       return true;
//     } catch (error: any) {
//       console.error("Error al actualizar el ítem:", error);
//       toast.error(error.message || "No se pudo actualizar el ítem.");
//       set({ loading: false });
//       return false;
//     }
//   },
//   eliminarItem: async (pedidoId, itemId) => {
//     set({ loading: true });
//     const token = useAuthStore.getState().token;

//     try {
//       const res = await fetch(`${RUTA}/pedidos/${pedidoId}/items/${itemId}`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const responseData = await res.json();
//       if (!res.ok) throw new Error(responseData.message);
//       toast.success(responseData.message || "Ítem eliminado exitosamente.");
//       await get().traerPedidos();
//       set({ loading: false });
//       return true;
//     } catch (error: any) {
//       console.error("Error al eliminar el ítem:", error);
//       toast.error(error.message || "No se pudo eliminar el ítem.");
//       set({ loading: false });
//       return false;
//     }
//   },
//   imprimirComanda: async (pedidoId) => {
//     const token = useAuthStore.getState().token;
//     try {
//       const res = await fetch(`${RUTA}/impresoras/comanda/${pedidoId}/pdf`, {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.message || "Error al generar el PDF.");
//       }

//       const blob = await res.blob();
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', `comanda-${pedidoId}.pdf`);
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);

//       toast.success("PDF de la comanda generado exitosamente.");
//     } catch (error: any) {
//       console.error("Error al generar el PDF de la comanda:", error);
//       toast.error(error.message || "Error al generar el PDF de la comanda.");
//     }
//   },
//   takePedido: async (pedidoId) => {
//     set({ loading: true });
//     const token = useAuthStore.getState().token;
//     try {
//       const res = await fetch(`${RUTA}/pedidos/${pedidoId}/asignar-domiciliario`, {
//         method: "PATCH",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const responseData = await res.json();
//       if (!res.ok) {
//         throw new Error(responseData.message || "No se pudo asignar el pedido.");
//       }
//       toast.success(responseData.message || "Pedido asignado exitosamente.");
//       await get().traerPedidos();
//       set({ loading: false });
//       return true;
//     } catch (error: any) {
//       console.error("Error al tomar el pedido:", error);
//       toast.error(error.message || "No se pudo asignar el pedido.");
//       set({ loading: false });
//       return false;
//     }
//   },
//    traerTodosLosPedidos: async () => {
//     set({ loading: true });
//     const token = useAuthStore.getState().token;
//     try {
//       const res = await fetch(`${RUTA}/pedidos`, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const responseData = await res.json();
//       if (!res.ok) throw new Error(responseData.message);
//       const pedidosFormateados = formatearPedidos(responseData.data);
//       const pedidosOrdenados = pedidosFormateados.sort(
//         (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//       );
//       set({ pedidos: pedidosOrdenados, loading: false });
//     } catch (error: any) {
//       console.error("No se pudo traer todos los pedidos", error);
//       toast.error(error.message || "No se pudo traer los pedidos");
//       set({ loading: false });
//     }
//   },
// }));
