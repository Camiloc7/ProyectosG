'use client';

import React, { useRef } from 'react';
import { useState } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import SelectConSearch from '@/components/ui/selectConSearch';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { validateTextos } from '@/app/gestionDeFacturasElectronicas/validations';
import { IoIosSearch } from 'react-icons/io';
import 'react-datepicker/dist/react-datepicker.css';

const cargos: string[] = ['cargo 1', 'cargo 2', 'cargo 3'];
const iva: string[] = ['iva 1', 'iva 2', 'iva 3'];
const retefuente: string[] = ['retefuente 1', 'retefuente 2', 'retefuente 3'];
const reteica: string[] = ['reteica 1', 'reteica 2', 'reteica 3'];

interface FormData {
  fecha: string;
  descripcion: string;
  valor: string;
  unidadDeMedida: string;
  descuentos: string;
  tipoDescuento: string;
  cargos: string;
  iva: string;
  retefuente: string;
  reteica: string;
  referencia: string;
}

interface Errors {
  descripcion: boolean;
  valor: boolean;
  unidadDeMedida: boolean;
  descuentos: boolean;
  cargos: boolean;
  iva: boolean;
  retefuente: boolean;
  reteica: boolean;
  referencia: boolean;
}

export default function ItemsDeCompra() {
  const [formData, setFormData] = useState<FormData>({
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    valor: '',
    unidadDeMedida: '',
    descuentos: '',
    tipoDescuento: '%',
    cargos: '',
    iva: '',
    retefuente: '',
    reteica: '',
    referencia: '',
  });
  const [errors, setErrors] = useState<Errors>({
    descripcion: false,
    valor: false,
    unidadDeMedida: false,
    descuentos: false,
    cargos: false,
    iva: false,
    retefuente: false,
    reteica: false,
    referencia: false,
  });
  const [itemError, setItemError] = useState<string>(''); // Estado para el mensaje de error de los items

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
      facturaElectornicaDeCompra: validateTextos,
      descripcion: validateTextos,
      valor: validateTextos,
      unidadDeMedida: validateTextos,
      cargos: validateTextos,
      retefuente: validateTextos,
      referencia: validateTextos,
      descuentos: validateTextos,
      iva: validateTextos,
      reteica: validateTextos,
      cantidad: validateTextos,
      observaciones: validateTextos,
    };

    // Validar en tiempo real
    if (validators[name]) {
      setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
    }
  };

  const handleSubmit = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.preventDefault();

    // Copiar el estado actual de errores
    const errorState = { ...errors };

    const isDescripcionValid = validateTextos(formData.descripcion);
    const isValorValid = validateTextos(formData.valor);
    const isUnidadDeMedidaValid = validateTextos(formData.unidadDeMedida);
    const isCargosValid = validateTextos(formData.cargos);
    const isRetefuenteValid = validateTextos(formData.retefuente);
    const isReferenciaValid = validateTextos(formData.referencia);
    const isDescuentosValid = validateTextos(formData.descuentos);
    const isIvaValid = validateTextos(formData.iva);
    const isReteicaValid = validateTextos(formData.reteica);

    errorState.descripcion = !isDescripcionValid;
    errorState.valor = !isValorValid;
    errorState.unidadDeMedida = !isUnidadDeMedidaValid;
    errorState.cargos = !isCargosValid;
    errorState.retefuente = !isRetefuenteValid;
    errorState.referencia = !isReferenciaValid;
    errorState.descuentos = !isDescuentosValid;
    errorState.iva = !isIvaValid;
    errorState.reteica = !isReteicaValid;

    setErrors(errorState);

    const hasErrors =
      !isDescripcionValid ||
      !isUnidadDeMedidaValid ||
      !isCargosValid ||
      !isRetefuenteValid ||
      !isReferenciaValid ||
      !isDescuentosValid ||
      !isIvaValid ||
      !isReteicaValid ||
      !isValorValid;

    if (hasErrors) {
      setItemError(
        'Por favor, complete todos los campos requeridos para agregar un item.'
      );
      return;
    }

    // Resetear errores antes de la validación
    Object.keys(errorState).forEach((key) => {
      errorState[key as keyof Errors] = false;
    });

    // Actualizar el estado de errores en el formulario
    setErrors(errorState);

    // formData listo para enviar

    const listoParaEnviar = {
      fecha: formData.fecha,
      descripcion: formData.descripcion,
      valor: formData.valor,
      unidadDeMedida: formData.unidadDeMedida,
      descuentos: formData.descuentos,
      tipoDescuento: formData.tipoDescuento,
      cargos: formData.cargos,
      iva: formData.iva,
      retefuente: formData.retefuente,
      referencia: formData.referencia,
    };

    // Limpiar el estado local

    // setFormData({
    //   fecha: new Date().toISOString().split("T")[0], // Restablece la fecha actual
    //   descripcion: "",
    //   valor: "",
    //   unidadDeMedida: "",
    //   descuentos: "",
    //   tipoDescuento: "%",
    //   cargos: "",
    //   iva: "",
    //   retefuente: "",
    //   reteica: "",
    //   referencia: "",
    // });
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
                Items De Compra
              </h1>
              <h2 className="w-full min-[525px]:mt-[20px] min-[309px]:mt-[60px] min-[1px]:mt-[80px] mt-14 text-base font-montserrat font-normal text-[#6F6F6F]">
                rodrigoarielgajardo@gmail.com
              </h2>
            </div>

            {/* segundo contenedor */}
            <div className="mt-10 font-montserrat font-normal text-[#6F6F6F] text-sm ">
              {/* Primera doble fila */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 mt-4">
                {/* Primera columna */}
                <div className="sm:w-[48%] w-full">
                  {/* Referencia */}
                  <div className="w-full mt-4">
                    <label className="">
                      Referencia
                      <span
                        className={`text-red-500 ${
                          errors.referencia ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <input
                      type="text"
                      name="referencia"
                      value={formData.referencia}
                      placeholder="Ingrese referencia"
                      className={`mt-4 w-full h-10 px-4 border ${
                        errors.referencia
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                      onChange={handleChange}
                    />
                    {errors.referencia && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>
                </div>

                {/* Segunda columna */}
                <div className="sm:w-[48%] w-full">
                  {/* Unidad de medida */}
                  <div className="w-full mt-4">
                    <label className="">
                      Unidad de medida
                      <span
                        className={`text-red-500 ${
                          errors.unidadDeMedida ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <input
                      type="text"
                      name="unidadDeMedida"
                      value={formData.unidadDeMedida}
                      placeholder="Ingrese la unidad de medida"
                      className={`mt-4 w-full h-10 px-4 border ${
                        errors.unidadDeMedida
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                      onChange={handleChange}
                    />
                    {errors.unidadDeMedida && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Campo "descripcion" */}
              <div className="mt-4">
                <label className="">
                  Descripcion
                  <span
                    className={`text-red-500 ${
                      errors.descripcion ? '' : 'invisible'
                    }`}
                  >
                    *
                  </span>
                </label>
                <textarea
                  name="descripcion"
                  placeholder="Descripcion "
                  value={formData.descripcion}
                  className={`w-full h-15 px-4 border rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm mt-4 ${
                    errors.descripcion ? 'border-red-500' : 'border-[#00A7E1]'
                  }`}
                  onChange={handleChange}
                />
              </div>

              {/* Fecha */}
              <div className="sm:w-[48%] w-full mt-4">
                <label>Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  className="mt-4 w-full h-10 px-4 border border-[#00A7E1] rounded-[25px] text-[#C3C3C3] text-sm focus:ring-blue-300 focus:outline-none shadow-sm"
                  readOnly
                />
              </div>

              {/* Varios campos en doble linea */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 mt-4">
                {/* Primera columna (izquierda) */}
                <div className="sm:w-[48%] w-full">
                  {/*Valor */}
                  <div className="w-full mt-4">
                    <label className="">
                      Valor
                      <span
                        className={`text-red-500 ${
                          errors.valor ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <input
                      type="number"
                      name="valor"
                      value={formData.valor}
                      placeholder="Ingrese consecutivo"
                      className={`mt-4 w-full h-10 px-4 border ${
                        errors.valor ? 'border-red-500' : 'border-[#00A7E1]'
                      }
                          rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                      onChange={handleChange}
                    />
                    {errors.valor && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>

                  {/* Cargos */}
                  <div className="w-full mt-4">
                    Cargos
                    <span
                      className={`text-red-500 ${
                        errors.cargos ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                    <div className="mt-4">
                      <SimpleSelect
                        options={cargos}
                        width="100%"
                        value={formData.cargos}
                        placeholder="Cargos"
                        onChange={(value) => {
                          setFormData((prev) => ({ ...prev, cargos: value }));
                          setErrors((prev) => ({ ...prev, cargos: false }));
                        }}
                        error={errors.cargos}
                      />
                    </div>
                    {errors.cargos && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>

                  {/* Retefuente */}
                  <div className="w-full mt-4">
                    Retefuente
                    <span
                      className={`text-red-500 ${
                        errors.retefuente ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                    <div className="mt-4">
                      <SimpleSelect
                        options={retefuente}
                        width="100%"
                        value={formData.retefuente}
                        placeholder="Retefuente"
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            retefuente: value,
                          }));
                          setErrors((prev) => ({ ...prev, retefuente: false }));
                        }}
                        error={errors.retefuente}
                      />
                    </div>
                    {errors.cargos && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>
                </div>

                {/* Segunda columna (derecha) */}
                <div className="sm:w-[48%] w-full">
                  {/* Descuentos */}
                  <div>
                    <div className="w-full mt-4 flex">
                      <div className="w-full">
                        <label className="">
                          Descuentos
                          <span
                            className={`text-red-500 ${
                              errors.descuentos ? '' : 'invisible'
                            }`}
                          >
                            *
                          </span>
                        </label>
                        <input
                          type="number"
                          name="descuentos"
                          value={formData.descuentos}
                          placeholder="Ingrese descuentos"
                          className={`mt-4 w-full h-10 px-4 border ${
                            errors.descuentos
                              ? 'border-red-500'
                              : 'border-[#00A7E1]'
                          } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                          onChange={handleChange}
                        />
                      </div>
                      <select
                        name="tipoDescuento"
                        value={formData.tipoDescuento}
                        onChange={handleChange}
                        className="w-10 h-10 mt-9 ml-3 flex-shrink-0 flex items-center justify-center rounded-[20px] border border-[#00A7E1] bg-white hover:bg-blue-200 text-[#00A7E1] text-lg font-bold focus:border-[#00A7E1] focus:outline-none"
                      >
                        <option value="%">%</option>
                        <option value="$">$</option>
                      </select>
                    </div>
                    {errors.descuentos && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>

                  {/* IVA */}
                  <div className="w-full mt-4">
                    IVA
                    <span
                      className={`text-red-500 ${
                        errors.iva ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                    <div className="mt-4">
                      <SimpleSelect
                        options={iva}
                        width="100%"
                        value={formData.iva}
                        placeholder="IVA"
                        onChange={(value) => {
                          setFormData((prev) => ({ ...prev, iva: value }));
                          setErrors((prev) => ({ ...prev, iva: false }));
                        }}
                        error={errors.iva}
                      />
                    </div>
                    {errors.cargos && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>

                  {/* Reteica */}
                  <div className="w-full mt-4">
                    Reteica
                    <span
                      className={`text-red-500 ${
                        errors.reteica ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                    <div className="mt-4">
                      <SimpleSelect
                        options={reteica}
                        width="100%"
                        value={formData.reteica}
                        placeholder="Reteica"
                        onChange={(value) => {
                          setFormData((prev) => ({ ...prev, reteica: value }));
                          setErrors((prev) => ({ ...prev, reteica: false }));
                        }}
                        error={errors.reteica}
                      />
                    </div>
                    {errors.cargos && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>
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
      </div>
    </LayoutAdmi>
  );
}
