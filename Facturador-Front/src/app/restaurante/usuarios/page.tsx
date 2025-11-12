'use client';

import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import { useRouter } from 'next/navigation';
import React from 'react';

//Hola
export default function Usuarios() {
  const router = useRouter();

  const handleClick = (donde: string) => {
    switch (donde) {
      case 'meseros':
        router.push('/restaurante/meseros/mesas');
        break;
      case 'cocineros':
        router.push('/restaurante/cocineros');
        break;
      case 'admin':
        showErrorToast('Aun en proceso de desarrollo');
        // router.push('/restaurante/admin');
        break;
      case 'caja':
        router.push('/restaurante/caja');
        break;
      default:
        console.warn('Destino no reconocido:', donde);
    }
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-[#00A7E1]">
        Selecciona un Usuario
      </h1>

      <div className="flex flex-col gap-6 w-[50%] mx-auto">
        {['meseros', 'caja', 'cocineros', 'admin'].map((rol) => (
          <button
            key={rol}
            onClick={() => handleClick(rol)}
            className="rounded-2xl border-4 border-[#00A7E1] hover:border-blue-700 hover:bg-blue-50 transition-all p-6 text-xl font-bold text-[#00A7E1] shadow-md capitalize"
          >
            {rol}
          </button>
        ))}
      </div>
    </div>
  );
}
