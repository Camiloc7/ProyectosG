"use client";
import { FONDO, FONDO_COMPONENTES, ORANGE } from "../../styles/colors";
import { useCallback, useEffect, useState } from "react";
import FormCancelacion from "../../features/listaDePedidos/FormCancelacion";
import { useConfirm } from "../../components/feedback/confirmModal";
import { CircleDollarSign, Flag, RefreshCcw } from "lucide-react";
import Spinner from "@/components/feedback/Spinner";
import { conectarSocket } from "../../helpers/socket";
import { Lock } from "lucide-react";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import FormCierreCaja, {
  IFormCierreCaja,
} from "../../features/listaDePedidos/FormCierreDeCaja";
import FormAperturaDeCaja from "../../features/listaDePedidos/FormAperturaDeCaja";
import { usePedidosStore } from "@/stores/pedidosStore";
import { useAuthStore } from "@/stores/authStore";
import BotonRestaurante from "@/components/ui/Boton";
import {
  DenominacionData,
  IDataParaAperturaDeCaja,
  IDataParaCierreDeCaja,
  useCajaStore,
} from "@/stores/cierreDeCajaStore";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { IItemsPedidos, IPedidos } from "@/types/models";
import FormExtraMoney from "@/features/listaDePedidos/FormIngresosEgresosExtra";
const LS_KEY_IMPRESION = "pedidosImpresosStatus";

export default function Pedidos() {
  const router = useRouter();
  const confirm = useConfirm();
  const {
    cajaActiva,
    generarTicketX,
    traerCajaActiva,
    aperturaDeCaja,
    loading: loadingCaja,
  } = useCajaStore();
  const {
    traerPedidos,
    pedidos,
    loading,
    pedidosPendientes,
    actualizarEstadoPedido,
  } = usePedidosStore();

  const { imprimirComanda, loading: loadingComanda } = usePedidosStore();
  const [cancelarOpen, setCancelarOpen] = useState<boolean>(false);
  const [openCaja, setOpenCaja] = useState<boolean>(false);
  const [cierreDeCajaAbierto, setCierreDeCajaAbierto] =
    useState<boolean>(false);
  const [idCancelar, setIdCancelar] = useState<string>("");
  const [gastosEIngresosOpen, setGastosEIngresosOpen] =
    useState<boolean>(false);
  const [pedidosImpresos, setPedidosImpresos] = useState<{
    [key: string]: boolean;
  }>({});
  const [pedidosGuardados, setPedidosGuardados] = useState<any[]>([]);
  const { user, isAuthenticated, logout } = useAuthStore();
  const formatearPedidos = useCallback(
    (nuevosPedidos: IPedidos[]): IPedidos[] => {
      return nuevosPedidos.filter(
        (pedido: IPedidos) =>
          pedido.estado !== "PAGADO" && pedido.estado !== "CANCELADO"
      );
    },
    []
  );
  const guardarEstadoImpresion = useCallback(
    (id: string, estaImpreso: boolean) => {
      setPedidosImpresos((prev) => {
        const nuevoEstado = { ...prev, [id]: estaImpreso };
        try {
          localStorage.setItem(LS_KEY_IMPRESION, JSON.stringify(nuevoEstado));
        } catch (error) {
          console.error("Error al guardar el estado de impresión:", error);
        }
        return nuevoEstado;
      });
    },
    []
  );

  const restablecerImpresion = useCallback(
    (pedidoId: string) => {
      guardarEstadoImpresion(pedidoId, false);
    },
    [guardarEstadoImpresion]
  );
  const handleImprimirComanda = async (pedidoId: string) => {
    try {
      await imprimirComanda(pedidoId);
      guardarEstadoImpresion(pedidoId, true);
    } catch (error) {
      console.error("Error al imprimir comanda:", error);
      toast.error("Error al intentar imprimir la comanda.");
    }
  };
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY_IMPRESION);
      if (stored) {
        setPedidosImpresos(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error al cargar el estado de impresión:", error);
    }

    traerCajaActiva();
    handleFetch();
  }, [formatearPedidos]);

  useEffect(() => {
    async function init() {
      try {
        if (!user?.establecimiento_id) return;
        const socket = await conectarSocket(user.establecimiento_id);
        socket.on("pedidoCreated", ({ pedidoId }) => {
          console.warn("[WS] Nuevo pedido recibido:", pedidoId);
          usePedidosStore.getState().traerPedidos();
          guardarEstadoImpresion(pedidoId, false);
        });
        socket.on("pedidos_actualizados", (nuevosPedidos: IPedidos[]) => {
          const pedidosFormateados = formatearPedidos(nuevosPedidos);
          usePedidosStore.setState({ pedidos: pedidosFormateados });
        });
      } catch (error) {
        console.error("Error al inicializar la aplicación:", error);
      }
    }
    init();
  }, [user, guardarEstadoImpresion]);

  useEffect(() => {
    const checkPedidosEnProceso = async () => {
      if (pedidosPendientes.length > 0) {
        const confirmado = await confirm({
          title: "Hay pedidos en proceso de pago",
          description: "¿Deseas continuar con el pago del pedido pendiente?",
          confirmText: "Sí, continuar",
          cancelText: "No, guardar como pendiente",
        });
        if (confirmado) {
          router.push(
            "/cajero/tarjetas?pedidoId=" + pedidosPendientes[0].pedido_id
          );
        } else {
          setPedidosGuardados(pedidosPendientes);
        }
      }
    };
    checkPedidosEnProceso();
  }, [traerPedidos, pedidosPendientes, router, confirm]);

  const handleEliminarPedidoPendiente = async (pedidoId: string) => {
    const confirmado = await confirm({
      title: "¿Cancelar proceso de pago?",
      description:
        "¿Estás seguro de que quieres cancelar el proceso de pago de este pedido? Podria no cuadrar los pagos y se notificara al administrador",
      confirmText: "Sí, cancelar",
      cancelText: "No",
    });
    if (!confirmado) return;
    const all = JSON.parse(localStorage.getItem("pedidosPendientes") || "[]");
    const entryIndex = all.findIndex(
      (value: any) => value.pedido_id === pedidoId
    );
    if (entryIndex !== -1) {
      all.splice(entryIndex, 1);
      localStorage.setItem("pedidosPendientes", JSON.stringify(all));
      setPedidosGuardados((prev) =>
        prev.filter((pedido) => pedido.pedido_id !== pedidoId)
      );
    }
  };
  const handleInicioDeCaja = async (denominaciones: DenominacionData) => {
    try {
      if (!user?.establecimiento_id) return;
      const formattedData: IDataParaAperturaDeCaja = {
        denominaciones_apertura: denominaciones,
      };
      const response = await aperturaDeCaja(formattedData);
      if (response === false) {
        return;
      }
      setOpenCaja(false);
      window.location.reload();
    } catch (error) {
      console.error("Error al iniciar la caja:", error);
    }
  };

  const handleBotonCajaClick = () => {
    if (cajaActiva) {
      setCierreDeCajaAbierto(true);
    } else {
      setOpenCaja(true);
    }
  };

  const handleCancelPedido = async (razon: string) => {
    try {
      await usePedidosStore
        .getState()
        .cambiarEstadoPedido(idCancelar, "CANCELADO");
      setCancelarOpen(false);
      setIdCancelar("");
    } catch (error) {
      console.error("Error al cancelar el pedido:", error);
      toast.error("No se pudo cancelar el pedido. Inténtalo de nuevo.");
    }
  };
  const handleLogout = async () => {
    const confirmado = await confirm({
      title: "¿Deseas cerrar sesión?",
      description: "Deberás volver a ingresar tus credenciales",
      confirmText: "Cerrar sesión",
      cancelText: "Cancelar",
    });
    if (confirmado) {
      await logout();
      router.push("/");
    }
  };
  const handleFetch = () => {
    traerPedidos();
  };
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: FONDO,
        fontFamily: "Lato, sans-serif",
        padding: 32,
        boxSizing: "border-box",
      }}
    >
      <div style={{ margin: "0 auto" }}>
        <header className="relative flex flex-wrap items-center justify-between bg-white p-3 md:p-6 rounded-xl shadow-md mb-6 gap-3">
          <h2 className="text-lg md:text-2xl font-semibold text-gray-800">
            Lista de Pedidos
          </h2>
          <div
            className={`hidden [@media(min-width:1115px)]:block absolute left-1/2 transform -translate-x-1/2 text-xl font-bold uppercase ${
              cajaActiva ? "text-green-500" : "text-red-500"
            }`}
          >
            {cajaActiva ? "Caja Abierta" : "Caja Cerrada"}
          </div>
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-4 flex-1">
            {loading ? (
              <span className="text-gray-500 font-medium">Cargando...</span>
            ) : (
              <>
                <span
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Refrescar"
                  className="text-gray-500 hover:text-green-500 cursor-pointer transition-colors"
                >
                  <RefreshCcw
                    onClick={handleFetch}
                    size={20}
                    className="md:w-6 md:h-6"
                  />
                </span>
                <span
                  data-tooltip-id="tooltip"
                  data-tooltip-content={
                    cajaActiva ? "Cerrar caja" : "Abrir caja"
                  }
                  className="text-gray-500 hover:text-green-500 cursor-pointer transition-colors"
                >
                  <Lock
                    onClick={handleBotonCajaClick}
                    size={20}
                    className={`cursor-pointer md:w-6 md:h-6 ${
                      cajaActiva ? "text-green-500" : "text-red-500"
                    }`}
                  />
                </span>
                <span
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Gastos e Ingresos Extra"
                  className="text-gray-500 hover:text-green-500 cursor-pointer transition-colors"
                >
                  <CircleDollarSign
                    onClick={() => setGastosEIngresosOpen(true)}
                    size={20}
                    className="md:w-6 md:h-6"
                  />
                </span>
                <span
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Reporte de caja"
                  className="text-gray-500 hover:text-green-500 cursor-pointer transition-colors"
                >
                  <Flag
                    onClick={() => generarTicketX()}
                    size={20}
                    className="md:w-6 md:h-6"
                  />
                </span>
                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                  <BotonRestaurante
                    label="Agregar Pedido"
                    onClick={() => {
                      if (cajaActiva) {
                        router.push("/cajero/crear_pedido");
                      } else {
                        toast.error(
                          "Debes abrir la caja antes de pagar un pedido."
                        );
                        setOpenCaja(true);
                      }
                    }}
                  />
                </div>

                <Tooltip id="tooltip" place="bottom" />
              </>
            )}
          </div>
        </header>

        {["MESA", "PARA_LLEVAR", "DOMICILIO"].map((tipo) => {
          const pedidosFiltrados = pedidos.filter(
            (p: IPedidos) => p.tipo_pedido === tipo
          );
          if (pedidosFiltrados.length === 0) {
            const titulo =
              tipo === "MESA"
                ? "🪑 Pedidos en Mesa"
                : tipo === "PARA_LLEVAR"
                ? "🥡 Pedidos Para Llevar"
                : "🛵 Pedidos a Domicilio";
            const mensaje =
              tipo === "MESA"
                ? "No hay pedidos en mesa por ahora."
                : tipo === "PARA_LLEVAR"
                ? "No hay pedidos para llevar todavía."
                : "No hay pedidos a domicilio por el momento.";
            return (
              <div key={tipo} style={{ marginBottom: 48 }}>
                <h2
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: "#111827",
                    marginBottom: 16,
                    borderBottom: "2px solid #E5E7EB",
                    paddingBottom: 8,
                  }}
                >
                  {titulo}
                </h2>
                <div
                  style={{
                    backgroundColor: FONDO_COMPONENTES,
                    borderRadius: 24,
                    padding: 24,
                    textAlign: "center",
                    color: "#000000",
                    fontSize: 16,
                    maxWidth: 800,
                    margin: "0 auto",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill={ORANGE}
                      viewBox="0 0 24 24"
                      width="22"
                      height="22"
                      style={{ marginRight: 8 }}
                    >
                      <path d="M6 2L3 6v15a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6l-3-4H6zM5 6h14v14H5V6zm7 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                    </svg>
                    <span style={{ fontWeight: 600 }}>{mensaje}</span>
                  </div>
                </div>
              </div>
            );
          }
          const titulo =
            tipo === "MESA"
              ? "🪑 Pedidos en Mesa"
              : tipo === "PARA_LLEVAR"
              ? "🥡 Pedidos Para Llevar"
              : "🛵 Pedidos a Domicilio";
          return (
            <div key={tipo} style={{ marginBottom: 48 }}>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: "#111827",
                  marginBottom: 16,
                  borderBottom: "2px solid #E5E7EB",
                  paddingBottom: 8,
                }}
              >
                {titulo}
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: 24,
                }}
              >
                {pedidosFiltrados.map((pedido: IPedidos) => {
                  const estaImpreso = pedidosImpresos[pedido.id] === true;
                  const mensajeImpresion = estaImpreso
                    ? "Orden impresa"
                    : "Orden por imprimir";
                  const colorMensaje = estaImpreso ? "#10B981" : "#F59E0B";

                  return (
                    <div
                      key={pedido.id}
                      style={{
                        backgroundColor: FONDO_COMPONENTES,
                        border: `2px solid ${
                          pedido.estado === "FINALIZADO" ? ORANGE : "#D1D5DB"
                        }`,
                        boxShadow: "0 10px 40px rgba(0, 0, 0, 0.1)",
                        borderRadius: 24,
                        padding: 24,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        maxHeight: 300,
                        minHeight: 300,
                        overflowY: "auto",
                        maxWidth: 350,

                        width: "100%",
                        color: "#000000",
                        position: "relative",
                      }}
                    >
                      {loadingComanda && <Spinner />}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          position: "absolute",
                          top: 24,
                          right: 24,
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: colorMensaje,
                            whiteSpace: "nowrap",
                            textTransform: "uppercase",
                          }}
                        >
                          {mensajeImpresion}
                        </span>
                        <button
                          onClick={() => handleImprimirComanda(pedido.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: 0,
                            color: estaImpreso ? "#10B981" : "#6B7280",
                            transition: "color 0.2s",
                          }}
                          onMouseOver={(e) =>
                            (e.currentTarget.style.color = ORANGE)
                          }
                          onMouseOut={(e) =>
                            (e.currentTarget.style.color = estaImpreso
                              ? "#10B981"
                              : "#6B7280")
                          }
                          aria-label="Imprimir comanda"
                          data-tooltip-id="tooltip"
                          data-tooltip-content={mensajeImpresion}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
                          </svg>
                        </button>
                      </div>

                      <div>
                        <h3
                          style={{
                            fontSize: 20,
                            fontWeight: 600,
                            color: "#333",
                            marginBottom: 12,
                          }}
                        >
                          {pedido.tipo_pedido === "MESA"
                            ? `${pedido.mesa_numero}`
                            : pedido.tipo_pedido === "PARA_LLEVAR"
                            ? "Para llevar"
                            : "Domicilio"}
                        </h3>
                        {pedido.notas && (
                          <p
                            style={{
                              marginBottom: 12,
                              fontSize: 14,
                              color: "#374151",
                            }}
                          >
                            <strong>Notas:</strong> {pedido.notas}
                          </p>
                        )}
                        {pedido.tipo_pedido === "DOMICILIO" && (
                          <div
                            style={{
                              marginBottom: 12,
                              fontSize: 14,
                              color: "#374151",
                            }}
                          >
                            <p>
                              <strong>Nombre:</strong> {pedido.cliente_nombre}
                            </p>
                            <p>
                              <strong>Celular:</strong>{" "}
                              {pedido.cliente_telefono}
                            </p>
                            <p>
                              <strong>Dirección:</strong>{" "}
                              {pedido.cliente_direccion}
                            </p>
                            <p>
                              <strong>Notas:</strong> {pedido.notas}
                            </p>
                          </div>
                        )}
                        <div>
                          {pedido.pedidoItems.map(
                            (item: IItemsPedidos, indx) => {
                              return (
                                <div
                                  key={indx}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: 14,
                                    borderBottom: "1px solid #E5E7EB",
                                    paddingBottom: 6,
                                    marginBottom: 6,
                                    flexWrap: "wrap",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      width: "100%",
                                    }}
                                  >
                                    <span>{item.nombre}</span>
                                    <span style={{ fontWeight: 600 }}>
                                      x{item.cantidad}
                                    </span>
                                  </div>
                                  {item.tipo === "configurable" &&
                                    item.opcionesSeleccionadas && (
                                      <div
                                        style={{
                                          fontSize: 12,
                                          color: "#000000",
                                          marginLeft: 16,
                                          width: "100%",
                                        }}
                                      >
                                        {item.opcionesSeleccionadas.map(
                                          (opcion: any, opIndex: number) => (
                                            <p
                                              key={opIndex}
                                              style={{ margin: "2px 0" }}
                                            >
                                              - {opcion.nombreOpcion}:{" "}
                                              {opcion.valor}
                                            </p>
                                          )
                                        )}
                                      </div>
                                    )}
                                  {item.notas && (
                                    <em
                                      style={{
                                        fontSize: 12,
                                        color: "#000000",
                                        fontStyle: "italic",
                                        marginTop: 2,
                                        width: "100%",
                                      }}
                                    >
                                      Nota: {item.notas}
                                    </em>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <BotonRestaurante
                          label="Cancelar"
                          onClick={() => {
                            setCancelarOpen(true);
                            setIdCancelar(pedido.id);
                          }}
                        />
                        <BotonRestaurante
                          label="Editar"
                          onClick={() => {
                            restablecerImpresion(pedido.id);
                            router.push("/cajero/editar/" + pedido.id);
                          }}
                        />

                        <BotonRestaurante
                          label="Pagar"
                          onClick={() => {
                            if (cajaActiva) {
                              router.push(
                                "/cajero/pagar?pedidoId=" + pedido.id
                              );
                            } else {
                              toast.error(
                                "Debes abrir la caja antes de pagar un pedido."
                              );
                              setOpenCaja(true);
                            }
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {pedidosGuardados.length > 0 && (
          <div style={{ marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "#111827",
                marginBottom: 16,
                borderBottom: "2px solid #E5E7EB",
                paddingBottom: 8,
              }}
            >
              💳 Pedidos por pagar
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 24,
              }}
            >
              {pedidosGuardados.map((pedido) => (
                <div
                  key={pedido.pedido_id}
                  style={{
                    position: "relative",
                    backgroundColor: FONDO_COMPONENTES,
                    border: `2px dashed ${ORANGE}`,
                    boxShadow: "0 10px 40px rgba(0, 0, 0, 0.05)",
                    borderRadius: 24,
                    padding: 24,
                    height: 180,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <button
                    onClick={() =>
                      handleEliminarPedidoPendiente(pedido.pedido_id)
                    }
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 12,
                      background: "transparent",
                      border: "none",
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#DC2626",
                      cursor: "pointer",
                      lineHeight: 1,
                    }}
                    aria-label="Eliminar pedido pendiente"
                  >
                    ×
                  </button>

                  <h3
                    style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}
                  >
                    Pedido #{pedido.pedido_id}
                  </h3>
                  <p style={{ fontSize: 14, color: "#000000" }}>
                    Estado: <strong>Pendiente de pago</strong>
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <BotonRestaurante
                      label="Reanudar pago"
                      onClick={() => {
                        router.push("/tarjetas?pedidoId=" + pedido.pedido_id);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <FormCancelacion
          onClose={() => setCancelarOpen(false)}
          onSave={(razon) => handleCancelPedido(razon)}
          isOpen={cancelarOpen}
        />

        <FormAperturaDeCaja
          onClose={() => setOpenCaja(false)}
          onSave={(denominaciones) => handleInicioDeCaja(denominaciones)}
          isOpen={openCaja}
        />
        <FormCierreCaja
          onClose={() => setCierreDeCajaAbierto(false)}
          isOpen={cierreDeCajaAbierto}
        />
        <FormExtraMoney
          onClose={() => setGastosEIngresosOpen(false)}
          isOpen={gastosEIngresosOpen}
        />
      </div>
      {loadingComanda && <Spinner />}
      {loading || loadingCaja || (loadingComanda && <Spinner />)}
    </div>
  );
}
