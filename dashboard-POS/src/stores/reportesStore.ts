// src/stores/reportesDashboardStore.ts

import { create } from "zustand";
import { RUTA } from "@/helpers/rutas";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";

// --- INTERFACES ---
export interface ResumenFinanciero {
  totalVentas: number;
  totalImpuestos: number;
  totalDescuentos: number;
  totalPropina: number;
  totalNeto: number;
}

export interface DetalleFactura {
  id: string;
  fecha_hora_factura: string;
  total_factura: number;
  usuarioCajero: string;
  tipo_factura: string;
  pedidosAsociados: { pedidoId: string; montoAplicado: number }[];
}

export interface VentasDiarias {
  fecha: string;
  total: number;
}

export interface ReporteVentasData {
  fechaReporte: string;
  filtrosAplicados: {
    establecimientoId: string;
    fechaInicio: string;
    fechaFin: string;
    usuarioCajeroId?: string;
    limit?: number;
    offset?: number;
  };
  resumenFinanciero: ResumenFinanciero;
  ventasPorMedioPago: { medio: string; total: number }[];
  ventasPorCategoria: { categoria: string; total: number }[];
  topProductosVendidos: { nombre: string; cantidad: number; total: number }[];
  detalleFacturas: {
    total: number;
    limit: number;
    offset: number;
    data: DetalleFactura[];
  };
  ventasPorDia: VentasDiarias[];
}

export interface ResumenInventario {
  totalIngredientes: number;
  itemsBajoStock: number;
  valorTotalInventario: number;
}

export interface DetalleInventario {
  id: string;
  nombre: string;
  unidadMedida: string;
  stockActual: number;
  stockMinimo: number;
  costoUnitario: number;
  estado: string;
}

export interface ReporteInventarioData {
  fechaReporte: string;
  establecimientoId: string;
  resumenInventario: ResumenInventario;
  detalleInventario: DetalleInventario[];
}

export interface ResumenPedidos {
  totalPedidos: number;
  pedidosAbiertos: number;
  pedidosEnPreparacion: number;
  pedidosListos: number;
}

export interface PedidoItem {
  id: string;
  productoNombre: string;
  cantidad: number;
  estadoCocina: string;
  tiempoEnEstadoCocina: number;
  notas: string;
}

export interface DetallePedido {
  id: string;
  tipoPedido: string;
  estadoPedido: string;
  mesa: string;
  clienteNombre: string;
  usuarioCreador: string;
  fechaHoraPedido: string;
  totalEstimado: number;
  items: PedidoItem[];
}

export interface ReportePedidosEstadoData {
  fechaReporte: string;
  establecimientoId: string;
  resumenPedidos: ResumenPedidos;
  detallePedidos: DetallePedido[];
}

interface ReportesDashboardState {
  reporteVentas: ReporteVentasData | null;
  reporteVentasComparacion: ReporteVentasData | null;
  reporteInventario: ReporteInventarioData | null;
  reportePedidos: ReportePedidosEstadoData | null;
  loading: {
    ventas: boolean;
    inventario: boolean;
    pedidos: boolean;
  };
  error: {
    ventas: string | null;
    inventario: string | null;
    pedidos: string | null;
  };

  generarReporteVentas: (
    fechaInicio: string,
    fechaFin: string,
    usuarioCajeroId?: string,
    limit?: number,
    offset?: number,
    isComparison?: boolean
  ) => Promise<void>;
  generarReporteInventario: () => Promise<void>;
  generarReportePedidos: (
    estadoPedido?: string,
    estadoCocinaItem?: string
  ) => Promise<void>;
}

// --- STORE ACTUALIZADO ---
export const useReportesDashboardStore = create<ReportesDashboardState>((set) => ({
  reporteVentas: null,
  reporteVentasComparacion: null,
  reporteInventario: null,
  reportePedidos: null,
  loading: { ventas: false, inventario: false, pedidos: false },
  error: { ventas: null, inventario: null, pedidos: null },

  generarReporteVentas: async (fechaInicio, fechaFin, usuarioCajeroId, limit, offset, isComparison = false) => {
    set((state) => ({ loading: { ...state.loading, ventas: true }, error: { ...state.error, ventas: null } }));
    const token = useAuthStore.getState().token;

    if (!token) {
      set((state) => ({ loading: { ...state.loading, ventas: false }, error: { ...state.error, ventas: "No se encontró el token de autenticación." } }));
      toast.error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      return;
    }

    const params = new URLSearchParams({ fechaInicio, fechaFin });
    if (usuarioCajeroId) {
      params.append("usuarioCajeroId", usuarioCajeroId);
    }
    if (limit !== undefined) {
      params.append("limit", limit.toString());
    }
    if (offset !== undefined) {
      params.append("offset", offset.toString());
    }

    const url = `${RUTA}/reportes/ventas?${params.toString()}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Error al generar el reporte de ventas.");
      }

      // Corregir la respuesta si no incluye ventasPorDia.
      // Esto asegura que la propiedad siempre exista y sea un array.
      const sanitizedData: ReporteVentasData = {
        ...responseData.data,
        ventasPorDia: responseData.data?.ventasPorDia || []
      };

      // Lógica para guardar los datos en el store
      if (isComparison) {
        set({
          reporteVentasComparacion: sanitizedData,
          error: { ventas: null, inventario: null, pedidos: null }
        });
      } else {
        set({
          reporteVentas: sanitizedData,
          error: { ventas: null, inventario: null, pedidos: null }
        });
      }
      toast.success("Reporte de ventas generado exitosamente.");
    } catch (error: any) {
      console.error("Error al generar reporte de ventas:", error);
      set((state) => ({
        error: { ...state.error, ventas: error.message || "Error al generar el reporte." },
        reporteVentas: null,
        reporteVentasComparacion: null,
      }));
      toast.error(error.message || "No se pudo generar el reporte de ventas.");
    } finally {
      set((state) => ({ loading: { ...state.loading, ventas: false } }));
    }
  },

  generarReporteInventario: async () => {
    set((state) => ({ loading: { ...state.loading, inventario: true }, error: { ...state.error, inventario: null } }));
    const token = useAuthStore.getState().token;

    if (!token) {
      set((state) => ({ loading: { ...state.loading, inventario: false }, error: { ...state.error, inventario: "No se encontró el token de autenticación." } }));
      toast.error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      return;
    }

    const url = `${RUTA}/reportes/inventario`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Error al generar el reporte de inventario.");
      }
      set({
        reporteInventario: responseData.data,
        error: { ventas: null, inventario: null, pedidos: null }
      });
      toast.success("Reporte de inventario generado exitosamente.");
    } catch (error: any) {
      console.error("Error al generar reporte de inventario:", error);
      set((state) => ({
        error: { ...state.error, inventario: error.message || "Error al generar el reporte de inventario." },
        reporteInventario: null,
      }));
      toast.error(error.message || "No se pudo generar el reporte de inventario.");
    } finally {
      set((state) => ({ loading: { ...state.loading, inventario: false } }));
    }
  },

  generarReportePedidos: async (estadoPedido, estadoCocinaItem) => {
    set((state) => ({ loading: { ...state.loading, pedidos: true }, error: { ...state.error, pedidos: null } }));
    const token = useAuthStore.getState().token;

    if (!token) {
      set((state) => ({ loading: { ...state.loading, pedidos: false }, error: { ...state.error, pedidos: "No se encontró el token de autenticación." } }));
      toast.error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      return;
    }

    const params = new URLSearchParams();
    if (estadoPedido) {
      params.append("estadoPedido", estadoPedido);
    }
    if (estadoCocinaItem) {
      params.append("estadoCocinaItem", estadoCocinaItem);
    }
    const url = `${RUTA}/reportes/pedidos-estado?${params.toString()}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Error al generar el reporte de pedidos.");
      }
      set({
        reportePedidos: responseData.data,
        error: { ventas: null, inventario: null, pedidos: null }
      });
      toast.success("Reporte de pedidos generado exitosamente.");
    } catch (error: any) {
      console.error("Error al generar reporte de pedidos:", error);
      set((state) => ({
        error: { ...state.error, pedidos: error.message || "Error al generar el reporte de pedidos." },
        reportePedidos: null,
      }));
      toast.error(error.message || "No se pudo generar el reporte de pedidos.");
    } finally {
      set((state) => ({ loading: { ...state.loading, pedidos: false } }));
    }
  },
}));




















// // src/stores/reportesDashboardStore.ts
// import { create } from "zustand";
// import { RUTA } from "@/helpers/rutas";
// import toast from "react-hot-toast";
// import { useAuthStore } from "@/stores/authStore";

// // --- INTERFACES ACTUALIZADAS ---
// export interface ResumenFinanciero {
//   totalVentas: number;
//   totalImpuestos: number;
//   totalDescuentos: number;
//   totalPropina: number;
//   totalNeto: number;
// }

// export interface DetalleFactura {
//   id: string;
//   fecha_hora_factura: string;
//   total_factura: number;
//   usuarioCajero: string;
//   tipo_factura: string;
//   pedidosAsociados: { pedidoId: string; montoAplicado: number }[];
// }

// export interface ReporteVentasData {
//   fechaReporte: string;
//   filtrosAplicados: {
//     establecimientoId: string;
//     fechaInicio: string;
//     fechaFin: string;
//     usuarioCajeroId?: string;
//     limit?: number;
//     offset?: number;
//   };
//   resumenFinanciero: ResumenFinanciero;
//   ventasPorMedioPago: { medio: string; total: number }[];
//   ventasPorCategoria: { categoria: string; total: number }[];
//   topProductosVendidos: { nombre: string; cantidad: number; total: number }[];
//   detalleFacturas: {
//     total: number;
//     limit: number;
//     offset: number;
//     data: DetalleFactura[];
//   };
// }

// export interface ResumenInventario {
//   totalIngredientes: number;
//   itemsBajoStock: number;
//   valorTotalInventario: number;
// }

// export interface DetalleInventario {
//   id: string;
//   nombre: string;
//   unidadMedida: string;
//   stockActual: number;
//   stockMinimo: number;
//   costoUnitario: number;
//   estado: string;
// }

// export interface ReporteInventarioData {
//   fechaReporte: string;
//   establecimientoId: string;
//   resumenInventario: ResumenInventario;
//   detalleInventario: DetalleInventario[];
// }

// export interface ResumenPedidos {
//   totalPedidos: number;
//   pedidosAbiertos: number;
//   pedidosEnPreparacion: number;
//   pedidosListos: number;
// }

// export interface PedidoItem {
//   id: string;
//   productoNombre: string;
//   cantidad: number;
//   estadoCocina: string;
//   tiempoEnEstadoCocina: number;
//   notas: string;
// }

// export interface DetallePedido {
//   id: string;
//   tipoPedido: string;
//   estadoPedido: string;
//   mesa: string;
//   clienteNombre: string;
//   usuarioCreador: string;
//   fechaHoraPedido: string;
//   totalEstimado: number;
//   items: PedidoItem[];
// }

// export interface ReportePedidosEstadoData {
//   fechaReporte: string;
//   establecimientoId: string;
//   resumenPedidos: ResumenPedidos;
//   detallePedidos: DetallePedido[];
// }

// interface ReportesDashboardState {
//   reporteVentas: ReporteVentasData | null;
//   reporteInventario: ReporteInventarioData | null;
//   reportePedidos: ReportePedidosEstadoData | null;
//   loading: {
//     ventas: boolean;
//     inventario: boolean;
//     pedidos: boolean;
//   };
//   error: {
//     ventas: string | null;
//     inventario: string | null;
//     pedidos: string | null;
//   };

//   generarReporteVentas: (
//     fechaInicio: string,
//     fechaFin: string,
//     usuarioCajeroId?: string,
//     limit?: number,
//     offset?: number
//   ) => Promise<void>;
//   generarReporteInventario: () => Promise<void>;
//   generarReportePedidos: (
//     estadoPedido?: string,
//     estadoCocinaItem?: string
//   ) => Promise<void>;
// }

// // --- STORE ACTUALIZADO ---
// export const useReportesDashboardStore = create<ReportesDashboardState>((set) => ({
//   reporteVentas: null,
//   reporteInventario: null,
//   reportePedidos: null,
//   loading: { ventas: false, inventario: false, pedidos: false },
//   error: { ventas: null, inventario: null, pedidos: null },

//   generarReporteVentas: async (fechaInicio, fechaFin, usuarioCajeroId, limit, offset) => {
//     set((state) => ({ loading: { ...state.loading, ventas: true }, error: { ...state.error, ventas: null } }));
//     const token = useAuthStore.getState().token;

//     if (!token) {
//       set((state) => ({ loading: { ...state.loading, ventas: false }, error: { ...state.error, ventas: "No se encontró el token de autenticación." } }));
//       toast.error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
//       return;
//     }

//     const params = new URLSearchParams({ fechaInicio, fechaFin });
//     if (usuarioCajeroId) {
//       params.append("usuarioCajeroId", usuarioCajeroId);
//     }
//     if (limit !== undefined) {
//       params.append("limit", limit.toString());
//     }
//     if (offset !== undefined) {
//       params.append("offset", offset.toString());
//     }
    
//     const url = `${RUTA}/reportes/ventas?${params.toString()}`;

//     try {
//       const res = await fetch(url, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const responseData = await res.json();
//       if (!res.ok) {
//         throw new Error(responseData.message || "Error al generar el reporte de ventas.");
//       }
//       set({
//         reporteVentas: responseData.data,
//         error: { ventas: null, inventario: null, pedidos: null }
//       });
//       toast.success("Reporte de ventas generado exitosamente.");
//     } catch (error: any) {
//       console.error("Error al generar reporte de ventas:", error);
//       set((state) => ({
//         error: { ...state.error, ventas: error.message || "Error al generar el reporte." },
//         reporteVentas: null,
//       }));
//       toast.error(error.message || "No se pudo generar el reporte de ventas.");
//     } finally {
//       set((state) => ({ loading: { ...state.loading, ventas: false } }));
//     }
//   },




















//   generarReporteInventario: async () => {
//     set((state) => ({ loading: { ...state.loading, inventario: true }, error: { ...state.error, inventario: null } }));
//     const token = useAuthStore.getState().token;

//     if (!token) {
//       set((state) => ({ loading: { ...state.loading, inventario: false }, error: { ...state.error, inventario: "No se encontró el token de autenticación." } }));
//       toast.error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
//       return;
//     }

//     const url = `${RUTA}/reportes/inventario`;

//     try {
//       const res = await fetch(url, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const responseData = await res.json();
//       if (!res.ok) {
//         throw new Error(responseData.message || "Error al generar el reporte de inventario.");
//       }
//       set({
//         reporteInventario: responseData.data,
//         error: { ventas: null, inventario: null, pedidos: null }
//       });
//       toast.success("Reporte de inventario generado exitosamente.");
//     } catch (error: any) {
//       console.error("Error al generar reporte de inventario:", error);
//       set((state) => ({
//         error: { ...state.error, inventario: error.message || "Error al generar el reporte de inventario." },
//         reporteInventario: null,
//       }));
//       toast.error(error.message || "No se pudo generar el reporte de inventario.");
//     } finally {
//       set((state) => ({ loading: { ...state.loading, inventario: false } }));
//     }
//   },

//   generarReportePedidos: async (estadoPedido, estadoCocinaItem) => {
//     set((state) => ({ loading: { ...state.loading, pedidos: true }, error: { ...state.error, pedidos: null } }));
//     const token = useAuthStore.getState().token;

//     if (!token) {
//       set((state) => ({ loading: { ...state.loading, pedidos: false }, error: { ...state.error, pedidos: "No se encontró el token de autenticación." } }));
//       toast.error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
//       return;
//     }

//     const params = new URLSearchParams();
//     if (estadoPedido) {
//       params.append("estadoPedido", estadoPedido);
//     }
//     if (estadoCocinaItem) {
//       params.append("estadoCocinaItem", estadoCocinaItem);
//     }
//     const url = `${RUTA}/reportes/pedidos-estado?${params.toString()}`;

//     try {
//       const res = await fetch(url, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const responseData = await res.json();
//       if (!res.ok) {
//         throw new Error(responseData.message || "Error al generar el reporte de pedidos.");
//       }
//       set({
//         reportePedidos: responseData.data,
//         error: { ventas: null, inventario: null, pedidos: null }
//       });
//       toast.success("Reporte de pedidos generado exitosamente.");
//     } catch (error: any) {
//       console.error("Error al generar reporte de pedidos:", error);
//       set((state) => ({
//         error: { ...state.error, pedidos: error.message || "Error al generar el reporte de pedidos." },
//         reportePedidos: null,
//       }));
//       toast.error(error.message || "No se pudo generar el reporte de pedidos.");
//     } finally {
//       set((state) => ({ loading: { ...state.loading, pedidos: false } }));
//     }
//   },
// }));


















// import { create } from "zustand";
// import { RUTA } from "@/helpers/rutas";
// import toast from "react-hot-toast";
// import { useAuthStore } from "@/stores/authStore";

// export interface ResumenFinanciero {
//   totalVentas: number;
//   totalImpuestos: number;
//   totalDescuentos: number;
//   totalPropina: number;
//   totalNeto: number;
// }

// export interface DetalleFactura {
//   id: string;
//   fecha_hora_factura: string;
//   total_factura: number;
//   usuarioCajero: string;
//   tipo_factura: string;
//   pedidosAsociados: { pedidoId: string; montoAplicado: number }[];
// }

// export interface ReporteVentasData {
//   fechaReporte: string;
//   filtrosAplicados: {
//     establecimientoId: string;
//     fechaInicio: string;
//     fechaFin: string;
//     usuarioCajeroId?: string;
//   };
//   resumenFinanciero: ResumenFinanciero;
//   ventasPorMedioPago: { metodo: string; total: number }[];
//   ventasPorCategoria: { categoria: string; total: number }[];
//   topProductosVendidos: { producto: string; cantidad: number }[];
//   detalleFacturas: DetalleFactura[];
// }

// export interface ResumenInventario {
//   totalIngredientes: number;
//   itemsBajoStock: number;
//   valorTotalInventario: number;
// }

// export interface DetalleInventario {
//   id: string;
//   nombre: string;
//   unidadMedida: string;
//   stockActual: number;
//   stockMinimo: number;
//   costoUnitario: number;
//   estado: string;
// }

// export interface ReporteInventarioData {
//   fechaReporte: string;
//   establecimientoId: string;
//   resumenInventario: ResumenInventario;
//   detalleInventario: DetalleInventario[];
// }

// export interface ResumenPedidos {
//   totalPedidos: number;
//   pedidosAbiertos: number;
//   pedidosEnPreparacion: number;
//   pedidosListos: number;
// }

// export interface PedidoItem {
//   id: string;
//   productoNombre: string;
//   cantidad: number;
//   estadoCocina: string;
//   tiempoEnEstadoCocina: number;
//   notas: string;
// }

// export interface DetallePedido {
//   id: string;
//   tipoPedido: string;
//   estadoPedido: string;
//   mesa: string;
//   clienteNombre: string;
//   usuarioCreador: string;
//   fechaHoraPedido: string;
//   totalEstimado: number;
//   items: PedidoItem[];
// }

// export interface ReportePedidosEstadoData {
//   fechaReporte: string;
//   establecimientoId: string;
//   resumenPedidos: ResumenPedidos;
//   detallePedidos: DetallePedido[];
// }

// interface ReportesDashboardState {
//   reporteVentas: ReporteVentasData | null;
//   reporteInventario: ReporteInventarioData | null;
//   reportePedidos: ReportePedidosEstadoData | null;
//   loading: {
//     ventas: boolean;
//     inventario: boolean;
//     pedidos: boolean;
//   };
//   error: {
//     ventas: string | null;
//     inventario: string | null;
//     pedidos: string | null;
//   };

//   generarReporteVentas: (
//     fechaInicio: string,
//     fechaFin: string,
//     usuarioCajeroId?: string
//   ) => Promise<void>;
//   generarReporteInventario: () => Promise<void>;
//   generarReportePedidos: (
//     estadoPedido?: string,
//     estadoCocinaItem?: string
//   ) => Promise<void>;
// }

// export const useReportesDashboardStore = create<ReportesDashboardState>((set) => ({
//   reporteVentas: null,
//   reporteInventario: null,
//   reportePedidos: null,
//   loading: { ventas: false, inventario: false, pedidos: false },
//   error: { ventas: null, inventario: null, pedidos: null },

//   generarReporteVentas: async (fechaInicio, fechaFin, usuarioCajeroId) => {
//     set((state) => ({ loading: { ...state.loading, ventas: true }, error: { ...state.error, ventas: null } }));
//     const token = useAuthStore.getState().token;

//     if (!token) {
//       set((state) => ({ loading: { ...state.loading, ventas: false }, error: { ...state.error, ventas: "No se encontró el token de autenticación." } }));
//       toast.error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
//       return;
//     }

//     const params = new URLSearchParams({ fechaInicio, fechaFin });
//     if (usuarioCajeroId) {
//       params.append("usuarioCajeroId", usuarioCajeroId);
//     }
//     const url = `${RUTA}/reportes/ventas?${params.toString()}`;

//     try {
//       const res = await fetch(url, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const responseData = await res.json();
//       if (!res.ok) {
//         throw new Error(responseData.message || "Error al generar el reporte de ventas.");
//       }
//       set({
//         reporteVentas: responseData.data,
//         error: { ventas: null, inventario: null, pedidos: null }
//       });
//       toast.success("Reporte de ventas generado exitosamente.");
//     } catch (error: any) {
//       console.error("Error al generar reporte de ventas:", error);
//       set((state) => ({
//         error: { ...state.error, ventas: error.message || "Error al generar el reporte." },
//         reporteVentas: null,
//       }));
//       toast.error(error.message || "No se pudo generar el reporte de ventas.");
//     } finally {
//       set((state) => ({ loading: { ...state.loading, ventas: false } }));
//     }
//   },

//   generarReporteInventario: async () => {
//     set((state) => ({ loading: { ...state.loading, inventario: true }, error: { ...state.error, inventario: null } }));
//     const token = useAuthStore.getState().token;

//     if (!token) {
//       set((state) => ({ loading: { ...state.loading, inventario: false }, error: { ...state.error, inventario: "No se encontró el token de autenticación." } }));
//       toast.error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
//       return;
//     }

//     const url = `${RUTA}/reportes/inventario`;

//     try {
//       const res = await fetch(url, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const responseData = await res.json();
//       if (!res.ok) {
//         throw new Error(responseData.message || "Error al generar el reporte de inventario.");
//       }
//       set({
//         reporteInventario: responseData.data,
//         error: { ventas: null, inventario: null, pedidos: null }
//       });
//       toast.success("Reporte de inventario generado exitosamente.");
//     } catch (error: any) {
//       console.error("Error al generar reporte de inventario:", error);
//       set((state) => ({
//         error: { ...state.error, inventario: error.message || "Error al generar el reporte de inventario." },
//         reporteInventario: null,
//       }));
//       toast.error(error.message || "No se pudo generar el reporte de inventario.");
//     } finally {
//       set((state) => ({ loading: { ...state.loading, inventario: false } }));
//     }
//   },

//   generarReportePedidos: async (estadoPedido, estadoCocinaItem) => {
//     set((state) => ({ loading: { ...state.loading, pedidos: true }, error: { ...state.error, pedidos: null } }));
//     const token = useAuthStore.getState().token;

//     if (!token) {
//       set((state) => ({ loading: { ...state.loading, pedidos: false }, error: { ...state.error, pedidos: "No se encontró el token de autenticación." } }));
//       toast.error("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
//       return;
//     }

//     const params = new URLSearchParams();
//     if (estadoPedido) {
//       params.append("estadoPedido", estadoPedido);
//     }
//     if (estadoCocinaItem) {
//       params.append("estadoCocinaItem", estadoCocinaItem);
//     }
//     const url = `${RUTA}/reportes/pedidos-estado?${params.toString()}`;

//     try {
//       const res = await fetch(url, {
//         method: "GET",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`,
//         },
//       });
//       const responseData = await res.json();
//       if (!res.ok) {
//         throw new Error(responseData.message || "Error al generar el reporte de pedidos.");
//       }
//       set({
//         reportePedidos: responseData.data,
//         error: { ventas: null, inventario: null, pedidos: null }
//       });
//       toast.success("Reporte de pedidos generado exitosamente.");
//     } catch (error: any) {
//       console.error("Error al generar reporte de pedidos:", error);
//       set((state) => ({
//         error: { ...state.error, pedidos: error.message || "Error al generar el reporte de pedidos." },
//         reportePedidos: null,
//       }));
//       toast.error(error.message || "No se pudo generar el reporte de pedidos.");
//     } finally {
//       set((state) => ({ loading: { ...state.loading, pedidos: false } }));
//     }
//   },
// }));
