import React from 'react';
import { IPedidos, IItemsPedidos } from "@/types/models";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FONDO_COMPONENTES, ORANGE } from '@/styles/colors';

interface PedidoDetallesProps {
  pedido: IPedidos;
}

export default function PedidoDetalles({ pedido }: PedidoDetallesProps) {
  if (!pedido) {
    return null;
  }

  return (
    <div className="p-8 bg-gray-100 min-h-screen text-gray-900 font-sans">
      <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gray-200">
        <h2 className="text-4xl font-extrabold text-gray-900">
          Detalles del Pedido <span className="text-orange-500">#{pedido.id.slice(-4)}</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div 
          className="p-6 rounded-3xl shadow-xl transition-transform transform hover:scale-105"
          style={{ backgroundColor: FONDO_COMPONENTES, border: `2px solid ${ORANGE}` }}
        >
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full" style={{ backgroundColor: ORANGE, opacity: 0.1 }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-800 ml-3">Información General</h3>
          </div>
          <p className="text-gray-600 mb-2"><strong>Estado:</strong> {pedido.estado}</p>
          <p className="text-gray-600 mb-2"><strong>Origen:</strong> {pedido.tipo_pedido}</p>
          <p className="text-gray-600 mb-2"><strong>Fecha:</strong> {format(new Date(pedido.created_at), 'PPP p', { locale: es })}</p>
          {pedido.mesa_numero && <p className="text-gray-600"><strong>Mesa:</strong> {pedido.mesa_numero}</p>}
        </div>
        <div 
          className="p-6 rounded-3xl shadow-xl transition-transform transform hover:scale-105"
          style={{ backgroundColor: FONDO_COMPONENTES, border: `2px solid ${ORANGE}` }}
        >
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full" style={{ backgroundColor: ORANGE, opacity: 0.1 }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-800 ml-3">Cliente</h3>
          </div>
          <p className="text-gray-600 mb-2"><strong>Nombre:</strong> {pedido.cliente_nombre || 'N/A'}</p>
          <p className="text-gray-600 mb-2"><strong>Teléfono:</strong> {pedido.cliente_telefono || 'N/A'}</p>
          <p className="text-gray-600 mb-2"><strong>Dirección:</strong> {pedido.cliente_direccion || 'N/A'}</p>
        </div>
        <div 
          className="p-6 rounded-3xl shadow-xl transition-transform transform hover:scale-105"
          style={{ backgroundColor: FONDO_COMPONENTES, border: `2px solid ${ORANGE}` }}
        >
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-full" style={{ backgroundColor: ORANGE, opacity: 0.1 }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <h3 className="font-bold text-lg text-gray-800 ml-3">Detalles</h3>
          </div>
          <p className="text-gray-600 mb-2"><strong>Total Estimado:</strong> <span className="font-bold text-xl text-gray-900">${pedido.total_estimado.toFixed(2)}</span></p>
          <p className="text-gray-600"><strong>Notas del pedido:</strong> {pedido.notas || 'N/A'}</p>
        </div>
      </div>
      <div 
        className="p-6 rounded-3xl shadow-xl"
        style={{ backgroundColor: FONDO_COMPONENTES, border: `2px solid ${ORANGE}` }}
      >
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-full" style={{ backgroundColor: ORANGE, opacity: 0.1 }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v15a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6l-3-4H6z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
          <h3 className="font-bold text-xl text-gray-800 ml-3">Productos</h3>
        </div>
        <ul className="space-y-4">
          {pedido.pedidoItems.map((item: IItemsPedidos) => (
            <li key={item.id} className="border-b border-gray-200 last:border-b-0 pb-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-800">{item.cantidad} x {item.nombre}</span>
                <span className="font-semibold text-orange-500">${item.precio.toFixed(2)}</span>
              </div>
              {item.notas && <p className="italic text-sm text-gray-500 mt-1">({item.notas})</p>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}




// import React from 'react';
// import { IPedidos, IItemsPedidos  } from "@/types/models"; 

// interface PedidoDetallesProps {
//   pedido: IPedidos;
// }

// export default function PedidoDetalles({ pedido }: PedidoDetallesProps) {
//   if (!pedido) {
//     return null;
//   }

//   return (
//     <div className="bg-gray-100 p-6 rounded-lg shadow-lg">
//       <h2 className="text-3xl font-bold text-gray-900 mb-4">Detalles del Pedido #{pedido.id}</h2>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         <div className="bg-white p-4 rounded-lg shadow-md">
//           <h3 className="font-semibold text-lg text-gray-800 mb-2">Información General</h3>
//           <p><strong>Estado:</strong> {pedido.estado}</p>
//           <p><strong>Origen:</strong> {pedido.tipo_pedido}</p>
//           <p><strong>Fecha:</strong> {new Date(pedido.created_at).toLocaleString()}</p>
//           {pedido.mesa_numero && <p><strong>Mesa:</strong> {pedido.mesa_numero}</p>}
//         </div>

//         <div className="bg-white p-4 rounded-lg shadow-md">
//           <h3 className="font-semibold text-lg text-gray-800 mb-2">Cliente</h3>
//           <p><strong>Nombre:</strong> {pedido.cliente_nombre || 'N/A'}</p>
//           <p><strong>Teléfono:</strong> {pedido.cliente_telefono || 'N/A'}</p>
//           <p><strong>Dirección:</strong> {pedido.cliente_direccion || 'N/A'}</p>
//         </div>
//       </div>

//       <div className="bg-white p-4 rounded-lg shadow-md mt-6">
//         <h3 className="font-semibold text-lg text-gray-800 mb-2">Productos</h3>
//         <ul className="list-disc list-inside space-y-2">
//           {pedido.pedidoItems.map((item: IItemsPedidos ) => (
//             <li key={item.id}>
//               <span className="font-medium">{item.cantidad} x {item.nombre}</span> - ${item.precio.toFixed(2)} c/u
//               {item.notas && <span className="italic text-sm text-gray-500"> ({item.notas})</span>}
//             </li>
//           ))}
//         </ul>
//       </div>
//       <div className="bg-white p-4 rounded-lg shadow-md mt-6">
//           <p className="text-xl font-bold text-gray-900">Total Estimado: ${pedido.total_estimado.toFixed(2)}</p>
//           <p className="text-gray-600">Notas del pedido: {pedido.notas || 'N/A'}</p>
//       </div>
//     </div>
//   );
// }