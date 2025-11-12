'use client';

import React, { useState } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import { useRouter } from 'next/navigation';

interface Card {
  id: string;
  name: string;
  descripcion: string;
  number: string;
  image: string;
}

const dashboardModules: Card[] = [
  {
    id: 'usuarios',
    name: 'Usuarios',
    descripcion: 'Administrar usuarios y roles',
    number: '001',
    image: 'https://img.icons8.com/fluency/240/user-group-man-man.png',
  },
  {
    id: 'proveedores',
    name: 'Proveedores',
    descripcion: 'Administrar proveedores y sus categorias',
    number: '002',
    image: 'https://img.icons8.com/3d-fluency/94/supplier.png',
  },
  {
    id: 'materiales', 
    name: 'Materiales', 
    descripcion: 'Recepción de Materiales, registro de entradas de inventario', 
    number: '003',
    image: 'https://img.icons8.com/fluency/48/big-parcel.png', 
  },
  {
    id: 'productos',
    name: 'Productos',
    descripcion: 'Gestión de productos, variantes y categorías',
    number: '004',
    image: 'https://img.icons8.com/dusk/512/product.png',
  },
  {
    id: 'ubicaciones', 
    name: 'Ubicaciones',
    descripcion: 'Gestión de almacenes y zonas',
    number: '005', 
    image: 'https://img.icons8.com/fluency/240/warehouse.png', 
  },
  {
    id: 'inventario',
    name: 'Inventario',
    descripcion: 'Entradas, seriales, ubicaciones',
    number: '006',
    image: 'https://img.icons8.com/3d-fluency/94/move-by-trolley.png',
  },
  {
    id: 'produccion',
    name: 'Producción',
    descripcion: 'Órdenes, insumos y calidad',
    number: '007',
    image: 'https://img.icons8.com/3d-fluency/94/worker-female--v1.png',
  },
  {
    id: 'movimientos',
    name: 'Movimientos',
    descripcion: 'Movimientos por producto o ubicación',
    number: '008',
    image: 'https://img.icons8.com/color/480/track-order.png',
  },
  {
    id: 'ventas',
    name: 'Ventas',
    descripcion: 'Clientes y facturación',
    number: '009',
    image: 'https://img.icons8.com/fluency/240/sales-performance.png',
  },
  {
    id: 'facturas',
    name: 'Facturas',
    descripcion: 'Facturas desde email',
    number: '010',
    image: 'https://img.icons8.com/plasticine/100/billing-machine.png',
  },
  //   {
  //   id: 'ppe',
  //   name: 'PPE',
  //   descripcion: 'Propiedad Planta y Equipo (PPE)',
  //   number: '011',
  //   image: 'https://img.icons8.com/plasticine/100/billing-machine.png',
  // },
  //     {
  //   id: 'activos',
  //   name: 'Activos',
  //   descripcion: ' Registro de Activos Fijos (PPE)',
  //   number: '012',
  //   image: 'https://img.icons8.com/plasticine/100/billing-machine.png',
  // },


];

const InventoryDashboard = () => {
  const [cards, setCards] = useState<Card[]>(dashboardModules);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const router = useRouter();

  const handleDragStart = (id: string) => setDraggedCardId(id);
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => event.preventDefault();
  const handleDrop = (id: string) => {
    if (!draggedCardId || draggedCardId === id) return;

    const newCards = [...cards];
    const draggedIndex = newCards.findIndex((card) => card.id === draggedCardId);
    const targetIndex = newCards.findIndex((card) => card.id === id);

    const [movedCard] = newCards.splice(draggedIndex, 1);
    newCards.splice(targetIndex, 0, movedCard);
    setCards(newCards);
  };

  const handleCardClick = (id: string) => {
    router.push(`/panelProduccion/${id}`);
  };

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-8 w-full">
          <h1 className="text-3xl font-bold text-[#6F6F6F] text-center mb-8">Panel de Producción</h1>
          <div className="flex flex-wrap justify-center gap-6">
            {cards.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={() => handleDragStart(card.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(card.id)}
                onClick={() => handleCardClick(card.id)}
                className="w-64 bg-white p-5 rounded-2xl shadow hover:shadow-xl cursor-pointer border border-gray-200 text-center"
              >
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-36 object-contain mb-3 bg-gray-100 rounded"
                />
                <h2 className="text-xl font-semibold text-gray-700">{card.name}</h2>
                <p className="text-sm text-gray-500">{card.descripcion}</p>
              </div>
            ))}
          </div>
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default InventoryDashboard;
