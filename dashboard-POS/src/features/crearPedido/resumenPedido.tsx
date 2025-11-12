import { CrearPedidoItem } from "@/app/mesero/page";
import { Minus, Plus } from "lucide-react";

export function ResumenPedido({
  pedidoItems,
  total,
  handleCantidad,
  handleNotaChange,
}: {
  pedidoItems: CrearPedidoItem[];
  total: number;
  handleCantidad: (item: CrearPedidoItem, delta: number) => void;
  handleNotaChange: (id: string, nota: string) => void;
}) {
  return (
    <div className="w-full lg:w-1/3 bg-gray-50 rounded-2xl shadow-lg p-6 sticky pb-0 top-6 h-[80vh] overflow-y-auto flex flex-col">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-6">Tu Pedido</h2>

      {pedidoItems.length === 0 ? (
        <p className="text-gray-400 italic flex-grow">
          No hay productos agregados
        </p>
      ) : (
        <div className="flex-grow flex flex-col gap-4">
          {pedidoItems.map((item) => (
            <div
              key={item.id}
              className="flex flex-col p-3 bg-white rounded-xl shadow-sm border border-gray-100 relative"
            >
              <div className="flex items-center justify-between gap-3">
                {/* Contenedor del título con fade si es muy largo */}
                <div className="flex-1 relative">
                  <span className="font-semibold text-gray-700 block truncate">
                    {item.nombre}
                  </span>
                  {/* Fade al final del texto largo */}
                  <div className="absolute top-0 right-0 h-full w-10 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                </div>

                <div className="flex items-center gap-2 ">
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                    onClick={() => handleCantidad(item, -1)}
                  >
                    <Minus size={16} />
                  </button>

                  {/* Centrar el número */}
                  <span className="w-6 text-center font-medium text-gray-700">
                    {item.cantidad}
                  </span>

                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 transition"
                    onClick={() => handleCantidad(item, 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Precio */}
                <span className="font-bold text-gray-800">
                  ${(item.precio * item.cantidad).toFixed(2)}
                </span>
              </div>

              <input
                placeholder="Agregar nota..."
                value={item.nota}
                onChange={(e) => handleNotaChange(item.id, e.target.value)}
                className="mt-3 w-full border border-gray-200 h-10 rounded-lg text-gray-700 p-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm"
              />
            </div>
          ))}
        </div>
      )}

      {/* Sticky total section */}
      {pedidoItems.length > 0 && (
        <div className="mt-6 pt-4 sticky bottom-0 bg-gray-50 -mx-6 px-6">
          <div className="border-t border-gray-200 pt-4 flex justify-between items-center h-10 mb-6 font-bold text-xl text-gray-800">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
