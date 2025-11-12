import React from 'react';
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




// import React from 'react';
// import { IPedidos } from "@/types/models"; // Asegúrate de tener la interfaz correcta

// interface PedidoCardProps {
//   pedido: IPedidos;
//   onClick: (pedido: IPedidos) => void;
// }

// export default function PedidoCard({ pedido, onClick }: PedidoCardProps) {
//   return (
//     <div
//       onClick={() => onClick(pedido)}
//       className="p-4 bg-gray-100 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-colors"
//     >
//       <h3 className="font-bold text-lg mb-2">Pedido #{pedido.id}</h3>
//       <p className="text-sm text-gray-600">Estado: {pedido.estado}</p>
//       <p className="text-sm text-gray-600">Origen: {pedido.tipo_pedido}</p>
//       <p className="text-sm text-gray-600">Mesa: {pedido.mesa_numero || 'N/A'}</p>
//       {/* Agrega más detalles si es necesario */}
//     </div>
//   );
// }


// import BotonRestaurante from "@/components/ui/Boton";
// import { format } from "date-fns";
// import { es } from "date-fns/locale";
// import { ArrowLeft } from "lucide-react";
// import { useState } from "react";

// function PedidoCard({ pedido }: { pedido: any }) {
//   const [showModal, setShowModal] = useState(false);
//   const isCancelado = pedido.estado === "CANCELADO";

//   return (
//     <>
//       <div
//         className={`rounded-xl shadow p-4 transition-all ${
//           isCancelado ? "bg-red-100 border-red-500 border" : "bg-white"
//         }`}
//         onClick={() => setShowModal(true)}
//       >
//         <div className="flex justify-between items-center mb-2">
//           <h2 className="font-bold text-lg">{pedido.tipo_pedido}</h2>
//           <span
//             className={`text-xs font-medium px-2 py-1 rounded-full ${
//               isCancelado
//                 ? "bg-red-200 text-red-800"
//                 : "bg-blue-100 text-blue-800"
//             }`}
//           >
//             {pedido.estado}
//           </span>
//         </div>

//         <p className="text-sm text-gray-600">
//           Cliente: {pedido.cliente_nombre || "N/A"} <br />
//           Total: ${Number(pedido.total_estimado).toLocaleString()} <br />
//           Fecha: {format(new Date(pedido.created_at), "PPpp", { locale: es })}
//         </p>

//         <div className="mt-4">
//           <BotonRestaurante
//             label="Ver detalles"
//             onClick={() => setShowModal(true)}
//           />
//         </div>
//       </div>

//       {/* El modal */}
//       {showModal && (
//         <div
//           className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all"
//           onClick={() => setShowModal(false)}
//         >
//           <div
//             className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto relative"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <button
//               onClick={() => setShowModal(false)}
//               className="absolute top-4 right-4 text-gray-500 hover:text-black text-3xl font-bold"
//             >
//               &times;
//             </button>

//             <header className="mb-6">
//               <h2 className="text-2xl font-semibold text-gray-800">
//                 Detalles del Pedido
//               </h2>
//               <p className="text-sm text-gray-500">
//                 Creado el{" "}
//                 {format(new Date(pedido.created_at), "PPpp", { locale: es })}
//               </p>
//             </header>

//             <section className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700 mb-6">
//               <div className="space-y-3">
//                 <p>
//                   <strong>ID del Pedido:</strong> {pedido.id}
//                 </p>
//                 <p>
//                   <strong>Estado:</strong> {pedido.estado}
//                 </p>
//                 <p>
//                   <strong>Tipo de Pedido:</strong> {pedido.tipo_pedido}
//                 </p>
//                 <p>
//                   <strong>Fecha del Pedido:</strong>{" "}
//                   {pedido.fecha_hora_pedido
//                     ? format(new Date(pedido.fecha_hora_pedido), "PPpp", {
//                         locale: es,
//                       })
//                     : "N/A"}
//                 </p>
//                 <p>
//                   <strong>Última Actualización Cocina:</strong>{" "}
//                   {format(
//                     new Date(
//                       pedido.fecha_ultima_actualizacion_relevante_cocina
//                     ),
//                     "PPpp",
//                     { locale: es }
//                   )}
//                 </p>
//                 <p>
//                   <strong>Fecha Cancelación:</strong>{" "}
//                   {pedido.fecha_cancelacion
//                     ? format(new Date(pedido.fecha_cancelacion), "PPpp", {
//                         locale: es,
//                       })
//                     : "N/A"}
//                 </p>
//               </div>

//               <div className="space-y-3">
//                 <p>
//                   <strong>Cliente:</strong> {pedido.cliente_nombre || "N/A"}
//                 </p>
//                 <p>
//                   <strong>Teléfono:</strong> {pedido.cliente_telefono || "N/A"}
//                 </p>
//                 <p>
//                   <strong>Dirección:</strong>{" "}
//                   {pedido.cliente_direccion || "N/A"}
//                 </p>
//                 <p>
//                   <strong>Notas:</strong>{" "}
//                   {pedido.notas && pedido.notas.trim() !== ""
//                     ? pedido.notas
//                     : "N/A"}
//                 </p>
//                 <p>
//                   <strong>Total Estimado:</strong> $
//                   {Number(pedido.total_estimado).toLocaleString()}
//                 </p>
//                 <p>
//                   <strong>Descuentos Aplicados:</strong> $
//                   {Number(pedido.descuentos_aplicados).toLocaleString()}
//                 </p>
//                 <p>
//                   <strong>Establecimiento:</strong>{" "}
//                   {pedido.establecimiento?.nombre}
//                 </p>
//               </div>
//             </section>

//             <hr className="my-6" />

//             <section className="text-sm text-gray-700 space-y-2 mb-6">
//               <h3 className="text-lg font-semibold mb-2">Empleados</h3>
//               <p>
//                 <strong>Creado por:</strong>{" "}
//                 {pedido.usuarioCreador
//                   ? `${pedido.usuarioCreador.nombre} ${pedido.usuarioCreador.apellido}`
//                   : "N/A"}
//               </p>
//               <p>
//                 <strong>Cancelado por:</strong>{" "}
//                 {pedido.usuarioCancelador
//                   ? `${pedido.usuarioCancelador.nombre} ${pedido.usuarioCancelador.apellido}`
//                   : "N/A"}
//               </p>
//               <p>
//                 <strong>Domiciliario asignado:</strong>{" "}
//                 {pedido.usuarioDomiciliario
//                   ? `${pedido.usuarioDomiciliario.nombre} ${pedido.usuarioDomiciliario.apellido}`
//                   : "N/A"}
//               </p>
//             </section>

//             <hr className="my-6" />

//             <section className="text-sm text-gray-700">
//               <h3 className="text-lg font-semibold mb-4">Items del Pedido</h3>
//               <div className="space-y-3">
//                 {pedido.pedidoItems.map((item: any) => (
//                   <div
//                     key={item.id}
//                     className="border rounded-lg p-4 shadow-sm bg-gray-50 flex justify-between items-center"
//                   >
//                     <div>
//                       <p className="font-medium">{item.producto?.nombre}</p>
//                       <p className="text-gray-500">Cantidad: {item.cantidad}</p>
//                     </div>
//                     <div className="text-right">
//                       <p className="font-semibold text-gray-800">
//                         $
//                         {Number(
//                           item.precio_unitario_al_momento_venta * item.cantidad
//                         ).toLocaleString()}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <div className="border-t mt-6 pt-4 text-right">
//                 <p className="text-base font-bold">
//                   Total: $
//                   {pedido.pedidoItems
//                     .reduce(
//                       (total: number, item: any) =>
//                         total +
//                         item.precio_unitario_al_momento_venta * item.cantidad,
//                       0
//                     )
//                     .toLocaleString()}
//                 </p>
//               </div>
//             </section>
//           </div>
//         </div>
//       )}
//     </>
//   );
// }

// export default PedidoCard;
