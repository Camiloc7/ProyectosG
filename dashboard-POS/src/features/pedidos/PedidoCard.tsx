import React from "react";
import BotonRestaurante from "@/components/ui/Boton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { IPedidos } from "@/types/models";

interface PedidoCardProps {
  pedido: IPedidos;
  onClick: (pedido: IPedidos) => void;
}

const PedidoCard: React.FC<PedidoCardProps> = ({ pedido, onClick }) => {
  const isCancelado = pedido.estado === "CANCELADO";

  return (
    <div
      className={`rounded-xl shadow p-4 transition-all cursor-pointer ${
        isCancelado ? "bg-red-100 border-red-500 border" : "bg-white"
      }`}
      onClick={() => onClick(pedido)}
    >
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-bold text-lg">{pedido.tipo_pedido}</h2>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isCancelado
              ? "bg-red-200 text-red-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {pedido.estado}
        </span>
      </div>

      <p className="text-sm text-gray-600">
        Cliente: {pedido.cliente_nombre || "Sin información del cliente"} <br />
        Total: ${Number(pedido.total_estimado).toLocaleString()} <br />
        Fecha: {format(new Date(pedido.created_at), "PPpp", { locale: es })}
      </p>
      <div className="mt-4">
        <BotonRestaurante
          label="Ver detalles"
          onClick={() => onClick(pedido)}
        />
      </div>
    </div>
  );
};

export default PedidoCard;
