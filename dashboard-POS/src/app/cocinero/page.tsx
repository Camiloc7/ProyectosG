"use client";
import { useConfirm } from "@/components/feedback/confirmModal";
import Spinner from "@/components/feedback/Spinner";
import PedidoInfoModal from "@/components/PedidoModalInfo";
import BotonRestaurante from "@/components/ui/Boton";
import { conectarSocket } from "@/helpers/socket";
import { useAuthStore } from "@/stores/authStore";
import { usePedidosStore } from "@/stores/pedidosStore";
import { FONDO, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";
import { IPedidos } from "@/types/models";
import { RefreshCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export interface UsuarioData {
  id: string;
  establecimiento_id: string;
  rol: string;
}
export default function Cocina() {
  const confirm = useConfirm();
  const { user } = useAuthStore();
  const { pedidos, loading, traerPedidos, actualizarEstadoPedido } =
    usePedidosStore();
  const [pedidoSeleccionado, setPedidoSeleccionado] =
    useState<IPedidos | null>();

  useEffect(() => {
    handleFetch();
  }, []);

  //Conexion con web socket
  useEffect(() => {
    async function init() {
      if (!user?.establecimiento_id) return;

      const socket = await conectarSocket(user.establecimiento_id);
      socket.on("pedidoCreated", ({ pedidoId }) => {
        console.warn("[WS] Nuevo pedido recibido:", pedidoId);
        usePedidosStore.getState().traerPedidos();
      });

      socket.on("pedidos_actualizados", (nuevosPedidos: any[]) => {
        console.warn("[WS] Pedido actualizado:", nuevosPedidos);
        usePedidosStore.getState().traerPedidos();
      });
    }

    init();
  }, []);

  const handleFetch = () => {
    traerPedidos();
  };

  const handleCambiarEstado = async (pedido: IPedidos) => {
    let nuevoEstado = "";
    let mensaje = "";
    if (pedido.estado === "ABIERTO") {
      nuevoEstado = "EN_PREPARACION";
      mensaje = '¿Marcar este pedido como "En preparación"?';
    } else if (pedido.estado === "EN_PREPARACION") {
      nuevoEstado = "LISTO_PARA_ENTREGAR";
      mensaje = '¿Marcar este pedido como "Listo para entregar"?';
    } else {
      return;
    }

    const confirmado = await confirm({
      title: "Confirmar acción",
      description: mensaje,
      confirmText: "Confirmar",
      cancelText: "Cancelar",
    });
    if (confirmado) {
      actualizarEstadoPedido(pedido.id, nuevoEstado);
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case "ABIERTO":
        return "#FFC107"; // amarillo
      case "EN_PREPARACION":
        return "#4CAF50"; // azul
      case "LISTO_PARA_ENTREGAR":
        return "#4CAF50"; // verde
      case "CANCELADO":
        return "#9E9E9E"; // gris
      default:
        return "#6B7280";
    }
  };

  const getButtonText = (estado: string) => {
    switch (estado) {
      case "ABIERTO":
        return "Empezar preparación";
      case "EN_PREPARACION":
        return "Marcar como listo";
      case "LISTO_PARA_ENTREGAR":
        return "Esperando entrega";
      default:
        return "Cambiar estado";
    }
  };

  const getButtonVariacion = (estado: string): "default" | "verde" => {
    switch (estado) {
      case "EN_PREPARACION":
        return "verde";
      default:
        return "default";
    }
  };

  const pedidosListos = pedidos.filter(
    (pedido) => pedido.estado !== "LISTO_PARA_ENTREGAR"
  );

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
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 32,
            padding: "16px 24px",
            backgroundColor: "#ffffff",
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
            color: "#333",
          }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: 0,
              color: "#333",
            }}
          >
            Pedidos Para Cocina
          </h2>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* Refrescar */}
            {loading ? (
              <h1>Cargando...</h1>
            ) : (
              <>
                <span
                  data-tooltip-id="tooltip"
                  data-tooltip-content="Refrescar"
                >
                  <RefreshCcw
                    onClick={handleFetch}
                    style={{ cursor: "pointer", color: "#666" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#28a745")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#666")}
                  />
                </span>
              </>
            )}
          </div>
        </header>

        {pedidosListos.length === 0 && (
          <div style={{ marginBottom: 48 }}>
            <div
              style={{
                backgroundColor: FONDO_COMPONENTES,
                borderRadius: 24,
                padding: 24,
                textAlign: "center",
                color: "#6B7280",
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
                <span style={{ fontWeight: 600 }}>
                  No hay pedidos por preparar
                </span>
              </div>
            </div>
          </div>
        )}

        {pedidosListos.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 24,
            }}
          >
            {pedidosListos.map((pedido: IPedidos) => {
              const getTitulo = () => {
                if (pedido.tipo_pedido === "DOMICILIO") {
                  return pedido.cliente_nombre?.trim() || "Cliente sin nombre";
                }
                if (pedido.tipo_pedido === "MESA") {
                  return pedido.mesa_numero || "Mesa sin número";
                }
                return "PARA LLEVAR";
              };

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
                    height: 300,
                    maxWidth: 350,
                    width: "100%",
                    cursor: "pointer",
                  }}
                  onClick={() => setPedidoSeleccionado(pedido)}
                >
                  {/* Estado con prioridad */}
                  <h4
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: getStatusColor(pedido.estado),
                      marginBottom: 6,
                    }}
                  >
                    Estado: {pedido.estado}
                  </h4>

                  {/* Subtítulo con el tipo de pedido */}
                  <p
                    style={{
                      margin: 0,
                      fontSize: 14,
                      color: "#374151",
                      marginBottom: 12,
                    }}
                  >
                    {getTitulo()}
                  </p>

                  {/* Lista de productos */}
                  <div style={{ flexGrow: 1, overflowY: "auto" }}>
                    {pedido.pedidoItems.map((item: any, indx: any) => (
                      <div
                        key={indx}
                        style={{
                          display: "flex",
                          flexDirection: "column", // para que notas quede debajo del nombre
                          fontSize: 14,
                          borderBottom: "1px solid #E5E7EB",
                          paddingBottom: 6,
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>{item.nombre}</span>
                          <span style={{ fontWeight: 600 }}>
                            x{item.cantidad}
                          </span>
                        </div>

                        {item.notas && (
                          <span
                            style={{
                              fontSize: 12,
                              color: "#6B7280", // gris más claro
                              marginTop: 2,
                              fontStyle: "italic",
                            }}
                          >
                            {item.notas}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Botón de acción */}
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      marginTop: 12,
                    }}
                  >
                    <BotonRestaurante
                      label={getButtonText(pedido.estado)}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCambiarEstado(pedido);
                      }}
                      variacion={getButtonVariacion(pedido.estado)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {/* //MODAL DE INFO DE PEDIDO */}
      <PedidoInfoModal
        pedido={pedidoSeleccionado || null}
        isOpen={!!pedidoSeleccionado}
        onClose={() => setPedidoSeleccionado(null)}
      />

      {loading && <Spinner />}
    </div>
  );
}
