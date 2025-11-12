'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';

const mesas = Array.from({ length: 12 }, (_, i) => i + 1); // Mesas 1 a 12

export default function VistaMesas() {
  const router = useRouter();

  const handleClick = (mesa: number) => {
    localStorage.setItem('mesa', mesa.toString());
    router.push('/restaurante/meseros/listaDePedidos');
  };

  const handleArrowBack = async () => {
    router.push('/restaurante/usuarios');
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <ArrowLeft
        onClick={handleArrowBack}
        className="text-[#05264E] text-base"
      />
      <h1 className="text-3xl font-bold mb-8 text-center text-blue-700">
        Selecciona una Mesa
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {mesas.map((mesa) => (
          <button
            key={mesa}
            onClick={() => handleClick(mesa)}
            className="rounded-2xl border-4 border-[#00A7E1] hover:border-blue-700 hover:bg-blue-50 transition-all p-6 text-xl font-bold text-[#00A7E1] shadow-md"
          >
            Mesa {mesa}
          </button>
        ))}
      </div>
    </div>
  );
}
