'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { data, Item } from '../../data';
import { ArrowLeft } from 'lucide-react';

export default function Restaurante() {
  const categories = Object.keys(data);
  const [activeCat, setActiveCat] = useState<string>(categories[0]);
  const [mesa, setMesa] = useState<string>('1');
  const [pedido, setPedido] = useState<Record<string, Item[]>>({});
  const [status, setStatus] = useState<'INICIADO' | 'PENDIENTE'>('INICIADO');
  const router = useRouter();

  // Al montar: obtener mesa y pedido almacenado
  useEffect(() => {
    const mesaStorage = localStorage.getItem('mesa') || '1';
    setMesa(mesaStorage);

    const pedidoGuardado = localStorage.getItem(`pedido-mesa-${mesaStorage}`);
    if (pedidoGuardado) {
      setPedido(JSON.parse(pedidoGuardado));
    } else {
      const nuevoPedido: Record<string, Item[]> = {};
      categories.forEach((cat) => {
        nuevoPedido[cat] = data[cat].map((i) => ({ ...i, quantity: 0 }));
      });
      setPedido(nuevoPedido);
    }
  }, []);

  // Alternar estado cada 3s
  useEffect(() => {
    const timer = setInterval(() => {
      setStatus((prev) => (prev === 'INICIADO' ? 'PENDIENTE' : 'INICIADO'));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const items = pedido[activeCat] || [];

  const updateItemQuantity = (id: number, delta: number) => {
    const updatedItems = items.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
        : item
    );
    setPedido({ ...pedido, [activeCat]: updatedItems });
  };

  const total = Object.values(pedido)
    .flat()
    .reduce((sum, item) => sum + item.quantity * item.price, 0);

  const readyCount = Object.values(pedido)
    .flat()
    .filter((i) => i.quantity > 0).length;

  const handleArrowBack = () => {
    router.push('/restaurante/meseros/mesas');
  };

  const handleGenerarPedido = () => {
    const pedidoFiltrado: Record<string, Item[]> = {};

    for (const cat of categories) {
      const itemsValidos = pedido[cat].filter((item) => item.quantity > 0);
      if (itemsValidos.length > 0) {
        pedidoFiltrado[cat] = itemsValidos;
      }
    }

    if (Object.keys(pedidoFiltrado).length === 0) {
      alert('No se puede generar un pedido vacío');
      return;
    }

    localStorage.setItem(`pedido-mesa-${mesa}`, JSON.stringify(pedidoFiltrado));

    // Agregamos al historial de cocina
    const pedidos = JSON.parse(
      localStorage.getItem('pedidos-generados') || '[]'
    );
    pedidos.push({
      mesa,
      timestamp: Date.now(),
      estado: 'pendiente',
      pedido: pedidoFiltrado,
    });
    localStorage.setItem('pedidos-generados', JSON.stringify(pedidos));

    alert(`✅ Pedido generado para la mesa ${mesa}`);
    router.push('/restaurante/meseros/mesas');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <ArrowLeft
        onClick={handleArrowBack}
        className="text-[#05264E] text-base cursor-pointer mb-4"
      />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="text-lg font-semibold">
          TOTAL: <span className="text-blue-600">${total}</span>
        </div>

        <div className="text-lg font-semibold text-blue-600">Mesa {mesa}</div>

        <div className="text-lg font-medium">
          Estado:{' '}
          <span
            className="px-2 py-1 rounded font-medium"
            style={{
              background: status === 'INICIADO' ? '#E0F3FF' : '#FFF4E0',
              color: status === 'INICIADO' ? '#007ACC' : '#FF8C00',
            }}
          >
            {status}
          </span>
        </div>

        <div className="text-lg font-medium">
          Listos: <span className="text-blue-600">{readyCount}</span>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-4 mb-6 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`px-4 py-2 rounded-lg font-medium border-2 ${
              activeCat === cat
                ? 'border-blue-500 bg-blue-50 text-blue-600'
                : 'border-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((item) => {
          const border = item.quantity > 0 ? '#00A7E1' : '#CCCCCC';

          const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const updatedItems = items.map((i) =>
              i.id === item.id ? { ...i, nota: e.target.value } : i
            );
            setPedido({ ...pedido, [activeCat]: updatedItems });
          };

          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl border-2 flex flex-col items-center"
              style={{ borderColor: border }}
            >
              <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={() => updateItemQuantity(item.id, -1)}
                  className="px-3 py-1 border rounded-lg"
                >
                  −
                </button>
                <span className="text-lg font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateItemQuantity(item.id, 1)}
                  className="px-3 py-1 border rounded-lg"
                >
                  +
                </button>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Precio: ${item.price}
              </div>
              {item.quantity > 0 && (
                <input
                  type="text"
                  placeholder="Agregar nota (sin azúcar, etc)"
                  value={item.nota || ''}
                  onChange={handleNoteChange}
                  className="w-full text-sm border rounded px-2 py-1"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex justify-between mt-8">
        <button
          className="px-6 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:bg-gray-100"
          onClick={handleArrowBack}
        >
          CANCELAR
        </button>
        <button
          className="px-6 py-3 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700"
          onClick={handleGenerarPedido}
        >
          GENERAR PEDIDO
        </button>
      </div>
    </div>
  );
}
