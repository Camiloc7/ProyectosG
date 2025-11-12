'use client';
import React, { useState, useRef, useEffect } from 'react';
import { validateTextos } from '@/app/gestionDeFacturasElectronicas/validations';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import { useContractStore } from '@/store/useContract';
import SimpleSelect from '../../components/ui/SimpleSelect';
import { usePagosStore } from '@/store/usePagosStore';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  clave: string;
  tipoDeCuenta: string;
  id: string;
  numeroDeCuenta: string;
  banco: string;
}

interface Errors {
  clave: boolean;
  tipoDeCuenta: boolean;
  id: boolean;
  numeroDeCuenta: boolean;
  banco: boolean;
}

const tiposDeCuentas = [
  { id: '1', nombre: 'Cuenta de ahorro' },
  { id: '2', nombre: 'Cuenta corriente' },
];

const FormCuenta: React.FC<ModalFormProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<FormData>({
    clave: 'Cargando..',
    tipoDeCuenta: '',
    id: '',
    numeroDeCuenta: '',
    banco: '',
  });
  const [errors, setErrors] = useState<Errors>({
    clave: false,
    tipoDeCuenta: false,
    id: false,
    numeroDeCuenta: false,
    banco: false,
  });
  const [showCalendarModal, setShowCalendarModal] = useState(false); // Estado para controlar la visibilidad del modal
  const inputRef = useRef<HTMLInputElement | null>(null);
  const {
    fetchBancos,
    listaDeBancos,
    crearCuenta,
    fetchCodigoCuentaNueva,
    codigoNuevaCuenta,
    loading,
    error,
  } = usePagosStore();

  useEffect(() => {
    fetchBancos();
    fetchCodigoCuentaNueva();
  }, []);

  useEffect(() => {
    if (codigoNuevaCuenta) {
      setFormData((prev) => ({ ...prev, clave: codigoNuevaCuenta }));
    }
  }, [codigoNuevaCuenta]);

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
      clave: validateTextos,
      tipoDeCuenta: validateTextos,
      id: validateTextos,
      numeroDeCuenta: validateTextos,
      fechaDeInicio: validateTextos,
      banco: validateTextos,
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
    const isClaveValid = validateTextos(formData.clave);
    const isTipoDeCuentaValid = validateTextos(formData.tipoDeCuenta);
    const isNumeroDeCuentaValid = validateTextos(formData.numeroDeCuenta);
    const isBancoValid = validateTextos(formData.banco);

    // Actualizar estado de errores
    errorState.clave = !isClaveValid;
    errorState.tipoDeCuenta = !isTipoDeCuentaValid;
    errorState.numeroDeCuenta = !isNumeroDeCuentaValid;
    errorState.banco = !isBancoValid;

    // Actualizar el estado de errores en el formulario
    setErrors(errorState);

    // Determinar si hay errores
    const hasErrors = Object.values(errorState).some((value) => value);

    if (hasErrors) {
      console.error('Errores detectados. El formulario no se enviará.');
      return;
    }

    crearCuenta(formData);

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
          <h2 className="text-xl font-bold mb-4">Creacion de Cuenta</h2>
          <form>
            {/* Tipo de cuenta */}
            <div className="flex-1 mt-4 w-full">
              <label>
                Banco
                <span
                  className={`text-red-500 ${errors.banco ? '' : 'invisible'}`}
                >
                  *
                </span>
              </label>
              <div className=" relative mt-4">
                {listaDeBancos ? (
                  <SimpleSelect
                    options={listaDeBancos}
                    placeholder="Seleccione una opcion"
                    width={'100%'}
                    value={formData.banco}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, banco: value }));
                      setErrors((prev) => ({ ...prev, banco: !value }));
                    }}
                    error={errors.banco}
                  />
                ) : (
                  'Cargando bancos'
                )}
              </div>
            </div>

            {/* Tipo de cuenta */}
            <div className="flex-1 mt-4 w-full">
              <label>
                Tipo de cuenta
                <span
                  className={`text-red-500 ${
                    errors.tipoDeCuenta ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className=" relative mt-4">
                <SimpleSelect
                  options={tiposDeCuentas}
                  placeholder="Seleccione una opcion"
                  width={'100%'}
                  value={formData.tipoDeCuenta}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, tipoDeCuenta: value }));
                    setErrors((prev) => ({ ...prev, tipoDeCuenta: !value }));
                  }}
                  error={errors.tipoDeCuenta}
                />
              </div>
            </div>

            {/* Numero de la cuenta*/}
            <div className="flex-1 mt-4 w-full">
              <label>
                Numero de la cuenta
                <span
                  className={`text-red-500 ${
                    errors.numeroDeCuenta ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="number"
                  name="numeroDeCuenta"
                  placeholder="Numero de la cuenta"
                  value={formData.numeroDeCuenta}
                  className={`w-full h-10 px-4 border ${
                    errors.numeroDeCuenta
                      ? 'border-red-500'
                      : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.numeroDeCuenta && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>

            {/* Clave */}
            <div className="mt-4">
              <label>Clave</label>
              <div className="bg-gray-200 rounded-[20px] p-4 mt-2 text-gray-700">
                <h1>{formData.clave}</h1>
              </div>
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

export default FormCuenta;
