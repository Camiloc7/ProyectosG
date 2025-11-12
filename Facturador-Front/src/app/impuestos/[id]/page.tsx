'use client';

import React, { useState } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/OnlyAdminRoute';
import { useParams } from 'next/navigation';
import { MdArrowBack } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import ImpuestosModalOtros from '@/features/impuestos/modalOtros';

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
    subname: 'Personas Naturales',
    number: '002',
    image: '/images/tax1.png',
  },
  {
    id: '3',
    name: 'Formulario 110',
    subname: 'Obligaciones Mensuales',
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

interface TaxCard {
  id: string;
  taxNumber: string;
  taxName: string;
  frequency: 'Anual' | 'Mensual';
  presentationDate: string;
  image: string;
}

const initialTaxCards: TaxCard[] = [
  {
    id: '1',
    taxNumber: '001',
    taxName: 'Impuesto Sobre la Renta',
    frequency: 'Anual',
    presentationDate: '28-agosto-2025',
    image: '/images/tax1.png',
  },
  {
    id: '2',
    taxNumber: '002',
    taxName: 'IVA',
    frequency: 'Mensual',
    presentationDate: '15-septiembre-2025',
    image: '/images/tax2.png',
  },
  {
    id: '3',
    taxNumber: '003',
    taxName: 'Impuesto Predial',
    frequency: 'Anual',
    presentationDate: '30-octubre-2025',
    image: '/images/tax3.png',
  },
  {
    id: '4',
    taxNumber: '004',
    taxName: 'Impuesto de Timbre',
    frequency: 'Mensual',
    presentationDate: '05-noviembre-2025',
    image: '/images/tax4.png',
  },
];

const CardPage = () => {
  // useParams está disponible si en el futuro necesitas trabajar con parámetros de URL.
  const { id } = useParams();
  const safeId = Array.isArray(id) ? id[0] : id ?? '';
  const [isOtrosOpen, setIsOtrosOpen] = useState(false);
  const [cards, setCards] = useState<TaxCard[]>(initialTaxCards);
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);
  const router = useRouter();

  const handleDragStart = (id: string) => {
    setDraggedCardId(id);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
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

  // Handlers de los botones (por ahora solo loguean la acción)
  const handleDownload = (card: TaxCard) => {};

  const handleCorrect = (card: TaxCard) => {};

  const handlePay = (card: TaxCard) => {};

  const handleLiquidad = (card: TaxCard) => {};

  const handleBack = () => {
    let targetRoute = '/calendario/'; // Ruta predeterminada
    router.push(targetRoute);
  };

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-8 w-full min-h-screen">
          <div className="flex items-center mb-6 text-xl md:text-2xl lg:text-3xl font-bold text-[#6F6F6F]">
            <button onClick={handleBack} className="mr-4">
              <MdArrowBack />
            </button>
            <h1 className="flex-grow text-center">{`Lista de Impuestos del formulario ${id}`}</h1>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {cards.map((card) => (
              <div
                key={card.id}
                draggable
                onDragStart={() => handleDragStart(card.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(card.id)}
                className="w-80 bg-white p-4 rounded-xl shadow-md cursor-move border border-gray-200 hover:shadow-lg transition"
              >
                <div className="mt-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    {card.taxName}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Impuesto N°: {card.taxNumber}
                  </p>
                  <p className="text-sm text-gray-500">
                    Frecuencia: {card.frequency}
                  </p>
                  <p className="text-sm text-gray-500">
                    Presentación: {card.presentationDate}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleDownload(card)}
                    className="h-5 w-20 text-xs font-medium font-inter text-[#00A7E1] bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3] flex items-center justify-center overflow-hidden whitespace-nowrap"
                  >
                    Descargar
                  </button>
                  <button
                    onClick={() => handleCorrect(card)}
                    className="h-5 w-20 text-xs font-medium font-inter text-[#008F4C] bg-[#E2FCE5] rounded-[16px] hover:bg-[#E6F5E9] flex items-center justify-center overflow-hidden whitespace-nowrap"
                  >
                    Corregir
                  </button>
                  <button
                    onClick={() => handlePay(card)}
                    className="h-5 w-20 text-xs font-medium font-inter text-[#D7263D] bg-[#FFE3E3] rounded-[16px] hover:bg-[#F8D1D1] flex items-center justify-center overflow-hidden whitespace-nowrap"
                  >
                    Pagar
                  </button>
                  <button
                    onClick={() => handleLiquidad(card)}
                    className="h-5 w-20 text-xs font-medium font-inter text-[#00A7E1] bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3] flex items-center justify-center overflow-hidden whitespace-nowrap"
                  >
                    Liquidar
                  </button>
                  <button
                    onClick={() => setIsOtrosOpen(true)}
                    className="h-5 w-20 text-xs font-medium font-inter text-[#6F6F6F] bg-[#EDEDED] rounded-[16px] hover:bg-[#DADADA] flex items-center justify-center overflow-hidden whitespace-nowrap"
                  >
                    Otros
                  </button>
                </div>
              </div>
            ))}
          </div>

          <ImpuestosModalOtros
            isOpen={isOtrosOpen}
            id={safeId}
            onClose={() => {
              setIsOtrosOpen(false);
            }}
          />
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default CardPage;
