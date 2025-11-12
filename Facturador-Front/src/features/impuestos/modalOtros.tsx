'use client';
import React, { useEffect, useState } from 'react';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
}

const ImpuestosModalOtros: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  id,
}) => {
  const handleBackgroundClick = () => {
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Bloquea el scroll cuando el modal está abierto
    } else {
      document.body.style.overflow = ''; // Restaura el scroll cuando se cierra
    }

    return () => {
      document.body.style.overflow = ''; // Asegura que el scroll se restablezca al desmontar
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick}
    >
      <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
        <div
          className="relative bg-white p-6 rounded-2xl shadow-lg w-[600px] overflow-y-auto transition-all duration-300 transform scale-95 opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de cierre */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>

          {/* Título */}
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center ">
            Otros
          </h1>

          {/* Contenedor de botones con mejor separación */}
          <div className="flex flex-col gap-4">
            {/* Botón Editar */}
            <button
              //   onClick={() => setOpenContratoForm(true)}
              className="w-full bg-[#00A7E1] font-semibold text-white py-2 text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#008ec1] focus:outline-none focus:ring-2 focus:ring-[#00A7E1] focus:ring-opacity-50 rounded-full"
            >
              Recibo
            </button>

            {/* Botón Adjuntar Archivo */}
            <button
              //   onClick={() => setOpenAdjuntarArchivos(true)}
              className="w-full bg-[#00A7E1] font-semibold text-white py-2 text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#008ec1] focus:outline-none focus:ring-2 focus:ring-[#00A7E1] focus:ring-opacity-50 rounded-full"
            >
              Papeles de Auditoria
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpuestosModalOtros;
