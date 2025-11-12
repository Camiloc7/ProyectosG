'use client';
import React, { useEffect, useState } from 'react';
import { ListaDeContratos } from '@/types/types';
import FormContrato from './formContrato';
import AdjuntarVerArchivo from '@/components/ui/AdjuntarVerArchivo';
import { useContractStore } from '@/store/useContract';
import AdjuntarArchivoConComentario from '@/components/ui/AjuntarArchivoConComentario';
import { Eye, Paperclip, Pencil, Trash } from 'lucide-react';
import VerArchivosConComentario from '@/components/ui/VerArchivosConComentario';
import { confirm } from '@/components/feedback/ConfirmOption';

interface ModalFormProps {
  isOpen: boolean;
  infoContrato: ListaDeContratos;
  onClose: () => void;
  id: string;
}

const infoFalsa = { ficURL: 'hola.com/holka' };
const ModalAccionesListaContratos: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  infoContrato,
  id,
}) => {
  const { deleteContract } = useContractStore();
  const [openContratoForm, setOpenContratoForm] = useState<boolean>(false);
  const [verIsOpen, setVerIsOpen] = useState<boolean>(false);
  const [openAdjuntarArchivos, setOpenAdjuntarArchivos] =
    useState<boolean>(false);

  const handleBackgroundClick = () => {
    onClose();
  };

  const handleEliminar = async () => {
    const confirmado = await confirm({
      title: '¿Estás seguro de que quieres eliminar este contrato?',
      message: 'Esta acción no se puede deshacer.',
    });
    if (confirmado) {
      deleteContract(id);
      onClose();
    }
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
            Opciones del Contrato
          </h1>

          {/* Contenedor de botones con mejor separación */}
          <div className="flex flex-col gap-4">
            {/* Botón Editar */}
            <button
              onClick={() => setOpenContratoForm(true)}
              className="w-full bg-[#00A7E1] font-semibold text-white py-2 text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#008ec1] focus:outline-none focus:ring-2 focus:ring-[#00A7E1] focus:ring-opacity-50 rounded-full"
            >
              <Pencil className="w-5 h-5" />
              Editar Contrato
            </button>

            {/* Botón Adjuntar Archivo */}
            <button
              onClick={() => setOpenAdjuntarArchivos(true)}
              className="w-full bg-[#00A7E1] font-semibold text-white py-2 text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#008ec1] focus:outline-none focus:ring-2 focus:ring-[#00A7E1] focus:ring-opacity-50 rounded-full"
            >
              <Paperclip className="w-5 h-5" />
              Adjuntar Archivo
            </button>

            {/* Botón Ver Archivos */}
            <button
              onClick={() => setVerIsOpen(true)}
              className="w-full bg-[#00A7E1] font-semibold text-white py-2 text-sm flex items-center justify-center gap-2 transition-all hover:bg-[#008ec1] focus:outline-none focus:ring-2 focus:ring-[#00A7E1] focus:ring-opacity-50 rounded-full"
            >
              <Eye className="w-5 h-5" />
              Ver Archivos
            </button>

            {/* Botón Eliminar Contrato */}
            <button
              onClick={() => handleEliminar()}
              className="w-full bg-red-500 font-bold text-white py-2 text-sm flex items-center justify-center gap-2 transition-all hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded-full"
            >
              <Trash className="w-5 h-5" />
              Eliminar Contrato
            </button>
          </div>
        </div>
      </div>
      <FormContrato
        isOpen={openContratoForm}
        onClose={() => setOpenContratoForm(false)}
        from={'actualizar'}
        infoContrato={infoContrato}
        id={id}
        closeAcciones={onClose}
      />

      <AdjuntarArchivoConComentario
        isOpen={openAdjuntarArchivos}
        onClose={() => setOpenAdjuntarArchivos(false)}
      />
      <VerArchivosConComentario
        isOpen={verIsOpen}
        onClose={() => setVerIsOpen(false)}
      />
    </div>
  );
};

export default ModalAccionesListaContratos;
