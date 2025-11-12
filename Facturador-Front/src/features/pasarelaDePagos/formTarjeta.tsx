import React, { useState } from 'react';
import {
  validateSeleccionMultiple,
  validateEntradasNumericas,
  validateTextos,
} from '@/app/gestionDeFacturasElectronicas/validations';
import { InfoClientes } from '@/types/types';
import type { FormTarjeta } from '@/types/types';
import { usePasarelaStore } from '@/store/usePasarelaStore';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  clienteExistente?: InfoClientes | null;
}

interface Errors {
  nombreDeTarjeta: boolean;
  numeroDeTarjeta: boolean;
  CVC: boolean;
  mesExp: boolean;
  añoExp: boolean;
}

const FormTarjeta: React.FC<ModalFormProps> = ({ isOpen, onClose }) => {
  const { success, sendTarjetaForm } = usePasarelaStore();
  const [formData, setFormData] = useState<FormTarjeta>({
    nombreDeTarjeta: '',
    numeroDeTarjeta: '',
    CVC: '',
    mesExp: '',
    añoExp: '',
  });

  const [errors, setErrors] = useState<Errors>({
    nombreDeTarjeta: false,
    numeroDeTarjeta: false,
    CVC: false,
    mesExp: false,
    añoExp: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Actualizar datos del formulario
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validaciones mapeadas
    const validators: Record<string, (value: string) => boolean> = {
      nombreDeTarjeta: validateTextos,
      numeroDeTarjeta: validateEntradasNumericas,
      CVC: validateTextos,
      mesExp: validateEntradasNumericas,
      añoExp: validateEntradasNumericas,
    };

    // Validar en tiempo real
    if (validators[name]) {
      setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
    }
  };

  const handleSubmit = async (
    event: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    event.preventDefault();
    const errorState = { ...errors };

    Object.keys(errorState).forEach((key) => {
      errorState[key as keyof Errors] = false;
    });

    const isNombreValir = validateTextos(formData.nombreDeTarjeta);
    const isNumeroValid = validateTextos(formData.numeroDeTarjeta);
    const isCVCvalid = validateTextos(formData.CVC);
    const isMesValid = validateTextos(formData.mesExp);
    const isAñoValid = validateTextos(formData.añoExp);

    errorState.nombreDeTarjeta = !isNombreValir;
    errorState.numeroDeTarjeta = !isNumeroValid;
    errorState.CVC = !isCVCvalid;
    errorState.mesExp = !isMesValid;
    errorState.añoExp = !isAñoValid;

    setErrors(errorState);

    const hasErrors = Object.values(errorState).some((value) => value);

    if (hasErrors) {
      return;
    }

    await sendTarjetaForm(formData);
    if (success) {
      setFormData({
        nombreDeTarjeta: '',
        numeroDeTarjeta: '',
        CVC: '',
        mesExp: '',
        añoExp: '',
      });
      onClose();
    }
  };

  const handleBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
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
          <h2 className="text-xl font-bold mb-4">Añadir tarjeta</h2>

          <form>
            {/* Nombre de tarjeta */}
            <div className="flex flex-col mt-4">
              <label>
                Nombre de tarjeta
                <span
                  className={`text-red-500 ${
                    errors.nombreDeTarjeta ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="text"
                  name="nombreDeTarjeta"
                  placeholder="Nombre de la tarjeta"
                  value={formData.nombreDeTarjeta}
                  className={`w-full h-10 px-4 border ${
                    errors.nombreDeTarjeta
                      ? 'border-red-500'
                      : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.nombreDeTarjeta && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>

            {/* Numero */}
            <div className="flex flex-col mt-4">
              <label>
                Numero de la tarjeta
                <span
                  className={`text-red-500 ${
                    errors.numeroDeTarjeta ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="number"
                  name="numeroDeTarjeta"
                  placeholder="Numero de la tarjeta"
                  value={formData.numeroDeTarjeta}
                  className={`w-full h-10 px-4 border ${
                    errors.numeroDeTarjeta
                      ? 'border-red-500'
                      : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.numeroDeTarjeta && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>
            {/* CVC */}
            <div className="flex flex-col mt-4">
              <label>
                CVC
                <span
                  className={`text-red-500 ${errors.CVC ? '' : 'invisible'}`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="text"
                  name="CVC"
                  placeholder="CVC"
                  value={formData.CVC}
                  className={`w-full h-10 px-4 border ${
                    errors.CVC ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.CVC && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>

            {/* Exp Mes */}
            <div className="flex flex-col mt-4">
              <label>
                Mes de expiracion
                <span
                  className={`text-red-500 ${errors.mesExp ? '' : 'invisible'}`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="text"
                  name="mesExp"
                  placeholder="Mes de expiracion"
                  value={formData.mesExp}
                  className={`w-full h-10 px-4 border ${
                    errors.mesExp ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.mesExp && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>

            {/* Año de expiracion */}
            <div className="flex flex-col mt-4">
              <label>
                Año de expiracion
                <span
                  className={`text-red-500 ${errors.añoExp ? '' : 'invisible'}`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="text"
                  name="añoExp"
                  placeholder="Año de expiracion"
                  value={formData.añoExp}
                  className={`w-full h-10 px-4 border ${
                    errors.añoExp ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.añoExp && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>

            {/* Mensaje de error si es que hay */}
            {Object.values(errors).includes(true) && (
              <p className="text-red-500 text-sm flex justify-center mt-4">
                Debe llenar todos campos requeridos.
              </p>
            )}

            {/* Botones cancelar y enviar */}
            <div className="flex justify-end space-x-3 mt-4 ">
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
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormTarjeta;
