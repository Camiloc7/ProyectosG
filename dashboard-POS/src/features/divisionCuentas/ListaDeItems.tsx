import { IItemsPedidos } from "@/types/models";
import { formatearNumero } from "../../helpers/betterNumberFormat";

export function ListaItems({ items = [] }: { items?: any[] }) {
  const subtotal = items.reduce((sum, it) => sum + it.cantidad * it.precio, 0);

  return (
    <div
      style={{
        backgroundColor: "#fff",
        color: "#333",
        borderRadius: 8,
        padding: 20,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        marginBottom: 20,
      }}
    >
      <h2 style={{ marginBottom: 12, fontSize: 20, fontWeight: 600 }}>
        Resumen del Pedido
      </h2>
      {items.map((it) => (
        <div
          key={it.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 500 }}>
              {it.nombre} ×{it.cantidad}
            </p>
            {it.notas && (
              <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                {it.notas}
              </p>
            )}
          </div>
          <p style={{ margin: 0, fontWeight: 600 }}>
            ${(it.cantidad * it.precio).toFixed(2)}
          </p>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #eee",
          paddingTop: 12,
          marginTop: 12,
          fontWeight: 700,
        }}
      >
        <span>Total:</span>
        <span>${formatearNumero(subtotal)}</span>
      </div>
    </div>
  );
}
