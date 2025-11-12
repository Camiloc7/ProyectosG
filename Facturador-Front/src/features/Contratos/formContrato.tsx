'use client';
import React, { useState, useRef, useEffect } from 'react';
import {
  validateTextos,
  validateEntradasNumericas,
} from '../../app/gestionDeFacturasElectronicas/validations';
import { ArrowLeft, Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { useContractStore } from '@/store/useContract';
import { useClientStore } from '@/store/useClientStore';
import { useRegionesStore } from '@/store/useRegionesStore';
import SelectConSearch from '../../components/ui/selectConSearch';
import { ListaDeContratos } from '@/types/types';
import DatePickerInput from '@/components/ui/DatePickerInput';
import Spinner from '@/components/feedback/Spinner';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import InputField from '@/components/ui/InputField';
import CheckboxUI from '@/components/ui/CheckBoxUI';
import BotonQuality from '@/components/ui/BotonQuality';

const opcionesFIC: string[] = [
  'Mano de obra 1%',
  'A Todo Costo 0.25%',
  'Mensual',
  'No Aplica',
];

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  closeAcciones?: () => void;
  from?: string;
  infoContrato?: ListaDeContratos;
  id?: string;
}

interface Cliente {
  id: string; // o number, dependiendo de cómo esté definido en tu backend
  nombre: string;
}

interface SelectOption {
  value: string;
  label: string;
  id: string | number;
}

// En tu SimpleSelect, actualiza la declaración de props
interface SimpleSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string, selectedOption?: SelectOption) => void;
  placeholder?: string;
  width?: string;
  error?: boolean;
}

interface FormData {
  numeroDeContrato: string;
  descripcion: string;
  correoObra: string;

  valorInicial: number;
  otroSi1: string;
  otroSi2: string;
  otroSi3: string;
  otroSi4: string;
  otroSi5: string;
  disminucion: number;
  valorFinal: number;
  fechaDeInicio: string;
  fechaDeTerminacion: string;
  constructora: string;
  id_cliente: string;
  fic: string;
  ciudadDeObra: string;
  numeroDeEmpleados: string;
}
interface IFormData2 {
  retefuente: number;
  reteica: number;
  retegarantia: number;
  administracion: number;
  imprevistos: number;
  utilidad: number;
}

interface Errors {
  numeroDeContrato: boolean;
  descripcion: boolean;
  correoObra: boolean;
  valorInicial: boolean;
  otroSi1: boolean;
  otroSi2: boolean;
  otroSi3: boolean;
  otroSi4: boolean;
  otroSi5: boolean;
  disminucion: boolean;
  valorFinal: boolean;
  fechaDeInicio: boolean;
  fechaDeTerminacion: boolean;
  constructora: boolean;
  fic: boolean;
  ciudadDeObra: boolean;
  numeroDeEmpleados: boolean;
}

interface Errors2 {
  [key: string]: boolean;
}

const FormContrato: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  from,
  infoContrato,
  id,
  closeAcciones,
}) => {
  const {
    municipios,
    fetchRegiones,
    loading: loadingRegiones,
  } = useRegionesStore();
  const {
    clientes,
    fetchClientes,
    loading: loadingClientes,
    error: errorClientes,
  } = useClientStore();
  const { createContract, updateContract, isLoading } = useContractStore();
  const initialFormData: IFormData2 = {
    retefuente: 0,
    reteica: 0,
    administracion: 0,
    imprevistos: 0,
    utilidad: 0,
    retegarantia: 0,
  };
  const [formData2, setFormData2] = useState<IFormData2>(initialFormData);
  const initialData1 = {
    numeroDeContrato: '',
    utilidad: 0,
    descripcion: '',
    correoObra: '',
    valorInicial: 0,
    otroSi1: '',
    otroSi2: '',
    otroSi3: '',
    otroSi4: '',
    otroSi5: '',
    disminucion: 0,
    valorFinal: 0,
    fechaDeInicio: '',
    fechaDeTerminacion: '',
    constructora: '',
    id_cliente: '',
    fic: '',
    ciudadDeObra: '',
    numeroDeEmpleados: '',
  };
  const [formData, setFormData] = useState<FormData>(initialData1);
  const [errors2, setErrors2] = useState<Errors2>({});

  const [errors, setErrors] = useState<Errors>({
    numeroDeContrato: false,
    descripcion: false,
    correoObra: false,
    valorInicial: false,
    otroSi1: false,
    otroSi2: false,
    otroSi3: false,
    otroSi4: false,
    otroSi5: false,
    disminucion: false,
    valorFinal: false,
    fechaDeInicio: false,
    fechaDeTerminacion: false,
    constructora: false,
    fic: false,
    ciudadDeObra: false,
    numeroDeEmpleados: false,
  });

  useEffect(() => {
    fetchClientes();
    fetchRegiones();
  }, []);

  useEffect(() => {
    const suma =
      Number(formData.valorInicial) +
      Number(formData.otroSi1) +
      Number(formData.otroSi2) +
      Number(formData.otroSi3) +
      Number(formData.otroSi4) +
      Number(formData.otroSi5);

    setFormData((prev) => ({
      ...prev,
      valorFinal: suma,
    }));
  }, [
    formData.valorInicial,
    formData.otroSi1,
    formData.otroSi2,
    formData.otroSi3,
    formData.otroSi4,
    formData.otroSi5,
  ]);

  useEffect(() => {
    if (infoContrato) {
      console.log('Contrato existente:', infoContrato);
      setFormData((prev) => ({
        ...prev,
        numeroDeContrato: infoContrato.numero,
        descripcion: infoContrato.descripcion,
        correoObra: infoContrato.correoObra,
        valorInicial: Number(infoContrato.valorInicial),
        otroSi1: infoContrato.otro1,
        otroSi2: infoContrato.otro2,
        otroSi3: infoContrato.otro3,
        otroSi4: infoContrato.otro4,
        otroSi5: infoContrato.otro5,
        disminucion: Number(infoContrato.disminucion),
        valorFinal: Number(infoContrato.valorFinal),
        fechaDeInicio:
          infoContrato.fechaInicio === '0000-00-00'
            ? ''
            : infoContrato.fechaInicio,
        fechaDeTerminacion:
          infoContrato.fechaFin === '0000-00-00' ? '' : infoContrato.fechaFin,
        constructora: infoContrato.constructora,
        id_cliente: infoContrato.idCliente,
        fic: infoContrato.fic,
        ciudadDeObra: infoContrato.ciudad,
      }));

      setFormData2({
        retefuente: Number(infoContrato.retefuente),
        reteica: Number(infoContrato.reteica),
        administracion: Number(infoContrato.administracion),
        imprevistos: Number(infoContrato.imprevistos),
        utilidad: Number(infoContrato.porcentajeUtilidad),
        retegarantia: Number(infoContrato.reteGarantia),
      });
    }
  }, [infoContrato]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name === 'descripcion' && /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.-]/.test(value)) {
      showErrorToast(
        'No se permiten caracteres especiales (excepto punto y guion)'
      );
      return;
    }

    // Actualizar datos del formulario
    setFormData((prev) => ({
      ...prev,
      [name]: value || '', // Usa una cadena vacía si el valor es undefined
    }));
    // Validaciones mapeadas
    const validators: Record<string, (value: string) => boolean> = {
      numeroDeContrato: validateTextos,
      descripcion: validateTextos,
      correoObra: validateTextos,
      valorInicial: validateEntradasNumericas,
      otroSi1: validateTextos,
      otroSi2: validateTextos,
      otroSi3: validateTextos,
      otroSi4: validateTextos,
      otroSi5: validateTextos,
      disminucion: validateEntradasNumericas,
      valorFinal: validateEntradasNumericas,
      fechaDeInicio: validateTextos,
      fechaDeTerminacion: validateTextos,
      constructora: validateTextos,
      fic: validateTextos,
      ciudadDeObra: validateTextos,
      numeroDeEmpleados: validateTextos,
    };

    // Validar en tiempo real
    if (validators[name]) {
      setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
    }
  };

  const handleReset = () => {
    setFormData(initialData1);
    setFormData2(initialFormData);
  };

  const requiredFields = [
    'retefuente',
    'reteica',
    'administracion',
    'imprevistos',
    'utilidad',
    'retegarantia',
    'aiu',
  ];

  const validateField = (name: string, value: string | boolean): boolean => {
    // Validación de campos requeridos
    if (
      requiredFields.includes(name) &&
      typeof value === 'string' &&
      value.trim() === ''
    ) {
      return true;
    }
    if (name == 'aiu') return false;

    // Validación de rango para números (0 a 100)
    if (typeof value === 'string' && !isNaN(Number(value))) {
      const num = Number(value);
      if (num < 0 || num > 100) return true; // error si está fuera de rango
    }

    return false; // No hay error
  };

  const handleChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;

    // Limitar entre 0 y 100
    if (!isNaN(Number(value)) && name !== 'aiu') {
      const num = Number(value);
      if (num > 100) newValue = '100';
      if (num < 0) newValue = '0';
    }

    setFormData2((prev) => ({ ...prev, [name]: newValue }));

    // Validación en tiempo real
    const hasError = validateField(name, newValue);
    setErrors2((prev) => ({ ...prev, [name]: hasError }));
  };

  // Cambia el tipo de evento a FormEvent para que coincida con el tipo esperado
  const handleSubmit = async (
    event: React.MouseEvent<HTMLButtonElement>
  ): Promise<void> => {
    event.preventDefault();

    // Copiar el estado actual de errores
    const errorState = { ...errors };

    // Resetear errores antes de la validación
    Object.keys(errorState).forEach((key) => {
      errorState[key as keyof Errors] = false;
    });

    // Validaciones de los campos del formulario
    const isNumeroDeContratoValid = validateTextos(formData.numeroDeContrato);
    const isDescripcionValid = validateTextos(formData.descripcion);
    const isCorreoObraValid = validateTextos(formData.correoObra);
    const isValorInicialValid = validateEntradasNumericas(
      String(formData.valorInicial)
    );
    const isDisminucionValid = validateEntradasNumericas(
      String(formData.disminucion)
    );
    const isValorFinalValid = validateEntradasNumericas(
      String(formData.valorFinal)
    );
    const isConstructoraValid = validateTextos(formData.constructora);
    const isFicValid = validateTextos(formData.fic);
    const isCiudadDeObraValid = validateTextos(formData.ciudadDeObra);
    const isNumeroDeEmpleadosValid = validateTextos(formData.numeroDeEmpleados);

    // Actualizar estado de errores
    errorState.numeroDeContrato = !isNumeroDeContratoValid;
    errorState.descripcion = !isDescripcionValid;
    errorState.correoObra = !isCorreoObraValid;
    errorState.valorInicial = !isValorInicialValid;
    errorState.disminucion = !isDisminucionValid;
    errorState.valorFinal = !isValorFinalValid;
    errorState.constructora = !isConstructoraValid;
    errorState.fic = !isFicValid;
    errorState.ciudadDeObra = !isCiudadDeObraValid;
    // errorState.numeroDeEmpleados = !isNumeroDeEmpleadosValid;

    // Actualizar el estado de errores en el formulario
    setErrors(errorState);

    const newErrors2: Errors2 = {};
    Object.entries(formData2).forEach(([key, value]) => {
      // Convertimos a string para que validateField funcione
      newErrors2[key] = validateField(key, String(value));
    });
    setErrors2(newErrors2);

    const hasAnyError = Object.values(newErrors2).some((v) => v === true);
    if (hasAnyError) {
      showErrorToast('Completa todos los campos');
      return;
    }

    // Determinar si hay errores
    const hasErrors = Object.values(errorState).some((value) => value);

    if (hasErrors) {
      console.log('Errores detectados. El formulario no se enviará.');
      return;
    }

    const formattedData = {
      CONTRATO: formData.numeroDeContrato,
      VALORI: Number(formData.valorInicial),
      VALORFINAL: Number(formData.valorFinal),
      DESCRIPCION: formData.descripcion,
      FECHAI: formData.fechaDeInicio,
      FECHAF: formData.fechaDeTerminacion,
      FIC: formData.fic,
      OTRO1: formData.otroSi1,
      OTRO2: formData.otroSi2,
      OTRO3: formData.otroSi3,
      CIUDAD: formData.ciudadDeObra,
      OTRO4: formData.otroSi4,
      OTRO5: formData.otroSi5,
      ID_CLIENTE: formData.constructora,
      CORREOOBRA: formData.correoObra,
      DISMINUCION: Number(formData.disminucion),
      NUMERO: formData.numeroDeContrato,
      //Nuevos
      ADMINISTRACION: Number(formData2.administracion),
      IMPREVISTOS: Number(formData2.imprevistos),
      UTILIDAD: Number(formData2.utilidad),
      RETEFUENTE: Number(formData2.retefuente),
      RETEICA: Number(formData2.reteica),
      RETEGARANTIA: Number(formData2.retegarantia),
    };

    // console.log(formattedData);
    // console.log(formattedData, id);

    if (infoContrato && id && closeAcciones) {
      await updateContract(id, formattedData);
    } else {
      await createContract(formattedData);
    }
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  const formFields = [
    { label: 'Retefuente', name: 'retefuente', type: 'number' },
    { label: 'Reteica', name: 'reteica', type: 'number' },
    { label: 'Administracion', name: 'administracion', type: 'number' },
    { label: 'Imprevistos', name: 'imprevistos', type: 'number' },
    { label: 'Utilidad', name: 'utilidad', type: 'number' },
    { label: 'Retegarantia', name: 'retegarantia', type: 'number' },
  ];

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={() => {
        onClose();
      }} // Detecta clic en el fondo
    >
      <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
          onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal lo cierre
        >
          <div className="flex items-center justify-between mb-4">
            {/* Flecha para salir */}
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition"
              onClick={onClose} // Función para cerrar el modal
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            {/* Título centrado */}
            <h2 className="text-xl font-bold flex-1 text-center">
              {from === 'actualizar' ? 'Actualizar' : 'Nuevo'} Contrato
            </h2>

            {/* Espaciador para mantener la alineación */}
            <div className="w-10"></div>
          </div>

          <form>
            {/* Numero de contrato */}
            <div className="flex-1 mt-4 w-full">
              <label>
                Numero de contrato
                <span
                  className={`text-red-500 ${
                    errors.numeroDeContrato ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="text"
                  name="numeroDeContrato"
                  placeholder="Numero de contrato"
                  value={formData.numeroDeContrato || ''}
                  className={`w-full h-10 px-4 border ${
                    errors.numeroDeContrato
                      ? 'border-red-500'
                      : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.numeroDeContrato && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>

            {/* Descripcion */}
            <div className="flex-1 mt-4 w-full">
              <label>
                Descripcion
                <span
                  className={`text-red-500 ${
                    errors.descripcion ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="text"
                  name="descripcion"
                  placeholder="descripcion"
                  value={formData.descripcion || ''}
                  className={`w-full h-10 px-4 border ${
                    errors.descripcion ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.descripcion && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>

            {/* Correo obra */}
            <div className="flex-1 mt-4 w-full">
              <label>
                Correo obra
                <span
                  className={`text-red-500 ${
                    errors.correoObra ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="text"
                  name="correoObra"
                  placeholder="correoObra"
                  value={formData.correoObra || ''}
                  className={`w-full h-10 px-4 border ${
                    errors.correoObra ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.correoObra && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>

            {/* valor inicial */}
            <div className="flex-1 mt-4 w-full">
              <label>
                Valor inicial
                <span
                  className={`text-red-500 ${
                    errors.valorInicial ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="number"
                  name="valorInicial"
                  placeholder="Valor Inicial"
                  value={formData.valorInicial || ''}
                  className={`w-full h-10 px-4 border ${
                    errors.valorInicial ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.valorInicial && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>

            {/* otro Si 1-5*/}
            <div className="mb-4 mt-4">
              <label htmlFor="otroSi1">Otro Sí 1</label>
              <input
                type="text"
                id="otroSi1"
                placeholder="Otro sí 1"
                name="otroSi1"
                onChange={handleChange}
                value={formData.otroSi1 || ''}
                className={`w-full h-10 px-4 border mt-4 rounded-[25px] text-[#00A7E1] text-sm border-[#00A7E1] focus:ring-blue-300 focus:outline-none shadow-sm`}
              />
            </div>

            <div className="mb-4 mt-4">
              <label htmlFor="otroSi2" className="block text-gray-700">
                Otro Sí 2
              </label>
              <input
                type="text"
                value={formData.otroSi2 || ''}
                id="otroSi2"
                placeholder="Otro sí 2"
                name="otroSi2"
                onChange={handleChange}
                className={`w-full h-10 px-4 border mt-4 rounded-[25px] text-[#00A7E1] text-sm border-[#00A7E1] focus:ring-blue-300 focus:outline-none shadow-sm`}
              />
            </div>

            <div className="mb-4 mt-4">
              <label htmlFor="otroSi3" className="block text-gray-700">
                Otro Sí 3
              </label>
              <input
                type="text"
                id="otroSi3"
                placeholder="Otro sí 3"
                value={formData.otroSi3 || ''}
                name="otroSi3"
                onChange={handleChange}
                className={`w-full h-10 px-4 border mt-4 rounded-[25px] text-[#00A7E1] text-sm border-[#00A7E1] focus:ring-blue-300 focus:outline-none shadow-sm`}
              />
            </div>

            <div className="mb-4 mt-4">
              <label htmlFor="otroSi4" className="block text-gray-700">
                Otro Sí 4
              </label>
              <input
                type="text"
                id="otroSi4"
                value={formData.otroSi4 || ''}
                placeholder="Otro sí 4"
                name="otroSi4"
                onChange={handleChange}
                className={`w-full h-10 px-4 border mt-4 rounded-[25px] text-[#00A7E1] text-sm border-[#00A7E1] focus:ring-blue-300 focus:outline-none shadow-sm`}
              />
            </div>

            <div className="mb-4 mt-4">
              <label htmlFor="otroSi5" className="block text-gray-700">
                Otro Sí 5
              </label>
              <input
                type="text"
                value={formData.otroSi5 || ''}
                id="otroSi5"
                placeholder="Otro sí 5"
                name="otroSi5"
                onChange={handleChange}
                className={`w-full h-10 px-4 border mt-4 rounded-[25px] text-[#00A7E1] text-sm border-[#00A7E1] focus:ring-blue-300 focus:outline-none shadow-sm`}
              />
            </div>

            {formFields.map((field) => (
              <InputField
                key={field.name}
                label={field.label}
                name={field.name}
                type={field.type}
                value={formData2[field.name as keyof IFormData2] as number}
                error={errors2[field.name]}
                onChange={handleChange2}
              />
            ))}

            {/* Disminucion */}
            <div className="flex-1 mt-4 w-full">
              <label>
                Disminucion
                <span
                  className={`text-red-500 ${
                    errors.disminucion ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="number"
                  name="disminucion"
                  placeholder="Valor Inicial"
                  value={formData.disminucion || ''}
                  className={`w-full h-10 px-4 border ${
                    errors.disminucion ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.disminucion && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>

            {/* Valor final */}
            <div className="flex-1 mt-4 w-full">
              <label>
                Valor final
                <span
                  className={`text-red-500 ${
                    errors.valorFinal ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="number"
                  name="valorFinal"
                  placeholder="Valor Inicial"
                  value={formData.valorFinal || ''}
                  className={`w-full h-10 px-4 border ${
                    errors.valorFinal ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.valorFinal && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>

            {/* Fecha de inicio */}
            {/* Campo fechavencimientoCertificado */}
            <DatePickerInput
              label="Fecha De Inicio"
              name="fechaDeInicio"
              value={formData.fechaDeInicio || ''}
              error={errors.fechaDeInicio}
              onChange={(newDate) => {
                setFormData((prev) => ({
                  ...prev,
                  fechaDeInicio: newDate,
                }));
                setErrors((prev) => ({
                  ...prev,
                  fechaDeInicio: false,
                }));
              }}
            />

            {/* Campo fechavencimientoCertificado */}
            <DatePickerInput
              label="Fecha De Terminacion"
              name="fechaDeTerminacion"
              value={formData.fechaDeTerminacion || ''}
              error={errors.fechaDeTerminacion}
              onChange={(newDate) => {
                setFormData((prev) => ({
                  ...prev,
                  fechaDeTerminacion: newDate,
                }));
                setErrors((prev) => ({
                  ...prev,
                  fechaDeTerminacion: false,
                }));
              }}
            />

            {/* Constructora */}
            <div className="flex-1 mt-4 w-full">
              <label>
                Constructoras
                <span
                  className={`text-red-500 ${
                    errors.constructora ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className=" relative mt-4">
                {loadingClientes ? (
                  <div>Cargando opciones...</div>
                ) : (
                  <SelectConSearch
                    options={clientes}
                    value={formData.constructora}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        constructora: value,
                      }));
                    }}
                    placeholder="Seleccione una constructora"
                  />
                )}
              </div>
            </div>

            {/* Fic */}
            <div className="flex-1 mt-4 w-full">
              <label>
                FIC
                <span
                  className={`text-red-500 ${errors.fic ? '' : 'invisible'}`}
                >
                  *
                </span>
              </label>
              <div className=" relative mt-4">
                <SimpleSelect
                  options={opcionesFIC}
                  placeholder="Seleccione una opcion"
                  width={'100%'}
                  value={formData.fic}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, fic: value }));
                    setErrors((prev) => ({ ...prev, fic: !value }));
                  }}
                  error={errors.fic}
                />
              </div>
            </div>

            {/* Ciudad de obra */}
            <div className="flex flex-col">
              {loadingRegiones ? (
                <div>Cargando ciudades...</div>
              ) : (
                <div className=" relative">
                  <SelectConSearch
                    label="Ciudad de obra"
                    options={municipios}
                    placeholder="Ciudad de obra"
                    value={formData.ciudadDeObra}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, ciudadDeObra: value }));
                      setErrors((prev) => ({ ...prev, ciudadDeObra: !value }));
                    }}
                    error={errors.ciudadDeObra}
                    errorMessage="Debes seleccionar una ciudad de obra"
                  />
                </div>
              )}
            </div>
            <div className="mt-4 gap-4">
              <BotonQuality
                label="Solicitar poliza"
                onClick={() => showErrorToast('Boton en proceso de desarrollo')}
              />
              <div className="mt-4">
                <CheckboxUI
                  label="Contrato Activo"
                  onChange={() =>
                    showErrorToast('Boton en proceso de desarrollo')
                  }
                  checked={true}
                />
              </div>
            </div>

            {/* Número de empleados  */}
            {/* <div className="flex-1 mt-4 w-full">
              <label>
                Numero de empleados
                <span
                  className={`text-red-500 ${
                    errors.numeroDeEmpleados ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="number"
                  name="numeroDeEmpleados"
                  placeholder="Numero de empleados"
                  value={formData.numeroDeEmpleados}
                  className={`w-full h-10 px-4 border ${
                    errors.numeroDeEmpleados
                      ? 'border-red-500'
                      : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.numeroDeEmpleados && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div> */}

            {/* Mensaje de error si es que hay */}
            {Object.values(errors).includes(true) && (
              <p className="text-red-500 text-sm flex justify-center mt-4">
                Debe llenar todos campos requeridos.
              </p>
            )}

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
            {isLoading ? <Spinner /> : ''}
          </form>
        </div>
      </div>
    </div>
  );
};

export default FormContrato;
