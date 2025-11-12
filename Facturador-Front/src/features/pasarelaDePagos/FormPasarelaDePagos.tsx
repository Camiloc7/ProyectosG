import React, { useState, useEffect } from 'react';
import {
  validateSeleccionMultiple,
  validateEntradasNumericas,
  validateTextos,
} from '@/app/gestionDeFacturasElectronicas/validations';
import SimpleSelect from '@/components/ui/SimpleSelect';

import { FormPasarelaDePagos, InfoClientes } from '@/types/types';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';
import { usePasarelaStore } from '@/store/usePasarelaStore';

interface ModalFormProps {
  isOpen: boolean;
  id: string;
  moneda: string;
  precio: string;
  plan: string | null;
  tiempo: string;
  onClose: () => void;
  clienteExistente?: InfoClientes | null;
}

interface Errors {
  tipoDeDocumento: boolean;
  documento: boolean;
}

const FormCreacionCliente: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  plan,
  tiempo,
  moneda,
  id,
  precio,
}) => {
  const { fetchTiposDeDocumentos, documentos } = useDatosExtraStore();
  const { sendConfirmacionDePago } = usePasarelaStore();
  useEffect(() => {
    fetchTiposDeDocumentos();
  }, []);

  const [formData, setFormData] = useState<FormPasarelaDePagos>({
    tipoDeDocumento: '',
    documento: '',
  });

  const [errors, setErrors] = useState<Errors>({
    tipoDeDocumento: false,
    documento: false,
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
      tipoDeDocumento: validateSeleccionMultiple,
      documento: validateEntradasNumericas,
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

    const isTipoDeDocumentoValid = validateTextos(formData.tipoDeDocumento);
    const isDocumentoValid = validateTextos(formData.documento);

    errorState.tipoDeDocumento = !isTipoDeDocumentoValid;
    errorState.documento = !isDocumentoValid;

    setErrors(errorState);

    const hasErrors = Object.values(errorState).some((value) => value);

    if (hasErrors) {
      return;
    }

    await sendConfirmacionDePago(formData, id);
    // onClose();
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
          className="bg-white p-10 rounded-md shadow-md w-[800px] max-h-[100vh] overflow-y-auto scroll-smooth"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <h2 className="text-2xl font-bold mb-4 text-gray-800">
            Confirmación de Pago.
          </h2>
          {/* Resumen del plan */}
          <div className="bg-gray-50 p-4 rounded-md mb-6 flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-[#00A7E1]">{plan}</p>
              <p className="text-sm text-gray-600">{tiempo}</p>
            </div>
            <p className="text-xl font-bold text-[#00A7E1]">
              {`${precio} 
              ${moneda}`}
            </p>
          </div>

          <form autoComplete="off">
            {/* Tipo de Documento */}
            <div className="flex flex-col mt-4 w-full">
              <label>
                Tipo de documento
                <span
                  className={`text-red-500 ${
                    errors.tipoDeDocumento ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className=" relative mt-4">
                {documentos ? (
                  <SimpleSelect
                    options={documentos}
                    placeholder="Seleccione una opcion"
                    width={'100%'}
                    value={formData.tipoDeDocumento}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        tipoDeDocumento: value,
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        tipoDeDocumento: !value,
                      }));
                    }}
                    error={errors.tipoDeDocumento}
                  />
                ) : (
                  ''
                )}
              </div>
            </div>
            {/* Número de Documento */}
            <div className="flex flex-col mt-4">
              <label>
                Numero de documento
                <span
                  className={`text-red-500 ${
                    errors.documento ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="number"
                  name="documento"
                  placeholder="Documento"
                  value={formData.documento}
                  className={`w-full h-10 px-4 border ${
                    errors.documento ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.documento && (
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
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormCreacionCliente;
