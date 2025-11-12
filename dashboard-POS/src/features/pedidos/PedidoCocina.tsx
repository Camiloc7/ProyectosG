import React from 'react';
import { IPedidos, IItemsPedidos, EstadoPedido } from '@/types/models';

interface PedidoCocinaProps {
  pedido: IPedidos;
  handleAction: () => void;
  buttonText: string;
  buttonColor: string;
}

const getStatusIcon = (status: EstadoPedido) => {
  switch (status) {
    case EstadoPedido.ABIERTO:
      return <svg className="w-4 h-4 mr-1 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 002 0V8a1 1 0 00-1.555-.832z" /></svg>;
    case EstadoPedido.EN_PREPARACION:
      return <svg className="w-4 h-4 mr-1 text-black" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M11.968 2.378c.451-.433 1.144-.393 1.556.096l4.288 5.152a1 1 0 01-1.556 1.295L15.42 7.732a1 1 0 00-.73-.245l-1.922.384a1 1 0 01-.628-.242l-1.428-1.284c-.451-.433-1.144-.393-1.556.096L6.58 7.732a1 1 0 00-.73-.245L3.928 7.871a1 1 0 01-.628.242L1.878 9.155a1 1 0 01-1.556-1.295l4.288-5.152a1 1 0 011.556-.096l1.428 1.284c.451.433 1.144.393 1.556-.096l1.922-.384a1 1 0 01.628.242l1.428 1.284z" clipRule="evenodd" /></svg>;
    case EstadoPedido.LISTO_PARA_ENTREGAR:
      return <svg className="w-4 h-4 mr-1 text-black" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
    default:
      return null;
  }
};

const PedidoCocina: React.FC<PedidoCocinaProps> = ({ pedido, handleAction, buttonText, buttonColor }) => {
  return (
    <div className="p-5 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 16h.01M16 7h.01M16 16h.01M10 7h.01M10 16h.01M13 7h.01M13 16h.01M7 13h.01M16 13h.01M10 13h.01M13 13h.01" /></svg>
          <p className="font-bold text-lg text-gray-800">
            <span className="text-sm font-semibold text-gray-500 mr-1">Pedido</span>
            {pedido.codigo_pedido}
          </p>
        </div>
        <div className={`flex items-center py-1 px-3 rounded-full ${buttonColor}`}>
          {getStatusIcon(pedido.estado as EstadoPedido)}
          <span className={`text-xs font-semibold ${pedido.estado === EstadoPedido.ABIERTO ? 'text-gray-800' : 'text-white'}`}>
            {pedido.estado}
          </span>
        </div>
      </div>

      <div className="flex-grow">
        <div className="flex items-center text-gray-600 mb-4">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c1.657 0 3 1.343 3 3v2a3 3 0 003 3h3.5l1.5 1.5M12 8V6a2 2 0 012-2h2a2 2 0 012 2v2m-6 0H6a2 2 0 00-2 2v2a2 2 0 002 2h2m0-4h4m0 0v4m0 0H6m6 0a2 2 0 01-2-2v-2a2 2 0 012-2z" /></svg>
          <span className="text-sm">{pedido.tipo_pedido === 'MESA' ? `Mesa: ${pedido.mesa_numero}` : `A Domicilio: ${pedido.cliente_nombre || 'N/A'}`}</span>
        </div>
        
        <h3 className="font-bold text-gray-800 mb-2">Ítems del Pedido:</h3>
        <ul className="space-y-2">
          {pedido.pedidoItems && pedido.pedidoItems.length > 0 ? (
            pedido.pedidoItems.map((prodItem: IItemsPedidos, index) => (
              <li key={index} className="flex items-start">
                <span className="font-bold text-orange-500 mr-2">{prodItem.cantidad}x</span>
                <div>
                  <span className="text-sm text-gray-800">{prodItem.nombre}</span>
                  {prodItem.notas && (
                    <p className="text-xs text-gray-500 italic mt-1">
                      (Notas: {prodItem.notas})
                    </p>
                  )}
                </div>
              </li>
            ))
          ) : (
            <p className="text-sm italic text-gray-500">No hay ítems en este pedido.</p>
          )}
        </ul>
      </div>

      <button
        onClick={handleAction}
        className={`mt-4 w-full text-black font-bold py-3 rounded-xl transition duration-300 transform hover:scale-105 shadow-lg ${buttonColor}
        ${(pedido.estado === EstadoPedido.LISTO_PARA_ENTREGAR || pedido.estado === EstadoPedido.ENTREGADO || pedido.estado === EstadoPedido.CANCELADO) && 'opacity-50 cursor-not-allowed'}`}
        disabled={pedido.estado === EstadoPedido.LISTO_PARA_ENTREGAR || pedido.estado === EstadoPedido.ENTREGADO || pedido.estado === EstadoPedido.CANCELADO}
      >
        {buttonText}
      </button>
    </div>
  );
};

export default PedidoCocina;