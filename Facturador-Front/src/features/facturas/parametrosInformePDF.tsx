import React, { useState } from 'react';
import DatePickerInput from '@/components/ui/inputFechaCalendario';
import { useInformesStore } from '@/store/useInformesStore';
import { useNotasCreditoStore } from '@/store/useNotasCreditoStore';

interface ModalFormProps {
  isOpen: boolean;
  itsFrom: string;
  onClose: () => void;
  title?: string; // Nuevo: título opcional por props
  onSubmitData?: (data: { fechaInicial: string; fechaFinal: string }) => void; // Nuevo: función callback
}

const ParametrosInformePDF: React.FC<ModalFormProps> = ({
  isOpen,
  itsFrom,
  onClose,
  title = 'Informe Comparativo PDF', // Valor por defecto
  onSubmitData,
}) => {
  const { informeComparativoPDF } = useInformesStore();
  const { informePDFCredito } = useNotasCreditoStore();

  const [formData, setFormData] = useState({
    fechaInicial: '',
    fechaFinal: '',
  });

  const handleBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Callback si está definida
    if (onSubmitData) {
      onSubmitData(formData);
    }

    // Comportamiento existente
    if (itsFrom === 'listaDeFacturas') {
      informeComparativoPDF(formData);
    }
    if (itsFrom === 'listaNotasCredito') {
      informePDFCredito(formData);
    }

    onClose();
  };

  const handleDateChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick}
    >
      <div className="fixed inset-0 flex justify-center items-center z-51 bg-black bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold mb-4">{title}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fecha inicial */}
            <div>
              <DatePickerInput
                label="Fecha inicial"
                value={formData.fechaInicial}
                onChange={(value) => handleDateChange('fechaInicial', value)}
              />
            </div>

            {/* Fecha final */}
            <div>
              <DatePickerInput
                label="Fecha final"
                value={formData.fechaFinal}
                onChange={(value) => handleDateChange('fechaFinal', value)}
              />
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-3 mt-4">
              <button
                type="button"
                onClick={handleBackgroundClick}
                className="bg-[#333332] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="bg-[#00A7E1] text-white w-24 h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1]"
              >
                Crear
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ParametrosInformePDF;
