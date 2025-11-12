"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, CheckCircle, Clock, UtensilsCrossed } from "lucide-react";
import { useMesasStore } from "@/stores/mesasStore";
import { usePedidosStore } from "@/stores/pedidosStore";
import { useProductosStore } from "@/stores/productosStore";
import { EstadoPedido } from "@/types/models";
import Spinner from "@/components/feedback/Spinner";
import { FONDO } from "@/styles/colors";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";
import { conectarSocket } from "@/helpers/socket";
import BotonRestaurante from "@/components/ui/Boton";

export interface CrearPedidoItem {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  nota?: string;
  categoria?: string;
  tipo?: "simple" | "configurable";
  opcionesSeleccionadas?: {
    nombreOpcion: string;
    valor: string;
    precio: number;
  }[];
}

export interface IFormPedidos {
  id?: string;
  origen: string;
  telefono: string;
  nombre: string;
  direccion: string;
  idOrdenExterna: string;
  mesa: string;
  notas?: string;
}

export default function MeseroDashboard() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [currentView] = useState("dashboard");
  const { fetchMesas, mesas, loading: loadingMesas } = useMesasStore();
  const {
    traerPedidos,
    pedidos,
    loading: loadingPedidos,
    traerPedidoPorId,
    imprimirComanda,
    loadingComanda,
    actualizarEstadoPedido,
  } = usePedidosStore();
  const [searchMesaTerm, setSearchMesaTerm] = useState("");
  const { loading: loadingProductos } = useProductosStore();
  const [pedidoItems, setPedidoItems] = useState<CrearPedidoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [infoPedido, setInfoPedido] = useState<IFormPedidos>({
    origen: "MESA",
    telefono: "",
    nombre: "",
    direccion: "",
    idOrdenExterna: "",
    mesa: "",
  });
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const [currentPedidoId, setCurrentPedidoId] = useState<string | null>(null);

  useEffect(() => {
    const calculateTotal = () => {
      const newTotal = pedidoItems.reduce(
        (acc, item) => acc + item.precio * item.cantidad,
        0
      );
      setTotal(newTotal);
    };
    calculateTotal();
  }, [pedidoItems]);

  useEffect(() => {
    if (!token || !user?.establecimiento_id) {
      router.push("/login");
      return;
    }
    fetchMesas();
    traerPedidos();
    const socketPromise = conectarSocket(user.establecimiento_id);
    socketPromise
      .then((s) => {
        s.on("pedidoStatusUpdated", () => {
          traerPedidos();
        });
        s.on("pedidoCreated", () => {
          traerPedidos();
        });
        s.on("mesaStatusUpdated", () => {
          fetchMesas();
        });
        return () => {
          s.off("pedidoStatusUpdated");
          s.off("pedidoCreated");
          s.off("mesaStatusUpdated");
        };
      })
      .catch((err) => {
        console.error("[WS Mesero] Fallo al conectar el socket:", err);
        toast.error("No se pudo establecer la conexión en tiempo real.");
      });
  }, [token, user, router, fetchMesas, traerPedidos]);

  useEffect(() => {
    const fetchPedidoData = async () => {
      if (currentView === "editar" && currentPedidoId) {
        setLoadingInitialData(true);
        const pedidoCompleto = await traerPedidoPorId?.(currentPedidoId);
        if (pedidoCompleto) {
          setInfoPedido({
            origen: pedidoCompleto.tipo_pedido,
            telefono: pedidoCompleto.cliente_telefono || "",
            nombre: pedidoCompleto.cliente_nombre || "",
            direccion: pedidoCompleto.cliente_direccion || "",
            idOrdenExterna: (pedidoCompleto as any).idOrdenExterna || "",
            mesa: pedidoCompleto.mesa_id || "",
          });
          const items = pedidoCompleto.pedidoItems.map((item: any) => {
            const nombreProducto =
              item.producto?.nombre || "Producto Desconocido";
            const precioProducto = Number(item.producto?.precio) || 0;
            const tipo: "simple" | "configurable" =
              item.producto_configurable_id ? "configurable" : "simple";

            return {
              id: item.producto_id,
              nombre: nombreProducto,
              precio: precioProducto,
              cantidad: item.cantidad,
              nota: item.notas_item || "",
              tipo: tipo,
              opcionesSeleccionadas: item.configuracion_json
                ? JSON.parse(item.configuracion_json)
                : [],
            };
          });
          setPedidoItems(items);
        } else {
          toast.error(
            "No se pudo cargar el pedido. Por favor, intente de nuevo."
          );
        }
        setLoadingInitialData(false);
      }
    };
    fetchPedidoData();
  }, [currentView, currentPedidoId, traerPedidoPorId]);

  const mesasConEstado = useMemo(() => {
    const pedidosPorMesa = new Map(pedidos.map((p) => [p.mesa_id, p]));
    return mesas.map((mesa) => ({
      ...mesa,
      estado: pedidosPorMesa.has(mesa.id) ? "ocupada" : "libre",
      pedido: pedidosPorMesa.get(mesa.id) || null,
    }));
  }, [mesas, pedidos]);

  if (
    loadingMesas ||
    loadingPedidos ||
    loadingProductos ||
    loadingInitialData
  ) {
    return <Spinner />;
  }
  // Filtrar solo los pedidos ENTREGADOS
  const pedidosSinEntregados = pedidos.filter(
    (pedido) => pedido.estado !== "ENTREGADO"
  );

  return (
    <div
      className="min-h-screen p-6 font-lato"
      style={{ backgroundColor: FONDO }}
    >
      <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        Panel del Mesero
      </h1>
      <section className="bg-white rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Mesas del Restaurante
        </h2>
        <div className="flex items-center gap-2 w-full mb-10">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Buscar mesa por nombre..."
              value={searchMesaTerm}
              onChange={(e) => setSearchMesaTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200"
            />
          </div>

          <BotonRestaurante
            label="Crear pedido"
            onClick={() => router.push("/cajero/crear_pedido")}
            className="ml-auto"
          />
        </div>

        {mesasConEstado.length === 0 ? (
          <div className="text-center text-gray-500 p-4">
            <p>No hay mesas registradas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {mesasConEstado
              .filter((mesa) =>
                mesa.numero.toLowerCase().includes(searchMesaTerm.toLowerCase())
              )
              .map((mesa) => {
                const isOcupada = mesa.estado === "ocupada";
                const pedidoDeMesa = mesa.pedido;
                const getStatusInfo = (status: EstadoPedido) => {
                  switch (status) {
                    case EstadoPedido.ABIERTO:
                      return {
                        text: "Pedido Abierto",
                        color: "bg-orange-500",
                        icon: <Clock size={20} />,
                      };
                    case EstadoPedido.EN_PREPARACION:
                      return {
                        text: "En Preparación",
                        color: "bg-yellow-500",
                        icon: <UtensilsCrossed size={20} />,
                      };
                    case EstadoPedido.LISTO_PARA_ENTREGAR:
                      return {
                        text: "Listo para Entregar",
                        color: "bg-blue-500",
                        icon: <CheckCircle size={20} />,
                      };
                    default:
                      return {
                        text: "Ocupada",
                        color: "bg-gray-500",
                        icon: null,
                      };
                  }
                };
                const statusInfo = isOcupada
                  ? getStatusInfo(pedidoDeMesa?.estado as EstadoPedido)
                  : { text: "Libre", color: "bg-gray-500", icon: null };
                const colorClass = isOcupada
                  ? statusInfo.color
                  : "bg-green-500";
                const hoverClass = isOcupada
                  ? "hover:scale-105"
                  : "hover:bg-green-600";

                return (
                  <div
                    key={mesa.id}
                    className={`relative flex flex-col items-center justify-center p-6 min-w-[220px] min-h-[180px] rounded-xl shadow-md hover:shadow-xl transition-transform transform hover:scale-105 ${colorClass} ${hoverClass} text-white border border-white/20`}
                    onClick={() => {
                      if (isOcupada) {
                        router.push(`/cajero/editar/${pedidoDeMesa!.id}`);
                      } else {
                        router.push(`/cajero/crear_pedido?mesa=${mesa.id}`);
                      }
                    }}
                  >
                    <img
                      src="/mesa.svg"
                      alt="Mesa"
                      width={60}
                      height={60}
                      className="invert"
                    />
                    <span className="mt-2 text-lg font-semibold">
                      {mesa.numero}
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-sm font-medium">
                      {statusInfo.icon}
                      <span>{statusInfo.text}</span>
                      {/* Botón "Marcar como entregado" */}
                    </div>
                    {isOcupada &&
                      pedidoDeMesa?.estado ===
                        EstadoPedido.LISTO_PARA_ENTREGAR && (
                        <button
                          className="mt-4 px-6 py-3 flex items-center gap-2 rounded-2xl font-semibold text-base shadow-md  hover:bg-blue-600 text-white transition-all duration-300 ease-in-out
               hover:shadow-lg  focus:ring-2 focus:ring-white active:scale-95 border-blue-600 border-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            actualizarEstadoPedido(
                              pedidoDeMesa.id,
                              "ENTREGADO"
                            );
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Marcar como entregado
                        </button>
                      )}

                    {isOcupada && pedidoDeMesa && (
                      <div
                        className="absolute top-2 right-2 p-2 rounded-full bg-white/30 text-white hover:bg-white/50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          imprimirComanda(pedidoDeMesa.id);
                        }}
                        title="Imprimir comanda"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}

        {/* Pedidos PARA_LLEVAR */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Pedidos Para Llevar
          </h2>

          {pedidos.filter((p) => p.tipo_pedido === "PARA_LLEVAR").length ===
          0 ? (
            <div className="text-gray-500 text-center py-6">
              No hay pedidos para llevar.
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-[repeat(auto-fit,_minmax(260px,_1fr))] p-3">
              {pedidos
                .filter((pedido) => pedido.tipo_pedido === "PARA_LLEVAR")
                .map((pedido) => (
                  <div
                    key={pedido.id}
                    className={`relative flex flex-col justify-between h-[300px] max-w-[350px] p-5 rounded-[20px] bg-white border-2 transition-transform duration-200 cursor-pointer shadow ${
                      pedido.estado === "LISTO_PARA_ENTREGAR"
                        ? "border-green-500 shadow-[0_8px_20px_rgba(34,197,94,0.2)]"
                        : pedido.estado === "FINALIZADO"
                        ? "border-orange-500 shadow-[0_4px_15px_rgba(0,0,0,0.08)]"
                        : "border-gray-300 shadow-[0_4px_15px_rgba(0,0,0,0.08)]"
                    } hover:translate-y-[-4px] hover:shadow-[0_12px_30px_rgba(0,0,0,0.12)]`}
                  >
                    {/* Botón imprimir */}
                    <div
                      className="absolute top-2 right-2 p-2 rounded-full bg-white text-gray-400 hover:bg-gray-400 transition-colors hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        imprimirComanda(pedido.id);
                      }}
                      title="Imprimir comanda"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
                      </svg>
                    </div>

                    {/* Título de mesa / pedido */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {"ID: "}
                      {pedido.id}
                    </h3>

                    {/* Estado */}
                    <div
                      className={`inline-block px-3 py-1.5 rounded-[25px] mb-3 ${
                        pedido.estado === "LISTO_PARA_ENTREGAR"
                          ? "bg-green-500"
                          : "bg-gray-100"
                      }`}
                    >
                      <span
                        className={`text-xs font-medium ${
                          pedido.estado === "LISTO_PARA_ENTREGAR"
                            ? "text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {pedido.estado}
                      </span>
                    </div>

                    {/* Lista de items */}
                    <div className="relative max-h-[200px] overflow-hidden">
                      {pedido.pedidoItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-start flex-wrap text-sm border-b border-gray-200  text-gray-700 pb-1 mb-1"
                        >
                          <span>{item.nombre}</span>
                          <span className="font-semibold">
                            x{item.cantidad}
                          </span>
                          {item.notas && (
                            <em className="text-xs text-gray-500 w-full mt-1">
                              Nota: {item.notas}
                            </em>
                          )}
                        </div>
                      ))}

                      {/* Fade gradient si hay más de 3 items */}
                      {pedido.pedidoItems.length > 3 && (
                        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent" />
                      )}
                    </div>

                    {/* Botones */}
                    <div className="flex flex-wrap  items-center gap-2 mt-3 justify-center">
                      {pedido.estado === "LISTO_PARA_ENTREGAR" && (
                        <button
                          className="px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 text-white text-sm font-semibold shadow-lg hover:from-orange-500 hover:to-orange-600 active:scale-95 transition-all duration-150"
                          onClick={(e) => {
                            e.stopPropagation();
                            actualizarEstadoPedido(pedido.id, "ENTREGADO");
                          }}
                        >
                          Marcar como entregado
                        </button>
                      )}
                      <button
                        className="px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-sm font-medium hover:bg-orange-200 transition-colors w-40"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/cajero/editar/${pedido.id}`);
                        }}
                      >
                        Editar
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      </section>
      {loadingComanda && <Spinner />}
    </div>
  );
}
