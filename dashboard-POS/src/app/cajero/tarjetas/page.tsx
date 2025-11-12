"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
const FONDO = "#F3F4F6";
const FONDO_COMPONENTES = "#FFFFFF";
const ORANGE = "#FF6347";
type Item = {
  id: string | number;
  nombre: string;
  cantidad: number;
  precio: number;
};

type Tarjeta = {
  name: string;
  cedula: string;
  items: Item[];
  total: number;
  paid?: boolean;
  propina?: number;
};

export default function TarjetasPorPagar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get("pedidoId");
  const [tarjetas, setTarjetas] = useState<Tarjeta[]>([]);
  const [mensajeFinal, setMensajeFinal] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!pedidoId) return;

      const respaldoUnico = JSON.parse(
        localStorage.getItem(`respaldo_unico_${pedidoId}`) || "null"
      );
      const respaldoDividido = JSON.parse(
        localStorage.getItem(`respaldo_dividido_${pedidoId}`) || "null"
      );

      if (respaldoUnico) {
        const tarjeta: Tarjeta = {
          name: respaldoUnico.nombre_completo || "",
          cedula: respaldoUnico.numero_documento || "",
          total: respaldoUnico.monto_a_pagar || 0,
          items: [],
          paid: respaldoUnico.pagada ?? false,
          propina: parseFloat(respaldoUnico.propina) || 0,
        };
        setTarjetas([tarjeta]);

        // ✅ Si ya está pagada, limpiar respaldo
        if (tarjeta.paid) {
          // await window.electron.storeDelete(`respaldo_unico_${pedidoId}`)
          localStorage.removeItem(`respaldo_unico_${pedidoId}`);
          setMensajeFinal(true);
          setTimeout(() => router.push("/cajero"), 2000);
        }
      } else if (respaldoDividido && Array.isArray(respaldoDividido.pagos)) {
        const nuevasTarjetas: Tarjeta[] = respaldoDividido.pagos.map(
          (p: any) => ({
            name: p.nombre_completo || "",
            cedula: p.numero_documento || "",
            total: p.monto_a_pagar || 0,
            items: [],
            paid: p.pagada ?? false,
            propina: parseFloat(p.propina) || 0, // ✅ agregar propina
          })
        );

        setTarjetas(nuevasTarjetas);

        // ✅ Verificar si todas están pagadas
        const todasPagadas = nuevasTarjetas.every((t) => t.paid);
        if (todasPagadas) {
          localStorage.removeItem(`respaldo_dividido_${pedidoId}`);

          // await window.electron.storeDelete(`respaldo_dividido_${pedidoId}`)
          setMensajeFinal(true);

          setTimeout(() => router.push("/cajero"), 2000);
        }
      } else {
        setTarjetas([]);
      }
    }

    loadData();
  }, [pedidoId, router]);

  const onPagar = (idx: number, electronica: boolean) => {
    const tarjeta = tarjetas[idx];
    const destino = electronica ? "/cajero/electronico" : "/cajero/efectivo";
    router.push(
      `${destino}?idx=${idx}&total=${
        tarjeta.total
      }&pedidoId=${pedidoId}&propina=${tarjeta.propina || 0}`
    );
  };

  const buttonStyle = {
    backgroundColor: ORANGE,
    color: "#ffffff",
    height: 40,
    padding: "8px 16px",
    fontWeight: 500,
    border: "none",
    borderRadius: 25,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    transition: "box-shadow 0.3s ease",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: FONDO,
        padding: 24,
        fontFamily: "Lato, sans-serif",
        boxSizing: "border-box",
      }}
    >
      {mensajeFinal ? (
        <div
          style={{
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1.2rem",
          }}
        >
          ✅ Pedido pagado completamente
        </div>
      ) : (
        <>
          <div
            style={{ display: "flex", alignItems: "center", marginBottom: 24 }}
          >
            <ArrowLeft
              size={24}
              stroke={ORANGE}
              style={{ cursor: "pointer" }}
              onClick={() => router.push("/cajero")}
            />
            <h1
              style={{
                margin: "0 0 0 12px",
                fontSize: 22,
                fontWeight: 700,
                color: "#333",
              }}
            >
              Tarjetas por Pagar
            </h1>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {tarjetas.length === 0 && (
              <p style={{ color: "#999", fontSize: 16 }}>
                No hay tarjetas pendientes por pagar.
              </p>
            )}
            {tarjetas.map((t, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: FONDO_COMPONENTES,
                  border: `2px solid ${ORANGE}`,
                  borderRadius: 16,
                  padding: 20,
                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.05)",
                  opacity: t.paid ? 0.6 : 1,
                  position: "relative",
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#333",
                    marginBottom: 8,
                  }}
                >
                  {t.name}
                </h2>
                <p style={{ margin: "0 0 12px", color: "#555" }}>
                  <strong>Cédula:</strong> {t.cedula}
                </p>
                <ul
                  style={{ listStyle: "none", padding: 0, margin: "0 0 16px" }}
                >
                  {t.items?.map((it) => (
                    <li
                      key={it.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 14,
                        marginBottom: 6,
                      }}
                    >
                      <span>{it.nombre}</span>
                      <span>x{it.cantidad}</span>
                      <span>${(it.cantidad * it.precio).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ margin: "0 0 12px", color: "#555" }}>
                  <strong>Total:</strong> ${t.total.toFixed(2)}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    disabled={t.paid}
                    onClick={() => onPagar(idx, false)}
                    style={buttonStyle}
                  >
                    Efectivo
                  </button>
                  <button
                    disabled={t.paid}
                    onClick={() => onPagar(idx, true)}
                    style={buttonStyle}
                  >
                    Electrónico
                  </button>
                </div>
                {t.paid && (
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      backgroundColor: ORANGE,
                      color: "#fff",
                      borderRadius: 12,
                      padding: "4px 8px",
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    ✓ Pagado
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
