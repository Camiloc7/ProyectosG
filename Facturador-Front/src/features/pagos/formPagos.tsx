'use client';
import React, { useState, useRef, useEffect } from 'react';
import { validateTextos } from '@/app/gestionDeFacturasElectronicas/validations';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import { useContractStore } from '@/store/useContract';
import { usePagosStore } from '@/store/usePagosStore';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  id: string;
}

interface FormData {
  codigoDePago: string;
  fechaDeInicio: string;
}

interface Errors {
  codigoDePago: boolean;
  fechaDeInicio: boolean;
}

const FormPagos: React.FC<ModalFormProps> = ({ isOpen, onClose, id }) => {
  const { sendFormPagada, fetchInfoFormPagos } = usePagosStore();

  const [formData, setFormData] = useState<FormData>({
    codigoDePago: '',
    fechaDeInicio: '',
  });
  const [errors, setErrors] = useState<Errors>({
    codigoDePago: false,
    fechaDeInicio: false,
  });
  const [showCalendarModal, setShowCalendarModal] = useState(false); // Estado para controlar la visibilidad del modal
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && id) fetchInfoFormPagos(id);
  }, [isOpen]);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      // Convertir la fecha a UTC solo cuando se guarde
      const utcDate = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      );
      setFormData((prev) => ({
        ...prev,
        fechaDeInicio: utcDate.toISOString().split('T')[0], // Usar 'YYYY-MM-DD'
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        fechaDeInicio: '', // En caso de null, dejar como cadena vacía
      }));
    }
    setShowCalendarModal(false); // Cierra el modal
  };

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
      numeroDeContrato: validateTextos,

      fechaDeInicio: validateTextos,
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

    // Copiar el estado actual de erroresfecha
    const errorState = { ...errors };

    // Resetear errores antes de la validación
    Object.keys(errorState).forEach((key) => {
      errorState[key as keyof Errors] = false;
    });

    // Validaciones de los campos del formulario
    const isCodigoDePagoValid = validateTextos(formData.codigoDePago);

    // Actualizar estado de errores
    errorState.codigoDePago = !isCodigoDePagoValid;

    // Actualizar el estado de errores en el formulario
    setErrors(errorState);

    // Determinar si hay errores
    const hasErrors = Object.values(errorState).some((value) => value);

    if (hasErrors) {
      console.error('Errores detectados. El formulario no se enviará.');
      return;
    }

    sendFormPagada(formData.fechaDeInicio, formData.codigoDePago, id);

    onClose();
  };

  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick} // Detecta clic en el fondo
    >
      <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
          onClick={(e) => {
            e.stopPropagation(); // Evita que el clic dentro del formulario cierre el modal
          }}
        >
          <h2 className="text-xl font-bold mb-4">Informacion del pago</h2>
          <form>
            {/* Codigo*/}
            <div className="flex-1 mt-4 w-full">
              <label>
                Codigo
                <span
                  className={`text-red-500 ${
                    errors.codigoDePago ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="text"
                  name="codigoDePago"
                  placeholder="Codigo de pago"
                  value={formData.codigoDePago}
                  className={`w-full h-10 px-4 border ${
                    errors.codigoDePago ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.codigoDePago && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>

            {/* Fecha*/}
            <div className="flex-1 w-full relative mt-4">
              <label>Fecha</label>
              <div className="relative mt-4">
                <input
                  ref={inputRef}
                  type="date"
                  name="fechaDeInicio"
                  value={formData.fechaDeInicio} // Esto ya es una cadena (YYYY-MM-DD)
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fechaDeInicio: e.target.value, // Directamente asignar la cadena del input
                    }))
                  }
                  className="w-full h-10 px-4 pr-10 border border-[#00A7E1] text-[#C3C3C3] rounded-[25px] text-sm focus:ring-blue-300 focus:outline-none shadow-sm appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                />

                <Calendar
                  onClick={() => {
                    setShowCalendarModal(true);
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#C3C3C3] cursor-pointer"
                />
              </div>

              {/* Modal de selección de fecha de inicio */}
              {showCalendarModal && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-[201]">
                  <div className="bg-white p-4 rounded-lg shadow-lg w-[90%] sm:w-[250px] md:w-[300px] lg:w-[350px] xl:w-[400px] justify-center">
                    <h2 className="text-center text-lg font-semibold mb-3">
                      Seleccionar Fecha
                    </h2>
                    <div className="justify-center text-center">
                      <DatePicker
                        selected={
                          formData.fechaDeInicio
                            ? new Date(formData.fechaDeInicio + 'T00:00:00') // Usa la zona horaria local en lugar de UTC
                            : null
                        }
                        onChange={handleDateChange}
                        inline
                        className="border border-gray-300 rounded-lg shadow-sm w-full"
                      />
                    </div>
                    <button
                      onClick={() => setShowCalendarModal(false)}
                      className="mt-3 w-full bg-[#00A7E1] text-white py-2 rounded-xl hover:bg-[#0077c2]"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mensaje de error si es que hay */}
            {Object.values(errors).includes(true) && (
              <p className="text-red-500 text-sm flex justify-center mt-4">
                Debe llenar todos campos requeridos.
              </p>
            )}

            {/* Botones de acción */}
            <div className="flex justify-end space-x-3 mt-6">
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
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormPagos;
