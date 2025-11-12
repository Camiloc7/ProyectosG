'use client';

import React, { useRef } from 'react';
import { useState } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import SelectConSearch from '@/components/ui/selectConSearch';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { validateTextos } from '@/app/gestionDeFacturasElectronicas/validations';
import TablaDeItems from './tablaDeFacturaCompra';
import { Calendar } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import { useComprasStore } from '@/store/useComprasStore';

const proveedores: string[] = ['1', '2', '5'];
const centrosDeCosto: string[] = ['111111', '5'];
const cuentasDeGasto: string[] = ['No especificado', 'Contado', 'Credito'];
const tiposDeGastos: string[] = ['No especificado', 'Contado', 'Credito'];
const formasDePago: string[] = ['No especificado', 'Contado', 'Credito'];
const mediosDePago: string[] = ['No especificado', 'Contado', 'Credito'];
const plazos: string[] = ['Manual', 'Catorcenal', 'Mensual'];

interface FormData {
  proveedor: string;
  centroDeCosto: string;
  fecha: string;
  vencimiento: string;
  cuentasDeGasto: string;
  facturaElectornicaDeCompra: string;
  tipoDeGasto: string;
  descripcion: string;
  valor: string;
  unidadDeMedida: string;
  descuentos: string;
  cargos: string;
  iva: string;
  retefuente: string;
  reteica: string;
  referencia: string;
  cantidad: string;
  observaciones: string;
  anticipo: string;
  anticipoChecked: boolean;
  formaDePago: string;
  cuotas: string;
  consecutivoCuota: string;
  medioDePago: string;
}

interface Errors {
  proveedor: boolean;
  centroDeCosto: boolean;
  vencimiento: boolean;
  cuentasDeGasto: boolean;
  facturaElectornicaDeCompra: boolean;
  tipoDeGasto: boolean;
  descripcion: boolean;
  valor: boolean;
  unidadDeMedida: boolean;
  descuentos: boolean;
  cargos: boolean;
  iva: boolean;
  retefuente: boolean;
  reteica: boolean;
  referencia: boolean;
  cantidad: boolean;
  observaciones: boolean;
  anticipo: boolean;
  formaDePago: boolean;
  cuotas: boolean;
  consecutivoCuota: boolean;
  medioDePago: boolean;
}

export default function FacturaCompra() {
  const { postFacturaCompra } = useComprasStore();

  const [formData, setFormData] = useState<FormData>({
    proveedor: '',
    centroDeCosto: '',
    fecha: new Date().toISOString().split('T')[0],
    vencimiento: '',
    cuentasDeGasto: '',
    facturaElectornicaDeCompra: '',
    tipoDeGasto: '',
    descripcion: '',
    valor: '',
    unidadDeMedida: '',
    descuentos: '',
    cargos: '',
    iva: '',
    retefuente: '',
    reteica: '',
    referencia: '',
    cantidad: '',
    observaciones: '',
    anticipo: '',
    anticipoChecked: false,
    formaDePago: '',
    cuotas: '',
    consecutivoCuota: '',
    medioDePago: '',
  });
  const [errors, setErrors] = useState<Errors>({
    proveedor: false,
    centroDeCosto: false,
    vencimiento: false,
    cuentasDeGasto: false,
    facturaElectornicaDeCompra: false,
    tipoDeGasto: false,
    descripcion: false,
    valor: false,
    unidadDeMedida: false,
    descuentos: false,
    cargos: false,
    iva: false,
    retefuente: false,
    reteica: false,
    referencia: false,
    cantidad: false,
    observaciones: false,
    anticipo: false,
    formaDePago: false,
    cuotas: false,
    consecutivoCuota: false,
    medioDePago: false,
  });
  const [items, setItems] = useState<any[]>([]); // Estado para almacenar los items
  const [itemError, setItemError] = useState<string>(''); // Estado para el mensaje de error de los items
  const [showCalendarModal, setShowCalendarModal] = useState(false); // Estado para controlar la visibilidad del modal
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleIconClick = () => {
    setShowCalendarModal(true); // Muestra el modal al hacer clic en el ícono
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        vencimiento: date.toISOString().split('T')[0], // Formato de fecha correcto
      }));
    } else {
      // En caso de que el valor sea null, podemos decidir si manejarlo de alguna forma, por ejemplo:
      setFormData((prev) => ({
        ...prev,
        vencimiento: '',
      }));
    }
    setShowCalendarModal(false); // Cierra el modal después de seleccionar o borrar la fecha
  };

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

    // Resetear errores antes de la validación
    Object.keys(errorState).forEach((key) => {
      errorState[key as keyof Errors] = false;
    });

    // Validaciones de los campos del formulario
    const isFacturaElectornicaDeCompraValid = validateTextos(
      formData.facturaElectornicaDeCompra
    );

    // Actualizar estado de errores
    errorState.facturaElectornicaDeCompra = !isFacturaElectornicaDeCompraValid;

    // Actualizar el estado de errores en el formulario
    setErrors(errorState);

    // Determinar si hay errores
    const hasErrors = Object.values(errorState).some((value) => value);

    if (hasErrors) {
      console.error('Errores detectados. El formulario no se enviará.');
      return;
    }

    // formData listo para enviar
    postFacturaCompra(formData);
  };

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof FormData
  ) => {
    const { checked } = e.target;
    setFormData((prev) => ({ ...prev, [field]: checked }));

    // Si se desmarca el checkbox, limpiamos el campo correspondiente
    if (!checked) {
      setFormData((prev) => ({ ...prev, [`${field}Value`]: '' }));
    }
  };

  const handleAddItem = () => {
    const errorState = { ...errors }; // Copiar el estado actual de errores

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

    const newItem = {
      descripcion: formData.descripcion,
      referencia: formData.referencia,
      valor: formData.valor,
      unidadDeMedida: formData.unidadDeMedida,
      cargos: formData.cargos,
      descuentos: formData.descuentos,
      iva: formData.iva,
      retefuente: formData.retefuente,
      retelca: formData.reteica,
    };

    setItems((prevItems) => [...prevItems, newItem]);

    // setFormData({
    //   ...formData,
    //   descripcion: "",
    //   referencia: "",
    //   valor: "",
    //   unidadDeMedida: "",
    //   cargos: "",
    //   descuentos: "",
    //   iva: "",
    //   retefuente: "",
    //   reteica: "",
    //   cantidad: "",
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
                Facturación Electrónica de Compra
              </h1>
              <h2 className="w-full min-[525px]:mt-[20px] min-[309px]:mt-[60px] min-[1px]:mt-[80px] mt-14 text-base font-montserrat font-normal text-[#6F6F6F]">
                rodrigoarielgajardo@gmail.com
              </h2>
            </div>

            {/* segundo contenedor */}
            <div className="mt-10 font-montserrat font-normal text-[#6F6F6F] text-sm ">
              <SelectConSearch
                label="Proveedor"
                options={proveedores}
                placeholder="Buscar un proveedor"
                value={formData.proveedor}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, proveedor: value }));
                  setErrors((prev) => ({ ...prev, proveedor: !value }));
                }}
                error={errors.proveedor}
                errorMessage="Debes seleccionar un proveedor"
              />

              <SelectConSearch
                label="Centro de costo"
                options={centrosDeCosto}
                placeholder="Buscar un centro de costo"
                value={formData.centroDeCosto}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, centroDeCosto: value }));
                  setErrors((prev) => ({ ...prev, centroDeCosto: !value }));
                }}
                error={errors.centroDeCosto}
                errorMessage="Debes seleccionar un centro de costo"
              />

              {/* Campo Fecha y vencimiento*/}
              <div className="flex flex-col sm:flex-row justify-between gap-6 mt-4">
                <div className="sm:w-[48%] w-full">
                  <label>Fecha</label>
                  <input
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    className="mt-4 w-full h-10 px-4 border border-[#00A7E1] rounded-[25px] text-[#C3C3C3] text-sm focus:ring-blue-300 focus:outline-none shadow-sm"
                    readOnly
                  />
                </div>

                {/* Campo vencimiento */}
                <div className="sm:w-[48%] w-full">
                  <label>Vencimiento</label>
                  <div className="relative mt-4">
                    <input
                      ref={inputRef}
                      type="date"
                      name="vencimiento"
                      value={formData.vencimiento}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          vencimiento: e.target.value,
                        }))
                      }
                      className={`w-full h-10 px-4 pr-10 border border-[#00A7E1] text-[#C3C3C3]
                        rounded-[25px] text-sm focus:ring-blue-300 focus:outline-none shadow-sm
                        appearance-none [&::-webkit-calendar-picker-indicator]:hidden`} // Eliminar el ícono predeterminado
                    />
                    <Calendar
                      onClick={handleIconClick}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#C3C3C3] cursor-pointer"
                    />
                  </div>

                  {/* Modal de selección de fecha */}
                  {showCalendarModal && (
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-[201]">
                      <div className="bg-white p-4 rounded-lg shadow-lg w-[90%] sm:w-[250px] md:w-[300px] lg:w-[350px] xl:w-[400px] justify-center">
                        <h2 className="text-center text-lg font-semibold mb-3">
                          Seleccionar Fecha
                        </h2>
                        <div className="justify-center text-center">
                          <DatePicker
                            selected={
                              formData.vencimiento
                                ? new Date(formData.vencimiento)
                                : null
                            }
                            onChange={handleDateChange}
                            inline // Muestra el calendario inline
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
              </div>

              <SelectConSearch
                label="Cuenta de cobro"
                options={cuentasDeGasto}
                placeholder="Buscar una Cuenta de cobro"
                value={formData.cuentasDeGasto}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, cuentasDeGasto: value }));
                  setErrors((prev) => ({ ...prev, cuentasDeGasto: !value }));
                }}
                error={errors.cuentasDeGasto}
                errorMessage="Debes seleccionar una Cuenta de cobro"
              />

              {/* Factura electronica de compra */}
              <div className="w-full mt-4">
                <label>
                  Factura electronica de compra
                  <span
                    className={`text-red-500 ${
                      errors.facturaElectornicaDeCompra ? '' : 'invisible'
                    }`}
                  >
                    *
                  </span>
                </label>
                <input
                  type="number"
                  name="facturaElectornicaDeCompra"
                  value={formData.facturaElectornicaDeCompra}
                  placeholder="Ingrese consecutivo"
                  className={`mt-4 w-full h-10 px-4 border ${
                    errors.facturaElectornicaDeCompra
                      ? 'border-red-500'
                      : 'border-[#00A7E1]'
                  }
                      rounded-[25px] text-[#00A7E1]  text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
                {errors.facturaElectornicaDeCompra && (
                  <p className="text-red-500 text-sm mt-1">
                    El campo es obligatorio.
                  </p>
                )}
              </div>

              {/* Tipo de negociacion */}
              <SelectConSearch
                label="Tipo de gasto / costo"
                options={tiposDeGastos}
                placeholder="Buscar un tipo de gasto"
                value={formData.tipoDeGasto}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, tipoDeGasto: value }));
                  setErrors((prev) => ({ ...prev, tipoDeGasto: !value }));
                }}
                error={errors.tipoDeGasto}
                errorMessage="Debes seleccionar un tipo de gasto"
              />

              {/* Plazo - solo se muestra si la opción es "Credito" */}
              {formData.tipoDeGasto === 'Credito' && (
                <div className="flex flex-col mt-4">
                  <label className="">
                    Plazo
                    <span
                      className={`text-red-500 ${
                        errors.cuotas ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="mt-4">
                    <SimpleSelect
                      options={plazos}
                      width="100%"
                      value={formData.cuotas}
                      onChange={(value) => {
                        setFormData((prev) => ({ ...prev, cuotas: value }));
                        setErrors((prev) => ({ ...prev, cuotas: false }));
                      }}
                      error={errors.cuotas}
                    />
                  </div>
                  {errors.cuotas && (
                    <p className="text-red-500 text-sm mt-1">
                      Debe seleccionar un plazo.
                    </p>
                  )}
                </div>
              )}

              <hr className="border-[#EFF0F6] border-2 my-10"></hr>

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

              {/*Valor */}
              <div className="w-full mt-3">
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

              {/* Varios campos en doble linea */}
              <div className="flex flex-col sm:flex-row justify-between gap-6 mt-4">
                {/* Primera columna (izquierda) */}
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

                  {/* Cargos */}
                  <div className="w-full mt-4">
                    <label className="">
                      Cargos
                      <span
                        className={`text-red-500 ${
                          errors.cargos ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <input
                      type="number"
                      name="cargos"
                      value={formData.cargos}
                      placeholder="Ingrese los cargos"
                      className={`mt-4 w-full h-10 px-4 border ${
                        errors.cargos ? 'border-red-500' : 'border-[#00A7E1]'
                      } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                      onChange={handleChange}
                    />
                    {errors.cargos && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>

                  {/* ReteFuente */}
                  <div className="w-full mt-4">
                    <label className="">
                      Retefuente
                      <span
                        className={`text-red-500 ${
                          errors.retefuente ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <input
                      type="number"
                      name="retefuente"
                      value={formData.retefuente}
                      placeholder="Ingrese retefuente"
                      className={`mt-4 w-full h-10 px-4 border ${
                        errors.retefuente
                          ? 'border-red-500'
                          : 'border-[#00A7E1]'
                      } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                      onChange={handleChange}
                    />
                    {errors.retefuente && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>

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

                {/* Segunda columna (derecha) */}
                <div className="sm:w-[48%] w-full">
                  {/* Descuentos */}
                  <div className="w-full mt-4">
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
                    {errors.descuentos && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>

                  {/* IVA */}
                  <div className="w-full mt-4">
                    <label className="">
                      IVA
                      <span
                        className={`text-red-500 ${
                          errors.iva ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <input
                      type="number"
                      name="iva"
                      value={formData.iva}
                      placeholder="Ingrese impuestos"
                      className={`mt-4 w-full h-10 px-4 border ${
                        errors.iva ? 'border-red-500' : 'border-[#00A7E1]'
                      } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                      onChange={handleChange}
                    />
                    {errors.iva && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>

                  {/* Reteica */}
                  <div className="w-full mt-4">
                    <label className="">
                      Reteica
                      <span
                        className={`text-red-500 ${
                          errors.reteica ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <input
                      type="number"
                      name="reteica"
                      value={formData.reteica}
                      placeholder="Ingrese reteica"
                      className={`mt-4 w-full h-10 px-4 border ${
                        errors.reteica ? 'border-red-500' : 'border-[#00A7E1]'
                      } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                      onChange={handleChange}
                    />
                    {errors.reteica && (
                      <p className="text-red-500 text-sm mt-1">
                        El campo es obligatorio.
                      </p>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="w-full mt-4">
                    <label className="">
                      Cantidad
                      <span
                        className={`text-red-500 ${
                          errors.cantidad ? '' : 'invisible'
                        }`}
                      >
                        *
                      </span>
                    </label>
                    <div className="flex">
                      <input
                        type="number"
                        name="cantidad"
                        value={formData.cantidad}
                        placeholder="Ingrese cantidad"
                        className={`mt-4 w-full h-10 px-4 border ${
                          errors.cantidad
                            ? 'border-red-500'
                            : 'border-[#00A7E1]'
                        } rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                        onChange={handleChange}
                      />
                      {errors.cantidad && (
                        <p className="text-red-500 text-sm mt-1">
                          El campo es obligatorio.
                        </p>
                      )}
                      {/* <button
                        type="button"
                        onClick={handleAddItem}
                        className="w-10 ml-4 mt-4 h-10 flex-shrink-0 flex items-center justify-center rounded-[20px] border-[1px] border-[#00A7E1] hover:bg-blue-200 text-2xl leading-[2.5rem] text-[#C3C3C3]"
                      >
                        +
                      </button> */}
                      <button
                        onClick={(e) => {
                          e.preventDefault(); // Evita la recarga de la página
                          handleAddItem(); // Llama a la función de agregar el item
                        }}
                        className="absolute mt-[108px] ml-[300px] bg-[#00A7E1] font-bold text-white h-8 px-14 text-xs rounded-full hover:bg-[#008ec1]"
                      >
                        Agregar Item
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {itemError && (
                <p className="text-red-500 text-sm mt-1 w-full text-center">
                  {itemError}
                </p>
              )}

              {/* Tabla */}
              <TablaDeItems
                items={items}
                onItemsChange={setItems}
                allowEdit={true}
              />

              {/*Observaciones  */}
              <div className="w-full mt-10">
                <label className="">
                  Observaciones
                  <span
                    className={`text-red-500 ${
                      errors.observaciones ? '' : 'invisible'
                    }`}
                  >
                    *
                  </span>
                </label>
                <input
                  type="text"
                  name="observaciones"
                  value={formData.observaciones}
                  placeholder="Ingrese sus observaciones"
                  className={`mt-4 w-full h-10 px-4 border ${
                    errors.observaciones ? 'border-red-500' : 'border-[#00A7E1]'
                  }
                      rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  onChange={handleChange}
                />
                {errors.observaciones && (
                  <p className="text-red-500 text-sm mt-1">
                    El campo es obligatorio.
                  </p>
                )}
              </div>

              {/* Anticipo */}
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.anticipoChecked}
                    onChange={(e) => handleCheckboxChange(e, 'anticipoChecked')}
                    className="hidden"
                  />
                  <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                    <span
                      className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                        formData.anticipoChecked ? 'scale-100' : 'scale-0'
                      }`}
                    ></span>
                  </span>
                  <span className="text-sm ml-2  ">
                    Anticipo
                    <span
                      className={`text-red-500 ${
                        errors.anticipo ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </span>
                </label>
              </div>

              <SelectConSearch
                label="Forma de pago"
                options={formasDePago}
                placeholder="Buscar una forma de pago"
                value={formData.formaDePago}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, formaDePago: value }));
                  setErrors((prev) => ({ ...prev, formaDePago: !value }));
                }}
                error={errors.formaDePago}
                errorMessage="Debes seleccionar una forma de pago"
              />

              <SelectConSearch
                label="Medio de pago"
                options={mediosDePago}
                placeholder="Buscar un Medio de pago"
                value={formData.medioDePago}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, medioDePago: value }));
                  setErrors((prev) => ({ ...prev, medioDePago: !value }));
                }}
                error={errors.medioDePago}
                errorMessage="Debes seleccionar un Medio de pago"
              />

              {/* Utimos botones */}
              <div className="flex justify-between items-center mt-10 ">
                <button className="bg-[#333332] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b]">
                  Vista Previa
                </button>
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
      </div>
    </LayoutAdmi>
  );
}
