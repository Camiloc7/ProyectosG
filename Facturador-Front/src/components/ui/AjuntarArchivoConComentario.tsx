'use client';
import React, { useState } from 'react';
import { ListaDeContratos } from '@/types/types';
import AdjuntarVerArchivo from '@/components/ui/AdjuntarVerArchivo';
import { useContractStore } from '@/store/useContract';
import BotonSubirArchivos from './botonSubirArchivos';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdjuntarArchivoConComentario: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
}) => {
  const [openContratoForm, setOpenContratoForm] = useState<boolean>(false);

  const { deleteContract } = useContractStore();
  const [formData, setFormData] = useState({
    descripcion: '',
  });

  const [errors, setErrors] = useState({
    descripcion: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Actualizar datos del formulario
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBackgroundClick = () => {
    onClose();
  };

  const handleSubmit = () => {};

  const handleAdjuntarArchivo = () => {};
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick}
    >
      <div className="fixed inset-0 flex justify-center items-center bg-opacity-50">
        <div
          className="bg-white p-6 rounded-2xl shadow-lg w-[600px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Título Principal */}
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
            Adjuntar Archivo
          </h1>
          <BotonSubirArchivos onSubmit={handleAdjuntarArchivo} />

          {/*campo descripción*/}
          <div className="mt-4">
            <label className="">
              Descripción
              <span
                className={`text-red-500 ${
                  errors.descripcion ? '' : 'invisible'
                }`}
              >
                *
              </span>
            </label>
            <textarea
              name="descripcion"
              placeholder="Descripcion "
              value={formData.descripcion}
              className={`w-full h-28 px-4 border rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm mt-4                 border-[#00A7E1]              placeholder-[#C3C3C3]`}
              onChange={handleChange}
            />
            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 mt-6 mb-20">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#333332] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="bg-[#00A7E1] text-white  h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-auto"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdjuntarArchivoConComentario;
