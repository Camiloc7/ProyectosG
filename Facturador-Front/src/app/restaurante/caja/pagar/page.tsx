'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { PedidoMesa } from '../page';
import PrivateRoute from '@/helpers/PrivateRoute';
import AdminLayoutRestaurante from '../../AdminLayout';

interface Item {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export default function PagarVistaRestaurante() {
  const router = useRouter();
  const [mesa, setMesa] = useState<string>('1');
  const [itemsToPay, setItemsToPay] = useState<Item[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pedidos, setPedidos] = useState<Record<string, PedidoMesa>>({});
  const [pedidoAPagar, setPedidoAPagar] = useState<PedidoMesa | null>(null);

  // Carga inicial de pedidos desde localStorage
  useEffect(() => {
    const nuevosPedidos: Record<string, PedidoMesa> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('pedido-mesa-')) continue;

      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;

        const data = JSON.parse(raw);
        nuevosPedidos[key] = {
          estado: data.estado ?? 'PENDIENTE',
          items: data.items ?? {},
        };
      } catch (e) {
        console.error('Error leyendo pedido:', key);
      }
    }

    setPedidos(nuevosPedidos);
    const mesaStorage = localStorage.getItem('pago-mesa') ?? '';
    setMesa(mesaStorage);
  }, []);

  // Cuando cambia la mesa o los pedidos, obtenemos el pedido y preparamos items
  useEffect(() => {
    if (!mesa || !pedidos) return;

    const pedido = pedidos[`pedido-mesa-${mesa}`] || pedidos[mesa];
    if (pedido) {
      setPedidoAPagar(pedido);

      // Transformar items para la lista
      const pizzas = pedido.items.PIZZAS || [];
      const lista: Item[] = pizzas.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        quantity: p.quantity,
      }));
      setItemsToPay(lista);

      // Calcular total
      const calcTotal = lista.reduce(
        (sum, it) => sum + it.price * it.quantity,
        0
      );
      setTotal(calcTotal);
    } else {
      console.warn('No se encontró el pedido para la mesa:', mesa);
    }
  }, [mesa, pedidos]);

  const handlePagar = () => {
    const key = `pedido-mesa-${mesa}`;
    localStorage.removeItem(key);
    alert(`💰 Pedido de la mesa ${mesa} pagado. Total: $${total.toFixed(2)}`);
    router.push('/restaurante/caja/');
  };

  return (
    <PrivateRoute>
      <AdminLayoutRestaurante>
        <div className="p-8 bg-gray-50 min-h-screen space-y-6">
          <ArrowLeft
            onClick={() => router.back()}
            className="text-[#05264E] text-base cursor-pointer mb-4"
          />

          <h1 className="text-3xl font-bold text-center text-[#00A7E1]">
            Resumen de Pago - Mesa {mesa}
          </h1>

          <div className="space-y-4">
            {itemsToPay.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-white p-4 rounded-lg shadow"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} x ${item.price.toFixed(2)}
                  </p>
                </div>
                <p className="font-bold">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <p className="text-xl font-semibold">Total:</p>
              <p className="text-xl font-bold">${total.toFixed(2)}</p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={handlePagar}
              className="mt-6 px-8 py-3 bg-green-500 text-white font-semibold rounded-lg shadow hover:bg-green-600 transition"
            >
              Pagar
            </button>
          </div>
        </div>
      </AdminLayoutRestaurante>
    </PrivateRoute>
  );
}
