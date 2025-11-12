'use client'

import { useEffect, useState } from 'react';
import { MapPin, User, Phone, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast'; 
import { usePedidosStore } from '@/stores/pedidosStore';
import Spinner from '@/components/feedback/Spinner';
import BotonRestaurante from '@/components/ui/Boton';
import { IItemsPedidos, IPedidos } from '@/types/models';



export default function VistaDomiciliario() {
  const { pedidos, loading, traerPedidos, cambiarEstadoPedido } = usePedidosStore();
  const [pedidosDomicilio, setPedidosDomicilio] = useState<IPedidos[]>([]);

  useEffect(() => {
    traerPedidos();
  }, [traerPedidos]);

  useEffect(() => {
    const pedidosFiltrados: IPedidos[] = pedidos.filter(
      (p) => 
        p.tipo_pedido === 'DOMICILIO' && 
        p.estado !== 'ENTREGADO' &&
        p.estado !== 'CANCELADO'
    );
    setPedidosDomicilio(pedidosFiltrados);
  }, [pedidos]);

  const handleMarcarComoEntregado = async (pedidoId: string) => {
    const success = await cambiarEstadoPedido(pedidoId, 'ENTREGADO');
    if (success) {
      toast.success('Pedido marcado como entregado con éxito.');
    } else {
      toast.error('Error al marcar el pedido como entregado.');
    }
  };
  
  return (
    <div className="min-h-screen p-6 font-sans flex flex-col items-center bg-gray-50">
      {loading && <Spinner />}
      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
        Pedidos Pendientes para Domicilio
      </h1>
      
      {pedidosDomicilio.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-md">
          <CheckCircle2 size={64} className="text-green-500 mb-4" />
          <p className="text-lg text-gray-700 font-semibold">
            No hay pedidos pendientes de entrega en este momento.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidosDomicilio.map((pedido: IPedidos) => (
            <div 
              key={pedido.id} 
              className="bg-white rounded-xl shadow-md p-6 flex flex-col gap-4 transition-transform transform hover:scale-105 hover:shadow-lg"
            >
              <h2 className="text-xl font-bold text-gray-800">
                Orden #{pedido.id}
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User size={20} className="text-gray-500" />
                  <span className="text-gray-700 font-medium">{pedido.cliente_nombre}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={20} className="text-gray-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{pedido.cliente_direccion}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={20} className="text-gray-500" />
                  <a href={`tel:${pedido.cliente_telefono}`} className="text-blue-500 hover:underline">
                    {pedido.cliente_telefono}
                  </a>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-semibold text-gray-800 mb-2">Detalle del Pedido</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {pedido.pedidoItems.map((item: IItemsPedidos, index: number) => (
                    <li key={item.id || index} className="text-sm">
                      {item.cantidad}x {item.nombre}
                      {item.notas && <span className="italic text-gray-400"> ({item.notas})</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-between items-center font-bold text-lg mt-4">
                <span className="text-gray-900">Total:</span>
                <span className="text-orange-500">${pedido.total_estimado.toFixed(2)}</span>
              </div>
              
              <BotonRestaurante 
                label="Marcar como Entregado" 
                onClick={() => handleMarcarComoEntregado(pedido.id)} 
                variacion="default"
                disabled={loading}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
