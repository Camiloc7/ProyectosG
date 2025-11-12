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
import { useConfigApiStore } from '@/store/useConfigApiStore';
import InputField from '@/components/ui/InputField';
import { error } from 'console';
import { text } from 'stream/consumers';
import { FaWhatsapp } from 'react-icons/fa';
import { useResolucionesStore } from '@/store/ResolucionesStore';
import BotonQuality from '@/components/ui/BotonQuality';
import { useEstablecimientoStore } from '@/store/POS/useEstablecimientoStore';

const tiposDeContribuyentes = [
  { id: '1', nombre: 'Responsable de IVA' },
  { id: '2', nombre: 'No Responsable de IVA' },
];

const tiposDeOrganizaciones = [
  { id: '1', nombre: 'Persona juridica asimilada' },
  { id: '2', nombre: 'Persona natural asimilada' },
];

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

export default function ConfigApi() {
  const {
    municipios,
    departamentos,
    fetchRegiones,
    loading: loadingRegiones,
  } = useRegionesStore();
  const {
    fetchTiposDeDocumentos,
    fetchResponsabilidadesFiscales,
    documentos,
    responsabilidades,
  } = useDatosExtraStore();
  const { fetchTodasLasResoluciones, selectResoluciones } =
    useResolucionesStore();
  const { traerInfoDeUsuarios, todaLaInfoUsuario, user } = useUserStore();
  const { traerEstablecimientosPorNit, loading, selectEstablecimientosPorNit } =
    useEstablecimientoStore();

  const {
    sendApiCompany,
    sendApiSoftware,
    sendApiCertificado,
    sendApiResolucion,
    configApiResoluciones,
    pasarAProduccion,
    sendTestID,
    getCompany,
    companyInfo,
    loading: apiconfig,
  } = useConfigApiStore();

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
    nombreSoftware: '',
    facturacion: '',
    nomina: '',
    documentosNoObligados: '',
    eventosRadian: '',
    documentosEquivalentes: '',
    softwareNomina: '',
    pinNomina: '',

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
    //New
    establecimientoId: '',
  });

  const [errors, setErrors] = useState({
    nit: false,
    segundoNombre: false,
    primerApellido: false,
    pinNomina: false,
    resolucion: false,
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
    id: false,
    pin: false,
    softwareNomina: false,
  });

  useEffect(() => {
    handleFetch();
  }, []);

  useEffect(() => {
    if (!todaLaInfoUsuario?.nit) return;
    traerEstablecimientosPorNit(todaLaInfoUsuario.nit);
  }, [todaLaInfoUsuario]);

  useEffect(() => {
    if (todaLaInfoUsuario) {
      // console.log(todaLaInfoUsuario);
      setFormData((prev) => ({
        ...prev,
        nit: todaLaInfoUsuario.nit?.replace(/\s|\./g, '') || '',
        dv: todaLaInfoUsuario.dv?.replace(/\s|\./g, '') || '',
        // tipoDeDocumento: todaLaInfoUsuario.,
        tipoDeOrganizacion: todaLaInfoUsuario.tipoDocEntidad || '',
        tipoDeRegimen: todaLaInfoUsuario.regimen || '',
        tipoDeResponsabilidad: todaLaInfoUsuario.responsabilidadTri || '',
        nombre: todaLaInfoUsuario.nombre || '',
        // merchan: todaLaInfoUsuario.membrete,
        municipio: todaLaInfoUsuario.municipio || '',
        direccion: todaLaInfoUsuario.direccion || '',
        telefono: todaLaInfoUsuario.telefono || '',
        email: todaLaInfoUsuario.correo || '',
        //   mailHost: todaLaInfoUsuario.,
        //   mailPort: todaLaInfoUsuario.nit,
        //   mailUsername: todaLaInfoUsuario.nit,
        //   mailPassword: todaLaInfoUsuario.nit,
        //   mailEncriptacion: todaLaInfoUsuario.nit,
      }));
    }
  }, [todaLaInfoUsuario]);

  const handleResolucionChange = (value: string) => {
    setFormData((prev) => ({ ...prev, resolucion: value }));

    // Validación si quieres
    setErrors((prev) => ({
      ...prev,
      resolucion: !validateTextos(value),
    }));
  };

  const handleEstablecimientoChange = (value: string) => {
    setFormData((prev) => ({ ...prev, establecimientoId: value }));

    // Validación si quieres
    setErrors((prev) => ({
      ...prev,
      establecimientoId: !validateTextos(value),
    }));
  };

  const handleFetch = () => {
    fetchTiposDeDocumentos();
    fetchRegiones();
    fetchResponsabilidadesFiscales();
    fetchTodasLasResoluciones();
    traerInfoDeUsuarios();
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Actualizar datos del formulario
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validar todos los campos con validateTextos
    setErrors((prev) => ({
      ...prev,
      [name]: !validateTextos(value), // Siempre valida con validateTextos
    }));
  };

  // Maneja el envío del formulario
  const handleSubmitButton = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();

    // sendRepresentanteForm(formData);
  };

  const handleSubmit1 = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();

    const formatted = {
      nit: formData.nit,
      dv: formData.dv,
      type_document_identification_id: formData.tipoDeDocumento,
      type_organization_id: formData.tipoDeOrganizacion,
      type_regime_id: formData.tipoDeRegimen,
      type_liability_id: formData.tipoDeResponsabilidad,
      business_name: formData.nombre,
      merchant_registration: formData.merchan,
      municipality_id: formData.municipio,
      address: formData.direccion,
      phone: formData.telefono,
      email: formData.email,
      mail_host: formData.mailHost,
      mail_port: formData.mailPort,
      mail_username: formData.mailUsername,
      mail_password: formData.mailPassword,
      mail_encryption: formData.mailEncriptacion,
    };

    sendApiCompany(formatted);
  };

  const handleTestIDSubmit = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();

    let hasErrors = false;
    const newErrors: typeof errors = {
      nit: false,
      segundoNombre: false,
      primerApellido: false,
      pinNomina: false,
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
      id: false,
      pin: false,
      softwareNomina: false,
      resolucion: false,
    }; // Copia local de errores

    if (formData.facturacion !== '') {
      if (formData.id === '') {
        newErrors.id = true;
        hasErrors = true;
      }
      if (formData.pin === '') {
        newErrors.pin = true;
        hasErrors = true;
      }
    }

    if (formData.nomina !== '') {
      if (formData.softwareNomina === '') {
        newErrors.softwareNomina = true;
        hasErrors = true;
      }
      if (formData.pinNomina === '') {
        newErrors.pinNomina = true;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      return; // Detiene la ejecución
    }

    const formatted = {
      testID: formData.facturacion,
      nomina: formData.nomina,
      documentosNoObligados: formData.documentosNoObligados,
      eventosRadian: formData.eventosRadian,
      documentosEquivalentes: formData.documentosEquivalentes,
      facturacion: formData.facturacion,
      nombreSoftware: formData.nombreSoftware,
      SOFTWARE_NOMINA: formData.softwareNomina,
      PIN_NOMINA: formData.pinNomina,
      PIN_FACTURA: formData.pin,
      SOFTWARE_FACTURA: formData.id,
    };

    sendTestID(formatted);
  };

  const handleSubmitSoftware = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();

    const formatted = {
      id: formData.id,
      pin: formData.pin,
    };

    sendApiSoftware(formatted);
  };

  const handleSubmitCertificado = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();

    const formatted = {
      certificate: formData.archivo,
      password: formData.password,
    };

    sendApiCertificado(formatted);
  };

  const handleSubmitResolucion = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();

    const formatted = {
      type_document_id: formData.tipoDeDocumentoId,
      prefix: formData.prefijo,
      resolution: formData.resolucion,
      resolution_date: formData.fechaDeResolucion,
      technical_key: formData.claveTecnica,
      from: formData.resolucionDesde,
      to: formData.resolucionHasta,
      generated_to_date: formData.generatedToDate,
      date_from: formData.fechaInicio,
      date_to: formData.fechaHasta,
    };

    sendApiResolucion(formatted);
  };

  const handleValidarFormularios = (
    event: React.MouseEvent<HTMLButtonElement>
  ): void => {
    event.preventDefault();

    configApiResoluciones();
  };

  const handleSubidaDeCedula = (file: any) => {
    setFormData((prev) => ({ ...prev, archivo: file }));
    // console.log('Bien!', file);
  };

  // Validación básica para textos (puedes personalizar según tus necesidades)
  const validateTextos = (value: string): boolean => {
    return value.trim() !== ''; // Verifica que no esté vacío
  };

  const inputStyles =
    'rounded-[25px] text-[#6F6F6F] border-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm w-full h-10 px-4 border';

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
              <div className="h-auto font-montserrat font-normal text-[#6F6F6F] text-sm">
                <div className="w-full">
                  {/* Company */}
                  <div>
                    <h1
                      className="w-full md:w-auto h-10 text-2xl md:text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F] text-center md:text-left"
                      onClick={handleFetch}
                    >
                      Configuración API Company
                    </h1>
                    {/* Campo Nit */}
                    <InputField
                      label="NIT"
                      name="nit"
                      type="number"
                      value={formData.nit}
                      readOnly={true}
                      onChange={handleChange}
                    />

                    {/* Campo DV */}
                    <InputField
                      label="DV"
                      type={'number'}
                      name="dv"
                      value={formData.dv}
                      readOnly={true}
                      onChange={handleChange}
                    />
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
                            }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Tipo de Organización */}
                    <div className="flex flex-col mt-5">
                      <label>Tipo de Organización</label>
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
                          }}
                        />
                      </div>
                    </div>

                    {/* Tipo de regimen */}
                    <div className="flex flex-col mt-5">
                      <label>Tipo de regimen</label>
                      <div className=" relative mt-4">
                        <SimpleSelect
                          options={tiposDeContribuyentes}
                          placeholder="Seleccione una opcion"
                          width={'100%'}
                          value={formData.tipoDeRegimen}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              tipoDeRegimen: value,
                            }));
                          }}
                        />
                      </div>
                    </div>

                    {/* Tipo de regimen */}
                    <div className="flex flex-col mt-5">
                      <label>Tipo de Responsabilidad</label>
                      <div className=" relative mt-4">
                        <SimpleSelect
                          options={responsabilidades}
                          placeholder="Seleccione una opcion"
                          width={'100%'}
                          value={formData.tipoDeResponsabilidad}
                          onChange={(value) => {
                            setFormData((prev) => ({
                              ...prev,
                              tipoDeResponsabilidad: value,
                            }));
                          }}
                        />
                      </div>
                    </div>

                    {/* Campo Nombre */}
                    <InputField
                      label="Nombre"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                    />

                    {/* Campo Merchan */}
                    <InputField
                      label="Merchan"
                      name="merchan"
                      value={formData.merchan}
                      onChange={handleChange}
                    />

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
                              setFormData((prev) => ({
                                ...prev,
                                municipio: value,
                              }));
                              setErrors((prev) => ({
                                ...prev,
                                municipio: !value,
                              }));
                            }}
                            error={errors.municipio}
                            errorMessage="Debes seleccionar un municipio"
                          />
                        </div>
                      )}
                    </div>

                    {/* Campo direccion */}
                    <InputField
                      label="Dirección"
                      name="direccion"
                      value={formData.direccion}
                      onChange={handleChange}
                    />

                    {/* Campo telefono */}
                    <InputField
                      label="Teléfono"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                    />

                    <InputField
                      label="Email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <InputField
                      label="Mail Host"
                      name="mailHost"
                      value={formData.mailHost}
                      onChange={handleChange}
                    />

                    <InputField
                      label="Mail Port"
                      name="mailPort"
                      value={formData.mailPort}
                      onChange={handleChange}
                    />

                    <InputField
                      label="Mail Username"
                      name="mailUsername"
                      value={formData.mailUsername}
                      onChange={handleChange}
                    />

                    <InputField
                      label="Mail Password"
                      name="mailPassword"
                      value={formData.mailPassword}
                      onChange={handleChange}
                    />
                    <InputField
                      label="Mail Encryptacion"
                      name="mailEncriptacion"
                      value={formData.mailEncriptacion}
                      onChange={handleChange}
                    />

                    <button
                      type="button"
                      onClick={handleSubmit1}
                      className="bg-[#00A7E1] mt-4 text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-32"
                    >
                      Enviar
                    </button>
                  </div>

                  <div className="border-t-2 border-[#D3D3D3] my-10"></div>

                  {/* test ID */}
                  <div className="mb-12">
                    <h1 className="w-full mb-10 h-10 text-2xl md:text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F] text-center md:text-left">
                      Configuración TestID Software
                    </h1>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-1/2">
                        <InputField
                          label="Nombre del Software"
                          name="nombreSoftware"
                          value={formData.nombreSoftware}
                          onChange={handleChange}
                        />
                        <InputField
                          label="Facturacion"
                          name="facturacion"
                          value={formData.facturacion}
                          onChange={handleChange}
                        />
                        <InputField
                          label="Nomina"
                          name="nomina"
                          value={formData.nomina}
                          onChange={handleChange}
                        />
                        <InputField
                          label="Software Factura"
                          error={errors.id}
                          name="id"
                          value={formData.id}
                          onChange={handleChange}
                          placeholder="Ingrese los datos"
                        />

                        <InputField
                          label="Pin Factura"
                          name="pin"
                          value={formData.pin}
                          onChange={handleChange}
                          placeholder="Ingrese los datos"
                          error={errors.pin}
                        />
                      </div>
                      <div className="w-full md:w-1/2">
                        <InputField
                          label="Documentos No Obligados"
                          name="documentosNoObligados"
                          value={formData.documentosNoObligados}
                          onChange={handleChange}
                        />
                        <InputField
                          label="Eventos Radian"
                          name="eventosRadian"
                          value={formData.eventosRadian}
                          onChange={handleChange}
                        />
                        <InputField
                          label="Documentos Equivalentes"
                          name="documentosEquivalentes"
                          value={formData.documentosEquivalentes}
                          onChange={handleChange}
                        />

                        <InputField
                          label="Software Nomina"
                          name="softwareNomina"
                          value={formData.softwareNomina}
                          onChange={handleChange}
                          placeholder="Ingrese los datos"
                          error={errors.softwareNomina}
                        />

                        <InputField
                          label="Pin Nomina"
                          name="pinNomina"
                          value={formData.pinNomina}
                          onChange={handleChange}
                          error={errors.pinNomina}
                          placeholder="Ingrese los datos"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestIDSubmit}
                      className="bg-[#00A7E1] mt-4 text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-32"
                    >
                      Enviar
                    </button>
                  </div>

                  <div className="border-t-2 border-[#D3D3D3] my-10"></div>

                  {/* certificate */}
                  <div>
                    <h1
                      className="w-full md:w-auto mb-10 h-10 text-2xl md:text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F] text-center md:text-left"
                      onClick={handleFetch}
                    >
                      Configuración API Certificate
                    </h1>
                    <BotonSubirArchivos onSubmit={handleSubidaDeCedula} />
                    <div className="w-ful mt-4">
                      <label>Password</label>
                      <div className="flex items-center h-10 mt-4">
                        <input
                          type="text"
                          name="password"
                          placeholder="Ingrese los datos"
                          value={formData.password || ''}
                          className={`${inputStyles}`}
                          onChange={handleChange}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSubmitCertificado}
                      className="bg-[#00A7E1] mt-4 text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-32"
                    >
                      Enviar
                    </button>
                  </div>

                  <div className="border-t-2 border-[#D3D3D3] my-10"></div>

                  <h1
                    className="w-full md:w-auto mb-10 h-10 text-2xl md:text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F] text-center md:text-left"
                    onClick={handleFetch}
                  >
                    Configuración API Resolution
                  </h1>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4 mb-10">
                    {/* Botón de pasar a producción */}
                    <button
                      type="button"
                      onClick={() => {
                        pasarAProduccion();
                      }}
                      className="bg-[#00A7E1] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-32"
                    >
                      Pasar a Producción
                    </button>

                    {/* Texto descriptivo */}
                    <p className="font-montserrat font-normal text-[#6F6F6F] text-sm">
                      ¿Necesitas ayuda? Contáctanos.
                    </p>

                    {/* Botón de WhatsApp con ícono */}
                    <button
                      type="button"
                      onClick={() =>
                        window.open(
                          'https://wa.me/573103188070?text=Hola%2C%20necesito%20ayuda%20con%20el%20formulario',
                          '_blank'
                        )
                      }
                      className="bg-[#25D366] mt-2 sm:mt-0 text-white h-8 px-4 py-2 flex items-center gap-2 justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#1ebc59] w-full sm:w-auto"
                    >
                      <FaWhatsapp size={16} />
                      WhatsApp
                    </button>
                  </div>

                  <div className="flex w-full items-end gap-4">
                    <div className="flex-1">
                      <SelectConSearch
                        label="Establecimiento"
                        options={selectEstablecimientosPorNit}
                        value={formData.establecimientoId}
                        onChange={handleEstablecimientoChange}
                        error={errors.resolucion}
                      />
                    </div>

                    <div className="flex-1">
                      <SelectConSearch
                        label="Tipo De Documento"
                        options={['Tipos de documentos']}
                        value={formData.resolucion}
                        onChange={() => console.log('Hola bola')}
                        error={errors.resolucion}
                      />
                    </div>
                  </div>

                  <div className="flex items-end gap-4">
                    <div className="flex-1">
                      <SelectConSearch
                        label="Resoluciones"
                        options={selectResoluciones}
                        value={formData.resolucion}
                        onChange={handleResolucionChange}
                        error={errors.resolucion}
                      />
                    </div>
                    <BotonQuality
                      label="Guardar"
                      onClick={() => console.log('Guardado!')}
                    />
                  </div>

                  <InputField
                    label="Tipo De Documento ID"
                    name="tipoDeDocumentoId"
                    value={formData.tipoDeDocumentoId || ''}
                    onChange={() => {}}
                    readOnly={true}
                  />

                  <InputField
                    label="Prefijo"
                    name="prefijo"
                    value={formData.prefijo || ''}
                    onChange={() => {}}
                    readOnly={true}
                  />

                  <InputField
                    label="Fecha De Resolución"
                    name="fechaDeResolucion"
                    value={formData.fechaDeResolucion || ''}
                    onChange={() => {}}
                    readOnly={true}
                  />

                  <InputField
                    label="Clave Técnica"
                    name="claveTecnica"
                    value={formData.claveTecnica || ''}
                    onChange={() => {}}
                    readOnly={true}
                  />

                  <InputField
                    label="Fecha de Inicio"
                    name="fechaInicio"
                    value={formData.fechaInicio || ''}
                    onChange={() => {}}
                    readOnly={true}
                  />

                  <InputField
                    label="Fecha Final"
                    name="fechaHasta"
                    value={formData.fechaHasta || ''}
                    onChange={() => {}}
                    readOnly={true}
                  />

                  <InputField
                    label="Generated to Date"
                    name="generatedToDate"
                    value={formData.generatedToDate || ''}
                    onChange={() => {}}
                    readOnly={true}
                  />

                  <InputField
                    label="Resolución Desde"
                    name="resolucionDesde"
                    value={formData.resolucionDesde || ''}
                    onChange={() => {}}
                    readOnly={true}
                  />

                  <InputField
                    label="Resolución Hasta"
                    name="resolucionHasta"
                    value={formData.resolucionHasta || ''}
                    onChange={() => {}}
                    readOnly={true}
                  />

                  <button
                    type="button"
                    onClick={handleSubmitResolucion}
                    className="bg-[#00A7E1] mt-4 text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-32"
                  >
                    Enviar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {apiconfig ? <Spinner /> : ''}
      </LayoutAdmi>
    </PrivateRoute>
  );
}
