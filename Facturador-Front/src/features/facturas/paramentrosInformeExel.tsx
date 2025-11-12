import React, { useState } from 'react';
import DatePickerInput from '../../components/ui/inputFechaCalendario'; // Importa tu componente de calendario
import { useInformesStore } from '@/store/useInformesStore';
import { useNotasCreditoStore } from '@/store/useNotasCreditoStore';

interface ModalFormProps {
  isOpen: boolean;
  from: string;
  onClose: () => void;
}

const ParametrosInformeExel: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  from,
}) => {
  const { informeComparativoExel } = useInformesStore();
  const { informeExelCredito } = useNotasCreditoStore();
  const [formData, setFormData] = useState({
    fechaInicial1: '',
    fechaFinal1: '',
    fechaInicial2: '',
    fechaFinal2: '',
  });

  const handleBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (from === 'creditoLista') {
      informeExelCredito(formData);
    }
    if (from === 'listaDeFacturas') {
      informeComparativoExel(formData);
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
          <h2 className="text-xl font-bold mb-4">Informe Comparativo Exel</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fecha inicial 1 */}
            <div>
              <DatePickerInput
                label="Fecha inicial 1"
                value={formData.fechaInicial1}
                onChange={(value) => handleDateChange('fechaInicial1', value)}
              />
            </div>

            {/* Fecha final 1 */}
            <div>
              <DatePickerInput
                label="Fecha final 1"
                value={formData.fechaFinal1}
                onChange={(value) => handleDateChange('fechaFinal1', value)}
              />
            </div>

            {/* Fecha inicial 2 */}
            <div>
              <DatePickerInput
                label="Fecha inicial 2"
                value={formData.fechaInicial2}
                onChange={(value) => handleDateChange('fechaInicial2', value)}
              />
            </div>

            {/* Fecha final 2 */}
            <div>
              <DatePickerInput
                label="Fecha final 2"
                value={formData.fechaFinal2}
                onChange={(value) => handleDateChange('fechaFinal2', value)}
              />
            </div>

            {/* Botones cancelar y enviar */}
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

export default ParametrosInformeExel;
