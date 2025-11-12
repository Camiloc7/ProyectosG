import React, { useState, useEffect } from 'react';
import {
  validateSeleccionMultiple,
  validateEntradasNumericas,
  validateTextos,
} from '../../app/gestionDeFacturasElectronicas/validations';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { useClientStore } from '../../store/useClientStore';
import { useRegionesStore } from '@/store/useRegionesStore';
import SelectConSearch from '@/components/ui/selectConSearch';
import { InfoClientes } from '@/types/types';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';
import DatePickerInput from '@/components/ui/DatePickerInput';

const notificaciones: string[] = ['No', 'Si'];

const tiposDeContribuyentes = [
  { id: '1', nombre: 'Responsable de IVA' },
  { id: '2', nombre: 'No Responsable de IVA' },
];

const tiposDeOrganizaciones = [
  { id: '1', nombre: 'Persona juridica asimilada' },
  { id: '2', nombre: 'Persona natural asimilada' },
];

const tipoDeResolucion = [
  { id: '1', nombre: 'Factura Electrónica' },
  { id: '2', nombre: 'Factura Electrónica de Contingencia' },
  { id: '3', nombre: 'Factura' },
  { id: '4', nombre: 'Nota Crédito' },
  { id: '5', nombre: 'Nota Débito' },
  { id: '6', nombre: 'Acuse de Recibo' },
  { id: '7', nombre: 'Recibo del bien o servicio' },
  { id: '8', nombre: 'Aceptación Expresa' },
  { id: '9', nombre: 'Aceptación Táctica' },
  { id: '10', nombre: 'Reclamo' },
  { id: '11', nombre: 'Habilitación' },
];

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  clienteExistente?: InfoClientes | null;
}

interface Errors {
  tipoDeDocumento: boolean;
  documento: boolean;
  cliente: boolean;
  dv: boolean;
  direccion: boolean;
  telefono: boolean;
  correo: boolean;
  municipio: boolean;
  notificaciones: boolean;
  responsabilidadesFiscales: boolean;
  tipoDeContribuyente: boolean;
  tipoDeOrganizacion: boolean;
  pais: boolean;
  departamento: boolean;
  codigo: boolean;
}

const FormResoluciones: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  clienteExistente = null,
}) => {
  const {
    paises,
    municipios,
    departamentos,
    fetchRegiones,
    loading: loadingRegiones,
  } = useRegionesStore();
  const {
    createCliente,
    fetchCodigoClienteNuevo,
    codigoClienteNuevo,
    actualizarCliente,
  } = useClientStore();

  useEffect(() => {
    fetchTiposDeDocumentos();
    fetchRegiones();
    fetchCodigoClienteNuevo();
    fetchResponsabilidadesFiscales();
  }, []);

  const {
    fetchTiposDeDocumentos,
    fetchResponsabilidadesFiscales,
    documentos,
    responsabilidades,
  } = useDatosExtraStore();

  useEffect(() => {
    if (clienteExistente) {
      // console.log('Cliente existente:', clienteExistente);
      //   setFormData(clienteExistente);
    }
  }, [clienteExistente]);

  useEffect(() => {
    if (!clienteExistente && !codigoClienteNuevo) {
      setFormData((prev) => ({
        ...prev,
        codigo: '---',
      }));
    } else if (!clienteExistente) {
      setFormData((prev) => ({ ...prev, codigo: codigoClienteNuevo }));
    }
  }, [codigoClienteNuevo]);

  const [formData, setFormData] = useState({
    nit: '',
    dv: '',
    tipoDeDocumento: '',
    tipoDeOrganizacion: '',
    tipoDeRegimen: '',
    tipoDeResponsabilidad: '',
    nombre: '',
    merchan: '',
    municipio: '',
    direccion: '',
    telefono: '',
    email: '',
    mailHost: '',
    mailPort: '',
    mailUsername: '',
    mailPassword: '',
    mailEncriptacion: '',
    testId: '',
    id: '',
    pin: '',
    archivo: null,
    password: '',
    tipoDeDocumentoId: '',
    prefijo: '',
    resolucion: '',
    fechaDeResolucion: '',
    claveTecnica: '',
    fechaInicio: '',
    fechaHasta: '',
    generatedToDate: '',
    resolucionDesde: '',
    resolucionHasta: '',
    siguiente: '',
    conteo: '',
    tipoDeResolucion: '',
    numero: '',
  });

  const [errors, setErrors] = useState<Errors>({
    tipoDeDocumento: false,
    documento: false,
    cliente: false,
    dv: false,
    direccion: false,
    telefono: false,
    correo: false,
    municipio: false,
    notificaciones: false,
    responsabilidadesFiscales: false,
    tipoDeContribuyente: false,
    tipoDeOrganizacion: false,
    pais: false,
    departamento: false,
    codigo: false,
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
      cliente: validateTextos,
      dv: validateTextos,
      direccion: validateTextos,
      telefono: validateTextos,
      correo: validateTextos,
      municipio: validateTextos,
      notificaciones: validateTextos,
      responsabilidadesFiscales: validateTextos,
      tipoDeContribuyente: validateTextos,
      tipoDeOrganizacion: validateTextos,
      pais: validateTextos,
      departamento: validateTextos,
      codigo: validateTextos,
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

    onClose();
  };

  const handleBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    onClose();
  };

  if (!isOpen) return null;

  const inputStyles =
    'rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm w-full h-10 px-4 border';

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
          <h2 className="text-xl font-bold mb-4">Editar resolucion</h2>

          <div className="w-ful mt-4">
            <label>Nombre</label>
            <div className="flex items-center h-10 mt-4">
              <input
                type="text"
                name="nombre"
                placeholder="Ingrese"
                value={formData.nombre || ''}
                className={`${inputStyles}`}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="w-ful mt-4">
            <label>Numero</label>
            <div className="flex items-center h-10 mt-4">
              <input
                type="text"
                name="numero"
                placeholder="Ingrese"
                value={formData.numero || ''}
                className={`${inputStyles}`}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="w-ful mt-4">
            <label>Llave tecnica</label>
            <div className="flex items-center h-10 mt-4">
              <input
                type="text"
                name="claveTecnica"
                placeholder="Ingrese"
                value={formData.claveTecnica || ''}
                className={`${inputStyles}`}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* fecha certificado */}
          <DatePickerInput
            label="fecha inicio"
            name="fechaCertificado"
            value={formData.fechaInicio || ''}
            onChange={(newDate) => {
              setFormData((prev) => ({
                ...prev,
                fechaInicio: newDate,
              }));
            }}
          />

          <DatePickerInput
            label="fecha inicio"
            name="fechaCertificado"
            value={formData.fechaInicio || ''}
            onChange={(newDate) => {
              setFormData((prev) => ({
                ...prev,
                fechaInicio: newDate,
              }));
            }}
          />

          <DatePickerInput
            label="fecha fin"
            name="fechaHasta"
            value={formData.fechaHasta || ''}
            onChange={(newDate) => {
              setFormData((prev) => ({
                ...prev,
                fechaHasta: newDate,
              }));
            }}
          />

          <div className="w-ful mt-4">
            <label>Resolucion desde</label>
            <div className="flex items-center h-10 mt-4">
              <input
                type="text"
                name="resolucionDesde"
                placeholder="Ingrese"
                value={formData.resolucionDesde || ''}
                className={`${inputStyles}`}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="w-ful mt-4">
            <label>Resolucion hasta</label>
            <div className="flex items-center h-10 mt-4">
              <input
                type="text"
                name="resolucionHasta"
                placeholder="Ingrese"
                value={formData.resolucionHasta || ''}
                className={`${inputStyles}`}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="w-ful mt-4">
            <label>prefijo</label>
            <div className="flex items-center h-10 mt-4">
              <input
                type="text"
                name="prefijo"
                placeholder="Ingrese"
                value={formData.prefijo || ''}
                className={`${inputStyles}`}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Responsabilidades Fiscales */}
          <div className="flex flex-col mt-4">
            <label>
              Tipos de resolucion
              <span
                className={`text-red-500 ${
                  errors.responsabilidadesFiscales ? '' : 'invisible'
                }`}
              >
                *
              </span>
            </label>
            <div className=" relative mt-4">
              <SimpleSelect
                options={tipoDeResolucion}
                placeholder="Seleccione una opcion"
                width={'100%'}
                value={formData.tipoDeResolucion}
                onChange={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    tipoDeResolucion: value,
                  }));
                }}
              />
            </div>
          </div>

          <div className="w-ful mt-4">
            <label>Conteo</label>
            <div className="flex items-center h-10 mt-4">
              <input
                type="text"
                name="conteo"
                placeholder="Ingrese"
                value={formData.conteo || ''}
                className={`${inputStyles}`}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="w-ful mt-4">
            <label>Siguiente factura</label>
            <div className="flex items-center h-10 mt-4">
              <input
                type="text"
                name=""
                placeholder="---"
                readOnly
                value={formData.siguiente || ''}
                className={`${inputStyles}`}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="bg-[#00A7E1] mt-4 text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-32"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormResoluciones;
