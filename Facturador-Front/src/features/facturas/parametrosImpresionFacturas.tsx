import React, { useState } from 'react';
import DatePickerInput from '@/components/ui/inputFechaCalendario'; // Importa tu componente de calendario
import { useInformesStore } from '@/store/useInformesStore';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  from?: string;
}

const ParametrosDeImpresion: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  from,
}) => {
  const { imprimirInformeComparativoPDF } = useInformesStore();
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    fechaInicial: `${currentYear}-01-01`, // Primer día del año actual
    fechaFinal: `${currentYear}-12-31`, // Último día del año actual
  });

  const handleBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    imprimirInformeComparativoPDF(formData);
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
          <h2 className="text-xl font-bold mb-4">{`Imprimir ${
            from === 'contratos' ? 'Contratos' : 'Facturas'
          }`}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Fecha inicial 1 */}
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
                label="Fecha final 2"
                value={formData.fechaFinal}
                onChange={(value) => handleDateChange('fechaFinal', value)}
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

export default ParametrosDeImpresion;
