'use client';

import PrivateRoute from '@/helpers/PrivateRoute';
import { useState, useEffect } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import SimpleSelect from '@/components/ui/SimpleSelect';
import 'react-datepicker/dist/react-datepicker.css';
import SelectConSearch from '@/components/ui/selectConSearch';
import BotonSubirArchivos from '@/components/ui/botonSubirArchivos';
import BotonDeSolicitudDeFirma from '@/features/representante/botonDeSolicitudDeFirma';
import { useRegionesStore } from '@/store/useRegionesStore';
import { useRepresentanteStore } from '@/store/useRepresentanteStore';
import { useUserStore } from '@/store/useUser';
import DatePickerInput from '@/components/ui/DatePickerInput';
import Spinner from '@/components/feedback/Spinner';
import { InfoRepresentante } from '@/types/types';
import { BASE_URL } from '@/helpers/ruta';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';
import { showErrorToast } from '@/components/feedback/toast';

interface Errors {
  primerNombre: boolean;
  segundoNombre: boolean;
  primerApellido: boolean;
  segundoApellido: boolean;
  tipoDeDocumento: boolean;
  numeroDeDocumento: boolean;
  fechaDeExpedicion: boolean;
  fechaDeNacimiento: boolean;
  nacionalidad1: boolean;
  nacionalidad2: boolean;
  correo: boolean;
  direccion: boolean;
  departamento: boolean;
  municipio: boolean;
  telefono: boolean;
  lugarDeExpedicion: boolean;
  lugarDeNacimiento: boolean;
  cedulaRL: boolean;
  certificadoCC: boolean;
  rut: boolean;
  fechaCertificado: boolean;
  fechaVencimientoCertificado: boolean;
}

export default function RepresentanteLegal() {
  const {
    municipios,
    departamentos,
    fetchRegiones,
    loading: loadingRegiones,
  } = useRegionesStore();
  const {
    getRepresentantes,
    loading,
    getFirmaRepresentante,
    infoRepresentante,
    infoFirma,
  } = useRepresentanteStore();
  const {
    fetchTiposDeDocumentos,
    fetchResponsabilidadesFiscales,
    documentos,
    responsabilidades,
  } = useDatosExtraStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // URL de previsualización
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado del modal
  const { sendRepresentanteForm } = useRepresentanteStore();
  const [isSolicitudOpen, setIsSolicitudOpen] = useState(false); // Estado del modal

  const [formData, setFormData] = useState<InfoRepresentante>({
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    tipoDeDocumento: '',
    numeroDeDocumento: '',
    fechaDeExpedicion: '',
    fechaDeNacimiento: '',
    nacionalidad1: '',
    nacionalidad2: '',
    correo: '',
    direccion: '',
    departamento: '',
    municipio: '',
    telefono: '',
    lugarDeExpedicion: '',
    lugarDeNacimiento: '',
    fechaCertificado: '',
    fechaVencimientoCertificado: '',
    cedulaRL: null,
    certificadoCC: null,
    rut: null,
    cedulaRLURL: '',
    certificadoCCURL: '',
    rutURL: '',
  });

  const [errors, setErrors] = useState<Errors>({
    primerNombre: false,
    segundoNombre: false,
    primerApellido: false,
    segundoApellido: false,
    tipoDeDocumento: false,
    numeroDeDocumento: false,
    fechaDeExpedicion: false,
    fechaDeNacimiento: false,
    nacionalidad1: false,
    nacionalidad2: false,
    correo: false,
    direccion: false,
    departamento: false,
    municipio: false,
    telefono: false,
    lugarDeExpedicion: false,
    lugarDeNacimiento: false,
    cedulaRL: false,
    certificadoCC: false,
    rut: false,
    fechaCertificado: false,
    fechaVencimientoCertificado: false,
  });

  useEffect(() => {
    if (infoRepresentante) {
      setFormData((prev) => ({
        ...prev,
        primerNombre: infoRepresentante.primerNombre,
        segundoNombre: infoRepresentante.segundoNombre,
        primerApellido: infoRepresentante.primerApellido,
        segundoApellido: infoRepresentante.segundoApellido,
        tipoDeDocumento: infoRepresentante.tipoDeDocumento,
        numeroDeDocumento: infoRepresentante.numeroDeDocumento,
        fechaDeExpedicion: infoRepresentante.fechaDeExpedicion,
        fechaDeNacimiento: infoRepresentante.fechaDeNacimiento,
        nacionalidad1: infoRepresentante.nacionalidad1,
        nacionalidad2: infoRepresentante.nacionalidad2,
        correo: infoRepresentante.correo,
        direccion: infoRepresentante.direccion,
        departamento: infoRepresentante.departamento,
        municipio: infoRepresentante.municipio,
        telefono: infoRepresentante.telefono,
        lugarDeExpedicion: infoRepresentante.lugarDeExpedicion,
        fechaCertificado: infoRepresentante.fechaCertificado,
        fechaVencimientoCertificado:
          infoRepresentante.fechaVencimientoCertificado,

        lugarDeNacimiento: infoRepresentante.lugarDeNacimiento,
      }));
    }
  }, [infoRepresentante]);

  // useEffect(() => {
  //   if (infoFirma) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       fechaCertificado: infoFirma.fechaCertificado,
  //       fechaVencimientoCertificado: infoFirma.fechaVencimientoCertificado,
  //     }));
  //   }
  // }, [infoFirma]);

  useEffect(() => {
    handleFetch();
  }, []);

  const handleFetch = () => {
    fetchTiposDeDocumentos();
    fetchRegiones();
    getRepresentantes();
    getFirmaRepresentante();
  };

  //Maneja todos los cambios en el form en tiempo real
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
      primerNombre: validateTextos,
      // segundoNombre: validateTextos,
      primerApellido: validateTextos,
      // segundoApellido: validateTextos,
      fechaDeExpedicion: validateTextos,
      fechaDeNacimiento: validateTextos,
      nacionalidad1: validateTextos,
      correo: validateTextos,
      direccion: validateTextos,
      telefono: validateTextos,
      lugarDeExpedicion: validateTextos,
      lugarDeNacimiento: validateTextos,
      tipoDeDocumento: validateTextos,
      numeroDeDocumento: validateTextos,
      departamento: validateTextos,
      municipio: validateTextos,
    };

    // Validar en tiempo real
    if (validators[name]) {
      setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
    }
  };

  // Maneja el envío del formulario
  const handleSubmitButton = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();
    const errorState = { ...errors }; // Copiar el estado actual de errores

    // Validar todos los campos (excepto nacionalidad2)
    const isPrimerNombreValid = validateTextos(formData.primerNombre);
    // const isSegundoNombreValid = validateTextos(formData.segundoNombre);
    const isPrimerApellidoValid = validateTextos(formData.primerApellido);
    // const isSegundoApellidoValid = validateTextos(formData.segundoApellido);
    const isTipoDeDocumentoValid = validateTextos(formData.tipoDeDocumento);
    const isNumeroDeDocumentoValid = validateTextos(formData.numeroDeDocumento);
    const isFechaDeExpedicionValid = validateTextos(formData.fechaDeExpedicion);
    const isFechaDeNacimientoValid = validateTextos(formData.fechaDeNacimiento);
    const isNacionalidad1Valid = validateTextos(formData.nacionalidad1);
    const isCorreoValid = validateTextos(formData.correo);
    const isDireccionValid = validateTextos(formData.direccion);
    const isDepartamentoValid = validateTextos(formData.departamento);
    const isMunicipioValid = validateTextos(formData.municipio);
    const isTelefonoValid = validateTextos(formData.telefono);
    const isLugarDeExpedicionValid = validateTextos(formData.lugarDeExpedicion);
    const isLugarDeNacimientoValid = validateTextos(formData.lugarDeNacimiento);
    // const isCedulaRLValid = formData.cedulaRL !== null;
    // const isCertificadoCCValid = formData.certificadoCC !== null;
    // const isRutValid = formData.cedulaRL !== null;

    // Asignar los resultados de validación a los errores
    errorState.primerNombre = !isPrimerNombreValid;
    // errorState.segundoNombre = !isSegundoNombreValid;
    errorState.primerApellido = !isPrimerApellidoValid;
    // errorState.segundoApellido = !isSegundoApellidoValid;
    errorState.tipoDeDocumento = !isTipoDeDocumentoValid;
    errorState.numeroDeDocumento = !isNumeroDeDocumentoValid;
    errorState.fechaDeExpedicion = !isFechaDeExpedicionValid;
    errorState.fechaDeNacimiento = !isFechaDeNacimientoValid;
    errorState.nacionalidad1 = !isNacionalidad1Valid;
    errorState.correo = !isCorreoValid;
    errorState.direccion = !isDireccionValid;
    errorState.departamento = !isDepartamentoValid;
    errorState.municipio = !isMunicipioValid;
    errorState.telefono = !isTelefonoValid;
    errorState.lugarDeExpedicion = !isLugarDeExpedicionValid;
    errorState.lugarDeNacimiento = !isLugarDeNacimientoValid;
    // errorState.cedulaRL = !isCedulaRLValid;
    // errorState.certificadoCC = !isCertificadoCCValid;
    // errorState.rut = !isRutValid;

    setErrors(errorState);

    // Comprobar si hay errores
    const hasErrors =
      !isPrimerNombreValid ||
      // !isSegundoNombreValid ||
      !isPrimerApellidoValid ||
      // !isSegundoApellidoValid ||
      !isTipoDeDocumentoValid ||
      !isNumeroDeDocumentoValid ||
      !isFechaDeExpedicionValid ||
      !isFechaDeNacimientoValid ||
      !isNacionalidad1Valid ||
      !isCorreoValid ||
      !isDireccionValid ||
      !isDepartamentoValid ||
      !isMunicipioValid ||
      !isTelefonoValid ||
      !isLugarDeExpedicionValid ||
      !isLugarDeNacimientoValid;
    // !isCedulaRLValid ||
    // !isCertificadoCCValid ||
    // !isRutValid;

    if (hasErrors) {
      console.error(errors);
      return;
    }

    sendRepresentanteForm(formData);
  };

  const handleVerFirma = () => {
    const sanitizedBaseURL = BASE_URL.replace('/index.php', ''); // Eliminar '/index.php'
    const fullURL = `${sanitizedBaseURL}${infoFirma.rutaCertificado.replace(
      './',
      ''
    )}`;

    // Abrir la URL en una nueva pestaña.
    window.open(fullURL, '_blank');
  };
  // Validación básica para textos (puedes personalizar según tus necesidades)
  const validateTextos = (value: string): boolean => {
    return value.trim() !== ''; // Verifica que no esté vacío
  };

  const handleSubidaDeCedula = (file: File | null) => {
    setFormData((prev) => ({ ...prev, cedulaRL: file }));
    setErrors((prev) => ({ ...prev, cedulaRL: false }));
  };

  const handleSubidaDeCertificado = (file: File | null) => {
    setFormData((prev) => ({ ...prev, certificadoCC: file }));
    setErrors((prev) => ({ ...prev, certificadoCC: false }));
  };

  const handleSubidaRUT = (file: File | null) => {
    setFormData((prev) => ({ ...prev, rut: file }));
    setErrors((prev) => ({ ...prev, rut: false }));
  };

  const handleVerCedula = () => {
    if (formData.cedulaRL) {
      const preview = URL.createObjectURL(formData.cedulaRL); // Genera URL temporal
      setPreviewUrl(preview);
      setIsModalOpen(true); // Abre el modal
      return;
    }
    if (infoRepresentante.cedulaRLURL !== '') {
      const sanitizedBaseURL = BASE_URL.replace('/index.php', ''); // Eliminar '/index.php'
      const fullURL = `${sanitizedBaseURL}${infoRepresentante.cedulaRLURL.replace(
        './',
        ''
      )}`;

      // Abrir la URL en una nueva pestaña.
      window.open(fullURL, '_blank');
      return;
    }
  };

  const handleVerCertificado = () => {
    if (formData.certificadoCC) {
      const preview = URL.createObjectURL(formData.certificadoCC);
      setPreviewUrl(preview);
      setIsModalOpen(true); // Abre el modal
      return;
    }

    if (infoRepresentante.certificadoCCURL !== '') {
      const sanitizedBaseURL = BASE_URL.replace('/index.php', ''); // Eliminar '/index.php'
      const fullURL = `${sanitizedBaseURL}${infoRepresentante.certificadoCCURL.replace(
        './',
        ''
      )}`;

      // Abrir la URL en una nueva pestaña.
      window.open(fullURL, '_blank');
      return;
    }
  };

  const handleVerRUT = () => {
    if (formData.rut) {
      const preview = URL.createObjectURL(formData.rut); // Genera URL temporal
      setPreviewUrl(preview);
      setIsModalOpen(true); // Abre el modal
      return;
    }
    if (infoRepresentante.rutURL !== '') {
      const sanitizedBaseURL = BASE_URL.replace('/index.php', ''); // Eliminar '/index.php'
      const fullURL = `${sanitizedBaseURL}${infoRepresentante.rutURL.replace(
        './',
        ''
      )}`;

      // Abrir la URL en una nueva pestaña.
      window.open(fullURL, '_blank');
      return;
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const handleOpenSolicitud = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();

    if (
      !infoRepresentante.rutURL ||
      !infoRepresentante.certificadoCCURL ||
      !infoRepresentante.cedulaRLURL
    ) {
      showErrorToast('Adjunta y guarda tus certificados primero');
      return;
    }

    setIsSolicitudOpen(true);
  };

  const inputStyles =
    'rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm w-full h-10 px-4 border';

  return (
    // Contenedor de la pagina
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-12 w-full overflow-hidden">
          {/* Contenedor principal */}
          <div className="w-full max-w-[1152px] h-auto rounded-[20px] flex justify-center px-4 sm:px-12 pb-14 mx-auto bg-white">
            {/* Contenedor Gestor de facturas */}
            <div className="w-full max-w-full md:max-w-[1061px] mt-8">
              {/* Primer contenedor */}
              <div className="h-auto">
                <h1
                  className="w-full md:w-auto h-10 text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F]"
                  onClick={handleFetch}
                >
                  Representante Legal
                </h1>
              </div>

              {isModalOpen && previewUrl && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[201]"
                  onClick={closeModal} // Cierra el modal al hacer clic fuera
                >
                  <div
                    className="bg-white p-4 rounded-lg max-w-lg w-full"
                    onClick={(e) => e.stopPropagation()} // Evita que el clic dentro del modal cierre el fondo
                  >
                    {/* Contenido del modal */}
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg font-bold">Previsualización</h2>
                      <button
                        onClick={closeModal}
                        className="text-gray-500 hover:text-gray-800 text-base"
                      >
                        x
                      </button>
                    </div>
                    <iframe
                      src={previewUrl}
                      width="100%"
                      height="600px"
                      frameBorder="0"
                      title="Vista previa de la cédula"
                    />
                  </div>
                </div>
              )}

              {/* Contenedor de inputs y selectores */}
              <div className="leading-[17.7px] font-montserrat font-normal text-[#6F6F6F] text-sm mt-10 ">
                {/* Campo "primerNombre" */}
                <div className="w-ful">
                  <label>
                    Primer nombre
                    <span
                      className={`text-red-500 ml-1 ${
                        errors.primerNombre ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center h-10 mt-4">
                    <input
                      type="text"
                      name="primerNombre"
                      placeholder="Ingrese el Nombre"
                      value={formData.primerNombre || ''}
                      className={`${
                        errors.primerNombre
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } ${inputStyles}`}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.primerNombre && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Campo "segundoNombre" */}
                <div className="w-ful mt-4">
                  <label>
                    Segundo Nombre
                    <span
                      className={`text-red-500 ml-1 ${
                        errors.segundoNombre ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center h-10 mt-4">
                    <input
                      type="text"
                      name="segundoNombre"
                      placeholder="Ingrese el Nombre"
                      value={formData.segundoNombre || ''}
                      className={`${
                        errors.segundoNombre
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } ${inputStyles}`}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.segundoNombre && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Campo "primer apellido" */}
                <div className="w-ful mt-4">
                  <label>
                    Primer apellido
                    <span
                      className={`text-red-500 ml-1 ${
                        errors.primerApellido ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center h-10 mt-4">
                    <input
                      type="text"
                      name="primerApellido"
                      placeholder="Ingrese el Apellido"
                      value={formData.primerApellido || ''}
                      className={`${
                        errors.primerApellido
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } ${inputStyles}`}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.primerApellido && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Campo "Segundo apellido" */}
                <div className="w-ful mt-4">
                  <label>
                    Segundo apellido
                    <span
                      className={`text-red-500 ml-1 ${
                        errors.segundoApellido ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center h-10 mt-4">
                    <input
                      type="text"
                      name="segundoApellido"
                      placeholder="Ingrese el apellido"
                      value={formData.segundoApellido || ''}
                      className={`${
                        errors.segundoApellido
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } ${inputStyles}`}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.segundoApellido && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Campo "Tipo de documento" */}
                <div className="w-ful mt-4">
                  <label>
                    Tipo de documento
                    <span
                      className={`text-red-500 ml-1 ${
                        errors.tipoDeDocumento ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="mt-4">
                    {documentos && (
                      <SimpleSelect
                        options={documentos}
                        width={'100%'}
                        value={formData.tipoDeDocumento || ''}
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
                    )}
                  </div>
                  {errors.tipoDeDocumento && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Campo "Numero de documento" */}
                <div className="w-ful mt-4">
                  <label>
                    Numero de documento
                    <span
                      className={`text-red-500 ml-1 ${
                        errors.numeroDeDocumento ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center h-10 mt-4">
                    <input
                      type="text"
                      name="numeroDeDocumento"
                      placeholder="Ingrese el numero de documento"
                      value={formData.numeroDeDocumento || ''}
                      className={`${
                        errors.numeroDeDocumento
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } ${inputStyles}`}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.numeroDeDocumento && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Campo fechaDeExpedicion */}
                <DatePickerInput
                  label="Fecha de expedición"
                  name="fechaDeExpedicion"
                  value={formData.fechaDeExpedicion || ''}
                  error={errors.fechaDeExpedicion}
                  onChange={(newDate) => {
                    setFormData((prev) => ({
                      ...prev,
                      fechaDeExpedicion: newDate,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      fechaDeExpedicion: false,
                    }));
                  }}
                />

                {/* Campo fecha de nacimiento */}
                <DatePickerInput
                  label="Fecha de nacimiento"
                  name="fechaDeNacimiento"
                  value={formData.fechaDeNacimiento || ''}
                  error={errors.fechaDeNacimiento}
                  onChange={(newDate) => {
                    setFormData((prev) => ({
                      ...prev,
                      fechaDeNacimiento: newDate,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      fechaDeNacimiento: false,
                    }));
                  }}
                />

                {/* Campo "Nacionalidad 1" */}
                <div className="w-ful mt-4">
                  <label>
                    Nacionalidad 1
                    <span
                      className={`text-red-500 ml-1 ${
                        errors.nacionalidad1 ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center h-10 mt-4">
                    <input
                      type="text"
                      name="nacionalidad1"
                      placeholder="Ingrese la nacionalidad"
                      value={formData.nacionalidad1 || ''}
                      className={`${
                        errors.nacionalidad1
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } ${inputStyles}`}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.nacionalidad1 && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Campo "Nacionalidad 2" */}
                <div className="w-ful mt-4">
                  <label>
                    Nacionalidad 2
                    <span
                      className={`text-red-500 ml-1 ${
                        errors.nacionalidad2 ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center h-10 mt-4">
                    <input
                      type="text"
                      name="nacionalidad2"
                      placeholder="Ingrese la segunda nacionalidad"
                      value={formData.nacionalidad2 || ''}
                      className={`${
                        errors.nacionalidad2
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } ${inputStyles}`}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.nacionalidad2 && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Campo "Correo" */}
                <div className="w-ful mt-4">
                  <label>
                    Correo
                    <span
                      className={`text-red-500 ml-1 ${
                        errors.correo ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center h-10 mt-4">
                    <input
                      type="email"
                      name="correo"
                      placeholder="Ingrese correo"
                      value={formData.correo || ''}
                      className={`${
                        errors.correo ? 'border-red-500' : 'border-[#00A7E1]'
                      } ${inputStyles}`}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.correo && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Campo "Dirección" */}
                <div className="w-ful mt-4">
                  <label>
                    Dirección
                    <span
                      className={`text-red-500 ml-1 ${
                        errors.direccion ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center h-10 mt-4">
                    <input
                      type="email"
                      name="direccion"
                      placeholder="Ingrese la direccion"
                      value={formData.direccion || ''}
                      className={`${
                        errors.direccion ? 'border-red-500' : 'border-[#00A7E1]'
                      } ${inputStyles}`}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.direccion && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Departamentos */}
                <div className="flex flex-col">
                  {loadingRegiones ? (
                    <div>Cargando Departamentos...</div>
                  ) : (
                    <div className=" relative">
                      <SelectConSearch
                        label="Departamentos"
                        options={departamentos}
                        placeholder="Seleccione una opcion"
                        value={formData.departamento || ''}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            departamento: value,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            departamento: !value,
                          }));
                        }}
                        error={errors.departamento}
                        errorMessage="Debes seleccionar un departamento"
                      />
                    </div>
                  )}
                </div>

                {/* Municipios */}
                <div className="flex flex-col">
                  {loadingRegiones ? (
                    <div>Cargando municipios...</div>
                  ) : (
                    <div className=" relative">
                      <SelectConSearch
                        label="Municipios"
                        options={municipios}
                        placeholder="Seleccione una opcion"
                        value={formData.municipio || ''}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            municipio: value,
                          }));
                          setErrors((prev) => ({ ...prev, municipio: !value }));
                        }}
                        error={errors.municipio}
                        errorMessage="Debes seleccionar un municipio"
                      />
                    </div>
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
                      placeholder="Ingrese el Teléfono"
                      value={formData.telefono || ''}
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

                {/* Lugar de Expedición  */}
                <div className="flex flex-col mt-4">
                  <label>
                    Lugar de Expedición
                    <span
                      className={`text-red-500 ${
                        errors.lugarDeExpedicion ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center h-10 mt-4">
                    <input
                      type="text"
                      name="lugarDeExpedicion"
                      placeholder="Ingrese el lugar de Expedición"
                      value={formData.lugarDeExpedicion || ''}
                      className={`w-full h-10 px-4 border ${
                        errors.lugarDeExpedicion
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.lugarDeExpedicion && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Lugar de Nacimiento  */}
                <div className="flex flex-col mt-4">
                  <label>
                    Lugar de Nacimiento
                    <span
                      className={`text-red-500 ${
                        errors.lugarDeNacimiento ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center h-10 mt-4">
                    <input
                      type="text"
                      name="lugarDeNacimiento"
                      placeholder="Ingrese el lugar de Nacimiento"
                      value={formData.lugarDeNacimiento || ''}
                      className={`w-full h-10 px-4 border ${
                        errors.lugarDeNacimiento
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.lugarDeNacimiento && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* fecha certificado */}
                <DatePickerInput
                  label="Fecha de certificado"
                  name="fechaCertificado"
                  value={formData.fechaCertificado || ''}
                  error={errors.fechaCertificado}
                  onChange={(newDate) => {
                    setFormData((prev) => ({
                      ...prev,
                      fechaCertificado: newDate,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      fechaCertificado: false,
                    }));
                  }}
                />

                {/* Campo fechavencimientoCertificado */}
                <DatePickerInput
                  label="Fecha Vencimiento de Certificado "
                  name="fechaVencimientoCertificado"
                  value={formData.fechaVencimientoCertificado || ''}
                  error={errors.fechaVencimientoCertificado}
                  onChange={(newDate) => {
                    setFormData((prev) => ({
                      ...prev,
                      fechaVencimientoCertificado: newDate,
                    }));
                    setErrors((prev) => ({
                      ...prev,
                      fechaVencimientoCertificado: false,
                    }));
                  }}
                />

                {/* Adjuntar Cédula RL */}
                <div className="mt-4">
                  <label className="">
                    Adjuntar Cédula del Representante Legal
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0 mt-4">
                    <BotonSubirArchivos onSubmit={handleSubidaDeCedula} />
                    <button
                      className="w-full sm:w-auto min-w-[150px]  bg-[#00A7E1] text-white  h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] "
                      onClick={handleVerCedula}
                    >
                      Ver Cédula
                    </button>
                  </div>
                  {errors.cedulaRL && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Adjuntar Certificado CC */}
                <div className="mt-4">
                  <label className="">
                    Adjuntar Certificado de Cámara de Comercio (No mayor a 30
                    días)
                  </label>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0 mt-4">
                    <BotonSubirArchivos onSubmit={handleSubidaDeCertificado} />
                    <button
                      className="w-full sm:w-auto min-w-[150px]  bg-[#00A7E1] text-white  h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] "
                      onClick={handleVerCertificado}
                    >
                      Ver Certificado
                    </button>
                  </div>
                  {errors.certificadoCC && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Adjuntar RUT */}
                <div className="mt-4">
                  <label className="">Adjuntar RUT</label>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-4 sm:space-y-0 mt-4">
                    <BotonSubirArchivos onSubmit={handleSubidaRUT} />
                    <button
                      className="w-full sm:w-auto min-w-[150px]  bg-[#00A7E1] text-white  h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] "
                      onClick={handleVerRUT}
                    >
                      Ver RUT
                    </button>
                  </div>
                  {errors.rut && (
                    <p className="text-red-500 text-sm mt-1">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Mensaje de error si es que hay */}
                {Object.values(errors).includes(true) && (
                  <p className="text-red-500 text-sm mt-1">
                    Debe llenar todos campos requeridos.
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSubmitButton}
                  className="bg-[#00A7E1] text-white w-28 mt-10 h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1]"
                >
                  Guardar
                </button>

                {/* Últimos botones */}
                <div className="flex mt-4 flex-col">
                  {!(
                    infoRepresentante.rutURL &&
                    infoRepresentante.certificadoCCURL &&
                    infoRepresentante.cedulaRLURL
                  ) ? (
                    <p className="text-red-600 text-sm mt-2">
                      Para solicitar tu firma electrónica, adjunta los archivos:{' '}
                      <br />
                      <strong>Cédula del Representante Legal</strong>,{' '}
                      <strong>Certificado de Cámara de Comercio</strong> y{' '}
                      <strong>RUT</strong>.
                    </p>
                  ) : (
                    <div>
                      <button
                        className="bg-[#333332] text-white h-8 mt-4 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-auto"
                        onClick={handleOpenSolicitud}
                      >
                        Solicitud de Firma Electrónica
                      </button>
                      <BotonDeSolicitudDeFirma
                        onClose={() => {
                          setIsSolicitudOpen(false);
                        }}
                        isModalOpen={isSolicitudOpen}
                        fechaCertificado={formData.fechaCertificado}
                        fechaVencimientoCertificado={
                          formData.fechaVencimientoCertificado
                        }
                      />
                    </div>
                  )}

                  {infoFirma?.rutaCertificado ? (
                    <div>
                      <button
                        type="button"
                        onClick={handleVerFirma}
                        className="bg-[#333332] text-white h-8 mt-4 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-auto"
                      >
                        Ver Firma
                      </button>
                    </div>
                  ) : (
                    <div>
                      <button
                        className="bg-[#333332] text-white h-8 mt-4 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-auto"
                        onClick={handleOpenSolicitud}
                      >
                        Solicitud de Firma Electrónica
                      </button>
                      <BotonDeSolicitudDeFirma
                        onClose={() => {
                          setIsSolicitudOpen(false);
                        }}
                        isModalOpen={isSolicitudOpen}
                        fechaCertificado={formData.fechaCertificado}
                        fechaVencimientoCertificado={
                          formData.fechaVencimientoCertificado
                        }
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {loading ? <Spinner /> : ''}
      </LayoutAdmi>
    </PrivateRoute>
  );
}
