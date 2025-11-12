import React, { useEffect, useState } from 'react';
import DatePickerInput from '@/components/ui/DatePickerInput';
import { useInformesStore } from '@/store/useInformesStore';
import { useNotasCreditoStore } from '@/store/useNotasCreditoStore';
import SelectConSearch from '@/components/ui/selectConSearch';
import { useClientStore } from '@/store/useClientStore';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { useFacturaStore } from '@/store/useFacturaStore';
import { showErrorToast } from '@/components/feedback/toast';
import { useInformesExogenasStore } from '@/store/useInformesExogenas';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface FormExogenas {
  cliente: string;
  year: string;
  anuladas: string;
  opciones: string;
  informe: string;
  desde: string;
  hasta: string;
  desde2: string;
  hasta2: string;
}

// const informes = ['Informe 1006', 'Informe 1005', 'Informe 1007'];
const informes = ['Informe 1006', 'Informe 1007'];

export const MilSeisModal: React.FC<ModalFormProps> = ({ isOpen, onClose }) => {
  const { informe1006, informe1005, informe1007 } = useInformesExogenasStore();

  const handleBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    onClose();
  };

  const [formData, setFormData] = useState({
    year: '',
    informe: '',
  });

  const [errors, setErrors] = useState({
    year: false,
    informe: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos
    const newErrors = {
      year: !formData.year || !/^\d{4}$/.test(formData.year),
      informe: formData.informe === '',
    };

    //Seteamos los errores
    setErrors(newErrors);

    // Verificar si hay algún error
    const hasErrors = Object.values(newErrors).some((val) => val);

    if (hasErrors) {
      showErrorToast('Hay Errores en el Formulario');
      return; // No enviar si hay errores
    }

    // Enviar formulario
    switch (formData.informe) {
      case 'Informe 1006':
        informe1006(formData.year);
        break;
      case 'Informe 1005':
        informe1005(formData.year);
        break;
      case 'Informe 1007':
        informe1007(formData.year);
        break;
      default:
        console.error('Informe no reconocido:', formData.informe);
        break;
    }

    setFormData({
      year: '',
      informe: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick} // Detecta clic en el fondo
    >
      <div className="fixed inset-0 flex justify-center items-center z-51 bg-black bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <h2 className="text-xl font-bold mb-4 text-[#6F6F6F]">Informes</h2>

          <div className="relative mt-4">
            <SimpleSelect
              options={informes}
              width={'100%'}
              value={formData.informe}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  informe: value,
                }));
                setErrors((prev) => ({
                  ...prev,
                  informe: !value,
                }));
              }}
              error={errors.informe}
            />
          </div>

          {/* Año */}
          <div>
            <label className="block text font-montserrat font-normal text-sm text-[#6F6F6F] mt-4">
              Año
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              className={`w-full h-10 px-4 border mt-5 rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 border-[#00A7E1] focus:outline-none shadow-sm ${
                errors.year ? 'border-red-500' : ''
              }`}
              value={formData.year}
              onChange={(e) => {
                const value = e.target.value;

                // Solo permitir dígitos del 0 al 9
                const onlyNumbers = value.replace(/\D/g, '');

                setFormData((prev) => ({
                  ...prev,
                  year: onlyNumbers,
                }));

                setErrors((prev) => ({ ...prev, year: !onlyNumbers }));
              }}
            />
          </div>

          {/* Botones cancelar y enviar */}
          <div className="flex justify-end space-x-3 mt-6 ">
            <button
              type="button"
              onClick={handleBackgroundClick}
              className="bg-[#333332] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-auto"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="bg-[#00A7E1] text-white w-24 h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1]"
            >
              Crear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
