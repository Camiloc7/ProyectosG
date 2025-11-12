'use client';

import React, { useState } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import { useRouter } from 'next/navigation';
import { MdArrowBack } from 'react-icons/md';

interface Card {
  id: string;
  name: string;
  subname: string;
  number: string;
  image: string;
}

const initialCards: Card[] = [
  {
    id: '1',
    name: 'Formulario 300',
    subname: 'Declaracion del impuesto Nacional Al Consumo ',
    number: '001',
    image: '/images/tax2.png',
  },
  {
    id: '2',
    name: 'Formulario 301',
    subname: '-----',
    number: '002',
    image: '/images/tax1.png',
  },
  {
    id: '3',
    name: 'Formulario 110',
    subname: 'Renta Personas Juridicas y Naturales sin Residencia',
    number: '003',
    image: '/images/tax3.png',
  },
  {
    id: '4',
    name: 'Distritales',
    subname: '-----',
    number: '004',
    image: '/images/tax4.png',
  },
];

const CalendarioTributario = () => {
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const router = useRouter();

  const handleDragStart = (id: string) => {
    setDraggedCardId(id);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (id: string) => {
    if (!draggedCardId || draggedCardId === id) return;

    const newCards = [...cards];
    const draggedIndex = newCards.findIndex(
      (card) => card.id === draggedCardId
    );
    const targetIndex = newCards.findIndex((card) => card.id === id);

    const [movedCard] = newCards.splice(draggedIndex, 1);
    newCards.splice(targetIndex, 0, movedCard);
    setCards(newCards);
  };

  const handleCardClick = (id: string) => {
    router.push(`/impuestos/${id}`);
  };

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-8 w-full">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#6F6F6F] text-center mb-6">
            Calendario Tributario
          </h1>
          <div className="flex flex-wrap justify-center gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={() => handleDragStart(card.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(card.id)}
                onClick={() => handleCardClick(card.id)}
                className="w-64 bg-white p-4 rounded-2xl shadow-lg cursor-pointer border border-gray-200 hover:shadow-xl transition"
              >
                <img
                  src={
                    'https://vanacco.com/wp-content/uploads/2020/06/Form-1.jpg'
                  }
                  alt={card.name}
                  className="w-full h-32 object-cover rounded-md"
                />
                <h2 className="mt-2 text-lg font-semibold text-gray-700">
                  {card.name}
                </h2>
                <p className="text-gray-500">{card.subname}</p>
                {/* <span className="text-sm text-gray-400">#{card.number}</span> */}
              </div>
            ))}
          </div>
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default CalendarioTributario;
