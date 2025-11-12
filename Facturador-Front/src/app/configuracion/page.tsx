'use client';

import React, { useEffect } from 'react';
import { useState } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import SelectConSearch from '@/components/ui/selectConSearch';
import SimpleSelect from '@/components/ui/SimpleSelect';
import InputField from '@/components/ui/InputField';
import { useRegionesStore } from '@/store/useRegionesStore';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';
import { validateTextos } from '@/app/gestionDeFacturasElectronicas/validations';
import 'react-datepicker/dist/react-datepicker.css';
import { useUserStore } from '@/store/useUser';

import Spinner from '@/components/feedback/Spinner';
import MultiSelect from '@/components/ui/MultiSelect';

const tributarias: string[] = [
  '[No especificado]',
  '1 - IVA',
  '4 - INC',
  'ZA - IVA e INC',
  'ZZ - No aplica',
];

const tipoPersonaes = [
  { id: '1', nombre: 'Responsable de IVA' },
  { id: '2', nombre: 'No Responsable de IVA' },
];

interface FormData {
  usuario: string;
  contraseña: string;
  nombreDeLaEmpresa: string;
  tipoDoc: string;
  nit: string;
  dv: string;
  direccion: string;
  telefono: string;
  correo: string;
  regimen: string;
  responsabilidadTri: string;
  tipoDeContribuyente: string;
  pais: string;
  departamento: string;
  municipio: string;
  ica: string;
  tipoDeResponsabilidad: string;
  ciiu: (string | number)[];
  nomactividad: string;
  tipoPersona: string;
  imagen: any;
  firma: any;
}

interface Errors {
  usuario: boolean;
  contraseña: boolean;
  nombreDeLaEmpresa: boolean;
  tipoDoc: boolean;
  nit: boolean;
  dv: boolean;
  direccion: boolean;
  telefono: boolean;
  correo: boolean;
  regimen: boolean;
  responsabilidadTri: boolean;
  tipoDeContribuyente: boolean;
  pais: boolean;
  departamento: boolean;
  municipio: boolean;
  ica: boolean;
  tipoDeResponsabilidad: boolean;
  ciiu: boolean;
  nomactividad: boolean;
  tipoPersona: boolean;
  tipoDeEmpresa: boolean;
  imagen: boolean;
  firma: boolean;
}

export default function Configuracion() {
  const { fetchCategoriasEmpresariales, categoriasEmpresariales } =
    useDatosExtraStore();
  const {
    paises,
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

  const {
    infoDelUsuario,
    traerInfoDeUsuarios,
    todaLaInfoUsuario,
    actualizarUsuario,
    loading,
  } = useUserStore();
  const [formData, setFormData] = useState<FormData>({
    usuario: '',
    contraseña: '',
    nombreDeLaEmpresa: '',
    tipoDoc: '',
    nit: '',
    dv: '',
    direccion: '',
    telefono: '',
    correo: '',
    regimen: '',
    responsabilidadTri: '',
    tipoDeContribuyente: '',
    pais: '',
    departamento: '',
    municipio: '',
    ica: '',
    tipoDeResponsabilidad: '',
    ciiu: [],
    nomactividad: '',
    tipoPersona: '',
    imagen: null,
    firma: null,
  });
  const [errors, setErrors] = useState<Errors>({
    usuario: false,
    contraseña: false,
    nombreDeLaEmpresa: false,
    tipoDoc: false,
    nit: false,
    dv: false,
    direccion: false,
    telefono: false,
    correo: false,
    regimen: false,
    responsabilidadTri: false,
    tipoDeContribuyente: false,
    pais: false,
    departamento: false,
    municipio: false,
    ica: false,
    tipoDeResponsabilidad: false,
    ciiu: false,
    nomactividad: false,
    tipoPersona: false,
    tipoDeEmpresa: false,
    imagen: false,
    firma: false,
  });
  const [itemError, setItemError] = useState<string>(''); // Estado para el mensaje de error de los items

  useEffect(() => {
    traerInfoDeUsuarios();
    fetchCategoriasEmpresariales();
    fetchRegiones();
    fetchTiposDeDocumentos();
    fetchResponsabilidadesFiscales();
  }, []);

  //TODO AQUI ES DONDE PONEMOS LOS DATOS DEL BACK EN EL FORM DATA
  useEffect(() => {
    if (todaLaInfoUsuario) {
      setFormData({
        usuario: todaLaInfoUsuario.usuario || '',
        contraseña: '',
        nombreDeLaEmpresa: todaLaInfoUsuario.nombre || '',
        tipoDoc: todaLaInfoUsuario.tipoDoc || '',
        nit: todaLaInfoUsuario.nit || '',
        dv: todaLaInfoUsuario.dv || '',
        direccion: todaLaInfoUsuario.direccion || '',
        telefono: todaLaInfoUsuario.telefono || '',
        correo: todaLaInfoUsuario.correo || '',
        regimen: todaLaInfoUsuario.regimen || '',
        responsabilidadTri: todaLaInfoUsuario.responsabilidadTri || '',
        tipoDeContribuyente: todaLaInfoUsuario.tipoCon || '',
        pais: todaLaInfoUsuario.pais || '',
        departamento: todaLaInfoUsuario.departamento || '',
        municipio: todaLaInfoUsuario.municipio || '',
        ica: todaLaInfoUsuario.ica || '',
        tipoDeResponsabilidad: todaLaInfoUsuario.responsabilidad || '',
        ciiu: Array.isArray(todaLaInfoUsuario.ciiu)
          ? todaLaInfoUsuario.ciiu
          : [],
        // ciiu: [],
        nomactividad: todaLaInfoUsuario.nomActividad || '',
        tipoPersona: todaLaInfoUsuario.tipoPersona || '',
        imagen: todaLaInfoUsuario.imagen || null,
        firma: null,
      });
    }
  }, [todaLaInfoUsuario]);

  //Maneja todos los cambios en el form en tiempo real
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setItemError('');
    // Actualizar datos del formulario
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validaciones mapeadas
    const validators: Record<string, (value: string) => boolean> = {
      usuario: validateTextos,
      contraseña: validateTextos,
      nombreDeLaEmpresa: validateTextos,
      tipoDoc: validateTextos,
      nit: validateTextos,
      dv: validateTextos,
      direccion: validateTextos,
      telefono: validateTextos,
      correo: validateTextos,
      regimen: validateTextos,
      responsabilidadTri: validateTextos,
      tipoDeContribuyente: validateTextos,
      pais: validateTextos,
      departamento: validateTextos,
      municipio: validateTextos,
      ica: validateTextos,
      tipoDeResponsabilidad: validateTextos,
      ciiu: (val) =>
        Array.isArray(val) ? val.length > 0 : validateTextos(val),
      nomactividad: validateTextos,
      tipoPersona: validateTextos,
      tipoDeEmpresa: validateTextos,
    };

    // Validar en tiempo real
    if (validators[name]) {
      setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
    }
  };

  // Manejar cambio de MultiSelect para ciiu
  const handleCiiuChange = (vals: (string | number)[]) => {
    setFormData((prev) => ({ ...prev, ciiu: vals }));
    setErrors((prev) => ({ ...prev, ciiu: vals.length === 0 }));
    setItemError('');
  };

  const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();

    const formattedData = {
      USUARIO: formData.usuario,
      NOMBRE: formData.nombreDeLaEmpresa,
      NIT: formData.nit,
      DIRECCION: formData.direccion,
      CORREO: formData.correo,
      RESPONSABILIDADTRI: formData.responsabilidadTri,
      PAIS: formData.pais,
      MUNICIPIO: formData.municipio,
      RESPONSABILIDAD: formData.tipoDeResponsabilidad,
      NOMACTIVIDAD: formData.nomactividad,
      TIPODOC: formData.tipoDoc,
      DV: formData.dv,
      TELEFONO: formData.telefono,
      REGIMEN: formData.regimen,
      TIPOCON: formData.tipoDeContribuyente,
      DEPARTAMENTO: formData.departamento,
      ICA: formData.ica,
      CIIU: formData.ciiu,
      TIPOPERSONA: formData.tipoPersona,
    };

    actualizarUsuario(formattedData);
  };

  return (
    <LayoutAdmi>
      <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-12 w-full overflow-hidden">
        {/* Contenedor principal */}
        <div className="w-full max-w-[1152px] h-auto rounded-[20px] flex justify-center px-4 sm:px-12 pb-14 mx-auto bg-white">
          {/* Contenedor Gestor de facturas */}
          <div className="w-full max-w-full md:max-w-[1061px] mt-8 font-montserrat font-normal text-[#6F6F6F] text-sm ">
            {/* Primer contenedor */}
            <div className="">
              <h1 className="w-full h-10 text-3xl font-bold font-montserrat text-[#6F6F6F] mb-[20px] ">
                Mi Cuenta
              </h1>
              <h2 className="w-full min-[525px]:mt-[20px] min-[309px]:mt-[60px] min-[1px]:mt-[80px] mt-14 text-base font-montserrat font-normal text-[#6F6F6F]">
                {infoDelUsuario?.nombre}
              </h2>
            </div>

            {/* segundo contenedor */}
            <div className="mt-10 font-montserrat font-normal text-[#6F6F6F] text-sm ">
              {/* Doble columna */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 mt-4">
                {/* Primera columna (izquierda) */}
                <div className="sm:w-[48%] w-full">
                  {/* Usuario */}
                  <InputField
                    label="Usuario"
                    name="usuario"
                    value={formData.usuario}
                    error={errors.usuario}
                    onChange={handleChange}
                  />
                  {/* Nombre de la Empresa */}
                  <InputField
                    label="Nombre de la Empresa"
                    name="nombreDeLaEmpresa"
                    value={formData.nombreDeLaEmpresa}
                    error={errors.nombreDeLaEmpresa}
                    onChange={handleChange}
                  />
                  {/* Nit */}
                  <InputField
                    label="NIT"
                    name="nit"
                    value={formData.nit}
                    error={errors.nit}
                    onChange={handleChange}
                  />
                  {/* Dirección */}
                  <InputField
                    label="Dirección"
                    name="direccion"
                    value={formData.direccion}
                    error={errors.direccion}
                    onChange={handleChange}
                  />
                  {/* Correo */}
                  <InputField
                    label="Correo"
                    name="correo"
                    value={formData.correo}
                    error={errors.correo}
                    onChange={handleChange}
                  />
                  {/* responsabilidad Tributaria */}
                  <div className="w-full mt-4">
                    Responsabilidad Tributaria
                    <span
                      className={`text-red-500 ${
                        errors.responsabilidadTri ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                    <div className="mt-4">
                      <SimpleSelect
                        options={tributarias}
                        width="100%"
                        value={formData.responsabilidadTri}
                        placeholder="Seleccione responsabilidad tributaria"
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            responsabilidadTri: value,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            responsabilidadTri: false,
                          }));
                        }}
                        error={errors.responsabilidadTri}
                      />
                    </div>
                    {errors.responsabilidadTri && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>
                  {/* País */}
                  <div className="w-full mt-4">
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
                          errorMessage="El campo es obligatorio."
                        />
                      </div>
                    )}
                  </div>
                  {/* Municipios */}
                  <div className="w-full mt-4">
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
                          errorMessage="El campo es obligatorio."
                        />
                      </div>
                    )}
                  </div>
                  {/* Responsabilidades Fiscales */}
                  <div className="flex flex-col mt-4">
                    <label>
                      Responsabilidades Fiscales
                      <span
                        className={`text-red-500 ${
                          errors.tipoDeResponsabilidad ? '' : 'invisible'
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
                        value={formData.tipoDeResponsabilidad}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            tipoDeResponsabilidad: value,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            tipoDeResponsabilidad: !value,
                          }));
                        }}
                        error={errors.tipoDeResponsabilidad}
                      />
                      {errors.tipoDeResponsabilidad && (
                        <p className="text-red-500 text-sm mt-1">
                          El campo es obligatorio.
                        </p>
                      )}
                    </div>
                  </div>
                  {/* Actividad Principal */}
                  <InputField
                    label="Actividad Principal"
                    name="nomactividad"
                    value={formData.nomactividad}
                    error={errors.nomactividad}
                    onChange={handleChange}
                  />
                </div>

                {/* Segunda columna (derecha) */}
                <div className="sm:w-[48%] w-full">
                  {/* tipo documento */}
                  <div className="w-full mt-4">
                    Tipo De Documento
                    <span
                      className={`text-red-500 ${
                        errors.tipoDoc ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                    <div className="mt-4">
                      <SimpleSelect
                        options={documentos}
                        width="100%"
                        value={formData.tipoDoc}
                        placeholder="Seleccione tipo de Documento"
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            tipoDoc: value,
                          }));
                          setErrors((prev) => ({ ...prev, tipoDoc: false }));
                        }}
                        error={errors.tipoDoc}
                      />
                    </div>
                    {errors.tipoDoc && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>
                  {/* DV */}
                  <InputField
                    label="DV"
                    name="dv"
                    value={formData.dv}
                    error={errors.dv}
                    onChange={handleChange}
                  />
                  {/* Teléfono */}
                  <InputField
                    label="Teléfono"
                    name="telefono"
                    value={formData.telefono}
                    error={errors.telefono}
                    onChange={handleChange}
                  />
                  {/* Régimen */}
                  <InputField
                    label="Régimen"
                    name="regimen"
                    value={formData.regimen}
                    error={errors.regimen}
                    onChange={handleChange}
                  />
                  {/* Tipo de Contribuyente */}
                  <InputField
                    label="Tipo de Contribuyente"
                    name="tipoDeContribuyente"
                    value={formData.tipoDeContribuyente}
                    error={errors.tipoDeContribuyente}
                    onChange={handleChange}
                  />
                  {/* Departamento */}
                  <div className="w-full mt-4">
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
                          errorMessage="El campo es obligatorio."
                        />
                      </div>
                    )}
                  </div>
                  {/* ICA */}
                  <InputField
                    label="ICA"
                    name="ica"
                    value={formData.ica}
                    error={errors.ica}
                    onChange={handleChange}
                  />
                  {/* MultiSelect para CIIU */}
                  <div className="w-full mt-4">
                    <label className="font-montserrat font-normal text-[#6F6F6F] text-sm">
                      CIIU
                    </label>
                    <div className="mt-4">
                      <MultiSelect
                        options={categoriasEmpresariales}
                        value={formData.ciiu}
                        onChange={handleCiiuChange}
                        placeholder="Selecciona tus codigos CIIU"
                        maxSelection={4}
                        error={errors.ciiu}
                        errorMessage="Selecciona al menos un código CIIU"
                      />
                    </div>
                    {errors.ciiu && (
                      <p className="text-red-500 text-sm mt-1">
                        Selecciona al menos un código CIIU.
                      </p>
                    )}
                  </div>
                  {/* Tipo de Organización */}
                  <div className="w-full mt-4">
                    Tipo de Organización
                    <span
                      className={`text-red-500 ${
                        errors.tipoPersona ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                    <div className="mt-4">
                      <SimpleSelect
                        options={tipoPersonaes}
                        width="100%"
                        value={formData.tipoPersona}
                        placeholder="Seleccione tipo de organización"
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            tipoPersona: value,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            tipoPersona: false,
                          }));
                        }}
                        error={errors.tipoPersona}
                      />
                    </div>
                    {errors.tipoPersona && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>

                  <SelectConSearch
                    label="Establecimiento"
                    options={['Establecimientos']}
                    value={'Aun en desarrollo'}
                    onChange={(e) => console.log(e)}
                  />
                  {/* Firma */}
                  {/* <div className="mt-6">
                    <BotonSubirArchivos onSubmit={handleFirma} />
                  </div> */}
                </div>
              </div>
            </div>

            {itemError && (
              <p className="text-red-500 text-sm mt-4 w-full text-center">
                {itemError}
              </p>
            )}

            {/* Utimos botones */}
            <div className="flex justify-end items-center mt-10 ">
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="bg-[#00A7E1] text-white w-24 h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1]"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
        {loading ? <Spinner /> : ''}
      </div>
    </LayoutAdmi>
  );
}
