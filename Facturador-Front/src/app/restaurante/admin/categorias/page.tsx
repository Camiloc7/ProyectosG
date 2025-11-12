'use client';

import React, { useState } from 'react';
import PrivateRoute from '@/helpers/PrivateRoute';
import { useRouter } from 'next/navigation';
import { FaPlus } from 'react-icons/fa';
import AdminLayoutRestaurante from '../../AdminLayout';

interface Card {
  id: string;
  name: string;
  number: string;
  image: string;
}

const initialCards: Card[] = [
  {
    id: '1',
    name: 'Vinos',
    number: '001',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLYsxeP9V06q5nHA6Ba5kKUKPX-nVsQuVnFw&s',
  },
  {
    id: '2',
    name: 'Refrescos',
    number: '002',
    image:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSo3_sR3jN_ctb3uVB_WVQa3PxgSgMjRgwwmw&s',
  },
  {
    id: '3',
    name: 'Carnes',
    number: '003',
    image:
      'https://www.elespectador.com/resizer/v2/4AHOTYI7XZAU3IPSHIYSY66WAU.jpg?auth=0336c7e822ad45f7f1c14054c6170b1b123d942726dcc9a30b99c5b98c71b2a6&width=920&height=613&smart=true&quality=60',
  },
  {
    id: '4',
    name: 'Snacks',
    number: '004',
    image:
      'https://www.justspices.es/media/recipe/resized/510x510/recipe/tabla-snacks-dulces.jpg',
  },
  {
    id: '0',
    name: 'Crear categoría nueva',
    number: '000',
    image: 'https://vanacco.com/wp-content/uploads/2020/06/Form-1.jpg',
  },
];

const Categorias = () => {
  const [cards] = useState<Card[]>(initialCards);
  const router = useRouter();

  const handleCardClick = (id: string) => {
    if (id === '0') {
      router.push(`nueva`);
    } else {
      router.push(`/restaurante/admin/menu`);
    }
  };

  return (
    <PrivateRoute>
      <AdminLayoutRestaurante>
        <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-8 w-full">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-[#6F6F6F] text-center mb-6">
            Lista de Categorias
          </h1>
          <div className="flex flex-wrap justify-center gap-4">
            {cards.map((card) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className="w-64 bg-white p-4 rounded-2xl shadow-lg cursor-pointer border border-gray-200 hover:shadow-xl transition"
              >
                <img
                  src={card.image}
                  alt={card.name}
                  className="w-full h-32 object-cover rounded-md bg-gray-100"
                />
                <h2 className="mt-2 text-lg font-semibold text-gray-700">
                  {card.name}
                </h2>
                {card.id === '0' && (
                  <div className="w-full flex items-center justify-center">
                    <div className="w-10 h-10 flex items-center justify-center bg-green-600 rounded-full mt-2">
                      <FaPlus className="text-white text-3xl" />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </AdminLayoutRestaurante>
    </PrivateRoute>
  );
};

export default Categorias;
