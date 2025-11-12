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

const notificaciones: string[] = ['No', 'Si'];

const tiposDeContribuyentes = [
  { id: '1', nombre: 'Responsable de IVA' },
  { id: '2', nombre: 'No Responsable de IVA' },
];

const tiposDeOrganizaciones = [
  { id: '1', nombre: 'Persona juridica asimilada' },
  { id: '2', nombre: 'Persona natural asimilada' },
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

const FormCreacionCliente: React.FC<ModalFormProps> = ({
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
    fetchClientes,
    fetchCodigoClienteNuevo,
    codigoClienteNuevo,
    actualizarCliente,
  } = useClientStore();

  useEffect(() => {
    fetchClientes();
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
      setFormData(clienteExistente);
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

  const [formData, setFormData] = useState<InfoClientes>({
    id: '',
    tipoDeDocumento: '',
    documento: '',
    cliente: '',
    dv: '',
    direccion: '',
    telefono: '',
    correo: '',
    municipio: '',
    notificaciones: '',
    responsabilidadesFiscales: '',
    tipoDeContribuyente: '',
    tipoDeOrganizacion: '',
    pais: '',
    departamento: '',
    codigo: '',
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

    if (name === 'telefono') {
      const sanitizedValue = value.replace(/\s/g, '');
      setFormData({
        ...formData,
        [name]: sanitizedValue,
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

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

    const isTipoDeDocumentoValid = validateTextos(formData.tipoDeDocumento);
    const isDocumentoValid = validateTextos(formData.documento);
    const isClienteValid = validateTextos(formData.cliente);
    const isDvValid = validateTextos(formData.dv);
    const isDireccionValid = validateTextos(formData.direccion);
    const isTelefonoValid = validateTextos(formData.telefono);
    const isCorreoValid = validateTextos(formData.correo);
    const isMunicipioValid = validateTextos(formData.municipio);
    const isNotificacionesValid = validateTextos(formData.notificaciones);
    const isResponsabilidadesFiscalesValid = validateTextos(
      formData.responsabilidadesFiscales
    );
    const isTipoDeContribuyenteValid = validateTextos(
      formData.tipoDeContribuyente
    );
    const isTipoDeOrganizacionValid = validateTextos(
      formData.tipoDeOrganizacion
    );
    const isPaisValid = validateTextos(formData.pais);
    const isDepartamentoValid = validateTextos(formData.departamento);

    errorState.tipoDeDocumento = !isTipoDeDocumentoValid;
    errorState.documento = !isDocumentoValid;
    errorState.cliente = !isClienteValid;
    errorState.dv = !isDvValid;
    errorState.direccion = !isDireccionValid;
    errorState.telefono = !isTelefonoValid;
    errorState.correo = !isCorreoValid;
    errorState.municipio = !isMunicipioValid;
    errorState.notificaciones = !isNotificacionesValid;
    errorState.responsabilidadesFiscales = !isResponsabilidadesFiscalesValid;
    errorState.tipoDeContribuyente = !isTipoDeContribuyenteValid;
    errorState.tipoDeOrganizacion = !isTipoDeOrganizacionValid;
    errorState.pais = !isPaisValid;
    errorState.departamento = !isDepartamentoValid;

    setErrors(errorState);

    const hasErrors = Object.values(errorState).some((value) => value);

    if (hasErrors) {
      return;
    }

    const infoParaBack = {
      nombre: formData.cliente,
      NIT: formData.documento,
      direccion: formData.direccion,
      correo: formData.correo,
      resposabilidadFiscal: formData.responsabilidadesFiscales,
      tipoDeContribuyente: formData.tipoDeContribuyente,
      pais: formData.pais,
      departamento: formData.departamento,
      tipoDeOrganizacion: formData.tipoDeOrganizacion,
      doc: formData.documento,
      CODIGO: formData.codigo,
      nombre1: '',
      nombre2: '',
      apellido1: '',
      tipo_documento_id: formData.tipoDeDocumento,
      apellido2: '',
      telefono: formData.telefono,
      ciudad: formData.municipio,
      FIC: formData.notificaciones,
      DV: formData.dv,
      nombreE: '',
    };

    if (clienteExistente) {
      // console.log(formData);
      actualizarCliente(formData);
    } else {
      // console.log(infoParaBack);
      await createCliente(infoParaBack);
      setFormData({
        id: '',
        tipoDeDocumento: '',
        documento: '',
        cliente: '',
        dv: '',
        direccion: '',
        telefono: '',
        correo: '',
        municipio: '',
        notificaciones: '',
        responsabilidadesFiscales: '',
        tipoDeContribuyente: '',
        tipoDeOrganizacion: '',
        pais: '',
        departamento: '',
        codigo: '',
      });
      fetchCodigoClienteNuevo();
    }
    onClose();
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
          <h2 className="text-xl font-bold mb-4">
            {clienteExistente ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
          </h2>

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
            {/* DV */}
            <div className="flex flex-col mt-4">
              <label>
                DV
                <span
                  className={`text-red-500 ${errors.dv ? '' : 'invisible'}`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="text"
                  name="dv"
                  placeholder="DV"
                  value={formData.dv}
                  className={`w-full h-10 px-4 border ${
                    errors.dv ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.dv && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>
            {/* Cliente */}
            <div className="flex flex-col mt-4">
              <label>
                Cliente
                <span
                  className={`text-red-500 ${
                    errors.cliente ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="text"
                  name="cliente"
                  placeholder="Cliente"
                  value={formData.cliente}
                  className={`w-full h-10 px-4 border ${
                    errors.cliente ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.cliente && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>
            {/* Dirección */}
            <div className="flex flex-col mt-4">
              <label>
                Dirección
                <span
                  className={`text-red-500 ${
                    errors.direccion ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="text"
                  name="direccion"
                  placeholder="Direccion"
                  value={formData.direccion}
                  className={`w-full h-10 px-4 border ${
                    errors.direccion ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.direccion && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>
            {/* Teléfono */}
            <div className="flex flex-col mt-4">
              <label>
                Teléfono
                <span
                  className={`text-red-500 ${
                    errors.telefono ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="tel"
                  name="telefono"
                  placeholder="Telefono"
                  value={formData.telefono}
                  className={`w-full h-10 px-4 border ${
                    errors.telefono ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.telefono && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>
            {/* Correo Electrónico */}
            <div className="flex flex-col mt-4">
              <label>
                Correo Electrónico
                <span
                  className={`text-red-500 ${errors.correo ? '' : 'invisible'}`}
                >
                  *
                </span>
              </label>
              <div className="flex items-center h-10 mt-4">
                <input
                  type="email"
                  name="correo"
                  placeholder="Correo"
                  value={formData.correo}
                  className={`w-full h-10 px-4 border ${
                    errors.correo ? 'border-red-500' : 'border-[#00A7E1]'
                  } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
              </div>
              {errors.correo && (
                <p className="text-red-500 text-sm mt-1">
                  El campo es obligatorio.
                </p>
              )}
            </div>
            {/* Municipios */}
            <div className="flex flex-col mt-4">
              {loadingRegiones ? (
                <div>Cargando municipios...</div>
              ) : (
                <div className=" relative">
                  <SelectConSearch
                    label="Municipio"
                    options={municipios}
                    placeholder="Buscar un Municipio"
                    value={formData.municipio}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, municipio: value }));
                      setErrors((prev) => ({ ...prev, municipio: !value }));
                    }}
                    error={errors.municipio}
                    errorMessage="Debes seleccionar un municipio"
                  />
                </div>
              )}
            </div>
            {/* Notificaciones */}
            <div className="flex flex-col mt-4">
              <label>
                Notificaciones
                <span
                  className={`text-red-500 ${
                    errors.notificaciones ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className=" relative mt-4">
                <SimpleSelect
                  options={notificaciones}
                  placeholder="Seleccione una opcion"
                  width={'100%'}
                  value={formData.notificaciones}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, notificaciones: value }));
                    setErrors((prev) => ({ ...prev, notificaciones: !value }));
                  }}
                  error={errors.notificaciones}
                />
              </div>
            </div>

            {/* Responsabilidades Fiscales */}
            <div className="flex flex-col mt-4">
              <label>
                Responsabilidades Fiscales
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
                  options={responsabilidades}
                  placeholder="Seleccione una opcion"
                  width={'100%'}
                  value={formData.responsabilidadesFiscales}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      responsabilidadesFiscales: value,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      responsabilidadesFiscales: !value,
                    }));
                  }}
                  error={errors.responsabilidadesFiscales}
                />
              </div>
            </div>

            {/* Tipo de Contribuyente */}
            <div className="flex flex-col mt-4">
              <label>
                Tipo de Contribuyente
                <span
                  className={`text-red-500 ${
                    errors.tipoDeContribuyente ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className=" relative mt-4">
                <SimpleSelect
                  options={tiposDeContribuyentes}
                  placeholder="Seleccione una opcion"
                  width={'100%'}
                  value={formData.tipoDeContribuyente}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      tipoDeContribuyente: value,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      tipoDeContribuyente: !value,
                    }));
                  }}
                  error={errors.tipoDeContribuyente}
                />
              </div>
            </div>

            {/* Tipo de Organización */}
            <div className="flex flex-col mt-5">
              <label>
                Tipo de Organización
                <span
                  className={`text-red-500 ${
                    errors.tipoDeOrganizacion ? '' : 'invisible'
                  }`}
                >
                  *
                </span>
              </label>
              <div className=" relative mt-4">
                <SimpleSelect
                  options={tiposDeOrganizaciones}
                  placeholder="Seleccione una opcion"
                  width={'100%'}
                  value={formData.tipoDeOrganizacion}
                  onChange={(value) => {
                    setFormData((prev) => ({
                      ...prev,
                      tipoDeOrganizacion: value,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      tipoDeOrganizacion: !value,
                    }));
                  }}
                  error={errors.tipoDeOrganizacion}
                />
              </div>
            </div>

            {/* País */}
            <div className="flex flex-col">
              {loadingRegiones ? (
                <div>Cargando Países...</div>
              ) : (
                <div className=" relative">
                  <SelectConSearch
                    label="País"
                    options={paises}
                    placeholder="Buscar un País"
                    value={formData.pais}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, pais: value }));
                      setErrors((prev) => ({ ...prev, pais: !value }));
                    }}
                    error={errors.pais}
                    errorMessage="Debes seleccionar un País"
                  />
                </div>
              )}
            </div>

            {/* Departamento */}
            <div className="flex flex-col">
              {loadingRegiones ? (
                <div>Cargando Departamentos...</div>
              ) : (
                <div className=" relative">
                  <SelectConSearch
                    label="Departamento"
                    options={departamentos}
                    placeholder="Buscar un Departamento"
                    value={formData.departamento}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, departamento: value }));
                      setErrors((prev) => ({ ...prev, departamento: !value }));
                    }}
                    error={errors.departamento}
                    errorMessage="Debes seleccionar un Departamento"
                  />
                </div>
              )}
            </div>

            {/* Código */}
            <div className="mt-4">
              <label>Codigo</label>
              <div className="bg-gray-200 rounded-[20px] p-4 mt-2 text-gray-700">
                <h1>{formData.codigo}</h1>
              </div>
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

export default FormCreacionCliente;
