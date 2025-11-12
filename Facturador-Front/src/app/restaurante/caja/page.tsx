'use client';

import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  PhoneCall,
  ShoppingBag,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Item } from '../data';
import BotonQuality from '@/components/ui/BotonQuality';
import PrivateRoute from '@/helpers/PrivateRoute';
import AdminLayoutRestaurante from '../AdminLayout';

type Estado = 'PENDIENTE' | 'EN PROCESO' | 'FINALIZADO';

export type PedidoMesa = {
  estado: Estado;
  items: Record<string, Item[]>;
};

export default function Caja() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Record<string, PedidoMesa>>({});

  useEffect(() => {
    const nuevosPedidos: Record<string, PedidoMesa> = {};

    for (let key in localStorage) {
      if (key.startsWith('pedido-mesa-')) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;

          const data = JSON.parse(raw);
          const pedido: PedidoMesa = {
            estado: data.estado || 'PENDIENTE',
            items: data.items || data,
          };
          nuevosPedidos[key] = pedido;
        } catch (e) {
          console.error('Error leyendo pedido:', key);
        }
      }
    }
    setPedidos(nuevosPedidos);
  }, []);

  const handlePagar = (mesaKey: string) => {
    localStorage.setItem('pago-mesa', String(mesaKey));
    router.push('/restaurante/caja/pagar');
  };

  const handleArrowBack = () => {
    router.push('/restaurante/usuarios/');
  };

  const renderEstadoBadge = (estado: Estado) => {
    const base = 'text-xs px-2 py-1 rounded-full font-semibold';
    switch (estado) {
      case 'PENDIENTE':
        return (
          <span className={`${base} bg-yellow-100 text-yellow-800`}>
            PENDIENTE
          </span>
        );
      case 'EN PROCESO':
        return (
          <span className={`${base} bg-blue-100 text-blue-800`}>
            EN PROCESO
          </span>
        );
      case 'FINALIZADO':
        return (
          <span className={`${base} bg-green-100 text-green-800`}>
            FINALIZADO
          </span>
        );
    }
  };

  return (
    <PrivateRoute>
      <AdminLayoutRestaurante>
        <div className="p-8 bg-white min-h-screen space-y-8">
          <h1 className="text-3xl font-bold text-center text-[#00A7E1]">
            Vista de la Caja
          </h1>

          {/* 🧾 Pedidos activos */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              🧾 Pedidos en restaurante
            </h2>
            {Object.keys(pedidos).length === 0 ? (
              <div className="text-center text-gray-500">
                No hay pedidos activos
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {Object.entries(pedidos).map(([mesaKey, pedido]) => {
                  const mesaNum = mesaKey.replace('pedido-mesa-', '');
                  const items = Object.values(pedido.items)
                    .flat()
                    .filter((i) => i.quantity > 0);

                  const isFinalizado = pedido.estado === 'FINALIZADO';

                  return (
                    <div
                      key={mesaKey}
                      className={`rounded-2xl border-2 shadow p-4 flex flex-col gap-3 transition ${
                        isFinalizado
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-xl font-semibold text-blue-600">
                        Mesa {mesaNum}
                      </div>

                      <div className="space-y-2">
                        {items.map((item) => (
                          <div
                            key={item.id}
                            className="flex flex-col text-sm border-b pb-2 mb-2"
                          >
                            <div className="flex justify-between">
                              <span>{item.name}</span>
                              <span className="font-semibold">
                                x{item.quantity}
                              </span>
                            </div>
                            {item.nota && (
                              <div className="text-xs text-gray-600 italic mt-1">
                                Nota: {item.nota}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        {renderEstadoBadge(pedido.estado)}
                        {isFinalizado && (
                          <button
                            onClick={() => handlePagar(mesaKey)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                          >
                            PAGAR
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ☎️ Pedidos telefónicos */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <PhoneCall className="text-blue-500" size={22} /> Pedidos por
              Teléfono{' '}
              <BotonQuality
                label={'Agregar pedido'}
                onClick={() =>
                  router.push('/restaurante/meseros/listaDePedidos')
                }
              />
            </h2>
            <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-500">
              (Aquí se mostrarán pedidos tomados por llamada telefónica...)
            </div>
          </div>

          {/* 🛵 Pedidos por apps */}
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <ShoppingBag className="text-pink-500" size={22} /> Pedidos por
              plataformas externas{' '}
              <BotonQuality
                label={'Agregar pedido'}
                onClick={() =>
                  router.push('/restaurante/meseros/listaDePedidos')
                }
              />
            </h2>
            <div className="border-2 border-dashed rounded-lg p-6 text-center text-gray-500">
              (Aquí aparecerán pedidos sincronizados con Uber Eats, Rappi,
              Domicilios.com, etc.)
            </div>
          </div>
        </div>
      </AdminLayoutRestaurante>
    </PrivateRoute>
  );
}
