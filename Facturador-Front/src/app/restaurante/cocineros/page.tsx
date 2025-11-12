'use client';

import { ArrowLeft, Loader2, CheckCircle, Play } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Item } from '../data';

type Estado = 'PENDIENTE' | 'EN PROCESO' | 'FINALIZADO';

type PedidoMesa = {
  estado: Estado;
  items: Record<string, Item[]>;
};

export default function CocinerosView() {
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
          const estado = data.estado || 'PENDIENTE';

          // Solo agregamos si NO está finalizado
          if (estado !== 'FINALIZADO') {
            nuevosPedidos[key] = {
              estado,
              items: data.items || data,
            };
          }
        } catch (e) {
          console.error('Error leyendo pedido:', key);
        }
      }
    }

    setPedidos(nuevosPedidos);
  }, []);

  //   useEffect(() => {
  //     const nuevosPedidos: Record<string, PedidoMesa> = {};

  //     for (let key in localStorage) {
  //       if (key.startsWith('pedido-mesa-')) {
  //         try {
  //           const raw = localStorage.getItem(key);
  //           if (!raw) continue;

  //           const data = JSON.parse(raw);
  //           const pedido: PedidoMesa = {
  //             estado: data.estado || 'PENDIENTE',
  //             items: data.items || data,
  //           };
  //           nuevosPedidos[key] = pedido;
  //         } catch (e) {
  //           console.error('Error leyendo pedido:', key);
  //         }
  //       }
  //     }

  //     setPedidos(nuevosPedidos);
  //   }, []);

  const pedidosActivos = Object.entries(pedidos).filter(
    ([key, pedido]) => pedido.estado !== 'FINALIZADO'
  );

  const handleEstadoChange = (mesaKey: string, nuevoEstado: Estado) => {
    const actualizado = {
      ...pedidos[mesaKey],
      estado: nuevoEstado,
    };

    const nuevos = {
      ...pedidos,
      [mesaKey]: actualizado,
    };

    localStorage.setItem(mesaKey, JSON.stringify(actualizado));
    setPedidos({ ...nuevos });
  };

  const handleArrowBack = () => {
    router.push('/restaurante/usuarios/');
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <ArrowLeft
        onClick={handleArrowBack}
        className="text-[#05264E] text-base cursor-pointer mb-4"
      />

      <h1 className="text-3xl font-bold mb-8 text-center text-[#00A7E1]">
        Pedidos pendientes
      </h1>

      {Object.keys(pedidos).length === 0 && (
        <div className="text-center text-gray-500">No hay pedidos activos</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Object.entries(pedidos).map(([mesaKey, pedido]) => {
          const mesaNum = mesaKey.replace('pedido-mesa-', '');
          const items = Object.values(pedido.items)
            .flat()
            .filter((i) => i.quantity > 0);

          return (
            <div
              key={mesaKey}
              className="rounded-2xl border-2 border-gray-300 shadow p-4 flex flex-col gap-3"
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
                      <span className="font-semibold">x{item.quantity}</span>
                    </div>
                    {item.nota && (
                      <div className="text-xs text-gray-600 italic mt-1">
                        Nota: {item.nota}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <div className="text-sm font-medium mb-2">
                  Estado: <span className="font-bold">{pedido.estado}</span>
                </div>
                <div className="flex gap-2">
                  {pedido.estado === 'PENDIENTE' && (
                    <button
                      className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"
                      onClick={() => handleEstadoChange(mesaKey, 'EN PROCESO')}
                    >
                      <Play size={16} /> Empezar
                    </button>
                  )}
                  {pedido.estado === 'EN PROCESO' && (
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1"
                      onClick={() => handleEstadoChange(mesaKey, 'FINALIZADO')}
                    >
                      <CheckCircle size={16} /> Finalizar
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
