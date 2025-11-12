'use client';

import { useEffect } from 'react';
import { MdArrowBack } from 'react-icons/md';
import Promociones from '@/features/landing/Promociones';
import { useRouter } from 'next/navigation';

export default function PasarelaDePagos() {
  const router = useRouter();

  useEffect(() => {
    // Deshabilitar scroll
    document.body.style.overflow = 'hidden';

    return () => {
      // Restaurar scroll cuando el componente se desmonte
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleBack = () => {
    let targetRoute = '/gestionDeFacturasElectronicas'; // Ruta predeterminada
    router.push(targetRoute);
  };

  return (
    <div className="relative flex items-center justify-center h-screen bg-gray-100">
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 text-[#05264E] text-2xl p-2 border rounded"
      >
        <MdArrowBack />
      </button>

      {/* Componente Promociones centrado */}
      <Promociones />
    </div>
  );
}
