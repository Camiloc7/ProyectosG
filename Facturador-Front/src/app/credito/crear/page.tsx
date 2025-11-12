'use client';

import { useState, useRef, useEffect } from 'react';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { Button } from '@/components/ui/button';
import { CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Calendar } from 'lucide-react';
import TablaDeOrdenamiento from '@/components/ui/tablaDeOrdenamiento';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import { useFacturaStore } from '@/store/useFacturaStore';
import { useMetodosDePagoStore } from '@/store/useMetodosDePago';
import { useTiposDeOperacionStore } from '@/store/useTiposDeOperacionStore';
import { useNotasCreditoStore } from '@/store/useNotasCreditoStore';
import { useUserStore } from '@/store/useUser';
import Spinner from '@/components/feedback/Spinner';
interface Item {
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  porcentajeIva: number;
}

interface FormDataFecha {
  fecha: string;
}

const tiposDeNegociacion: string[] = ['No especificado', 'Contado', 'Credito'];
const plazos: string[] = ['Manual', 'Catorcenal', 'Mensual'];

interface FormData {
  factura: string;
  fecha: string;
  tipoDeNegociacion: string;
  vencimiento: string;
  descripcion: string;
  valor: string;
  cantidad: string;
  observaciones: string;
  IVASobreUtilidad: string;
  ivaSobreSubtotal: string;
  porcentajeSobreUtilidadChecked: boolean;
  ivaSobreSubtotalChecked: boolean;
  porcentajeSobreUtilidad: string;
  porcentajeDeAdministracion: string;
  imprevistos: string;
  medioDePago: string;
  tipoDeOperacion: string;
  ivaChecked: false;
  adminChecked: false;
  imprevistosChecked: false;
  plazo: string;
}

interface Errors {
  factura: boolean;
  valor: boolean;
  cantidad: boolean;
  acta: boolean;
  ivaSobreSubtotal: boolean;
  contrato: boolean;
  cliente: boolean;
  descripcionDelContrato: boolean;
  descripcion: boolean;
  observaciones: boolean;
  IVASobreUtilidad: boolean;
  porcentajeSobreUtilidad: boolean;
  porcentajeDeAdministracion: boolean;
  tipoDeNegociacion: boolean;
  items: boolean;
  plazo: boolean;
  imprevistos: boolean;
  retencionIva: boolean;
  retefuente: boolean;
  reteica: boolean;
  retegarantia: boolean;
  anticipo: boolean;
}

export default function Component() {
  const {
    facturas,
    fetchFacturas,
    loading,
    error: errorEnvioFactura,
  } = useFacturaStore();
  const {
    fetchMetodosDePago,
    nombresDeMetodosDePago,
    loading: loadingMetodosDePago,
    error: errorMetodosDePago,
  } = useMetodosDePagoStore();
  const {
    fetchTiposDeOperacion,
    tiposDeOperacion,
    loading: loadingTiposDeOperacion,
    error: errorTiposDeOperacion,
  } = useTiposDeOperacionStore();

  const { crearNotaCredito, loading: loadingCreditoStore } =
    useNotasCreditoStore();
  const { infoDelUsuario } = useUserStore();
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [value, setValue] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [formDataFecha, setFormDataFecha] = useState<FormDataFecha>({
    fecha: '',
  });
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const vencimiento = new Date();
  vencimiento.setDate(vencimiento.getDate() + 1); // Sumar un día

  const [formData, setFormData] = useState<FormData>({
    factura: '',
    fecha: new Date().toISOString().split('T')[0],
    tipoDeNegociacion: 'Contado',
    vencimiento: vencimiento.toISOString().split('T')[0],
    descripcion: '',
    valor: '',
    ivaSobreSubtotal: '0',
    ivaSobreSubtotalChecked: true,
    cantidad: '',
    observaciones: '',
    IVASobreUtilidad: '',
    porcentajeSobreUtilidad: '',
    porcentajeDeAdministracion: '',
    imprevistos: '',
    medioDePago: 'Instrumento no definido',
    tipoDeOperacion: 'Generica',
    ivaChecked: false,
    adminChecked: false,
    porcentajeSobreUtilidadChecked: false,
    imprevistosChecked: false,
    plazo: 'Manual',
  });

  const [errors, setErrors] = useState<Errors>({
    factura: false,
    cliente: false,
    tipoDeNegociacion: false,
    valor: false,
    cantidad: false,
    acta: false,
    contrato: false,
    descripcionDelContrato: false,
    descripcion: false,
    observaciones: false,
    porcentajeSobreUtilidad: false,
    ivaSobreSubtotal: false,
    IVASobreUtilidad: false,
    porcentajeDeAdministracion: false,
    items: false,
    plazo: false,
    imprevistos: false,
    retencionIva: false,
    retefuente: false,
    reteica: false,
    retegarantia: false,
    anticipo: false,
  });

  useEffect(() => {
    fetchFacturas();
    fetchMetodosDePago();
    fetchTiposDeOperacion();
  }, []);

  //Este evita que se pongan numeros al mover la rueda del mouse:
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      const activeElement = document.activeElement as HTMLInputElement | null;

      // Bloquear solo si el usuario está en un input de tipo number
      if (activeElement && activeElement.type === 'number' && !event.shiftKey) {
        event.preventDefault();
        activeElement.blur(); // Elimina el foco del input para evitar que siga cambiando
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  useEffect(() => {
    if (formData.plazo !== '') {
      const currentDate = new Date();
      let daysToAdd = 0;

      switch (formData.plazo) {
        case 'Catorcenal':
          daysToAdd = 14;
          break;
        case 'Mensual':
          daysToAdd = 30;
          break;
        default:
          daysToAdd = 0;
      }

      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + daysToAdd);
      const formattedDate = newDate.toISOString().split('T')[0];

      setFormData((prev) => ({
        ...prev,
        vencimiento: formattedDate,
      }));
    }
  }, [formData.plazo]);

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: keyof FormData
  ) => {
    const { checked } = e.target;
    console.log(field, checked);
    setFormData((prev) => {
      let updatedForm = { ...prev, [field]: checked };

      // Deshabilitar el otro checkbox si  uno se selecciona
      if (
        (field === 'ivaSobreSubtotalChecked' && checked) ||
        (field === 'ivaChecked' && !checked)
      ) {
        updatedForm = {
          ...updatedForm,
          porcentajeSobreUtilidadChecked: false,
          ivaChecked: false,
          adminChecked: false,
          imprevistosChecked: false,
          IVASobreUtilidad: '',
          porcentajeSobreUtilidad: '',
          porcentajeDeAdministracion: '',
          imprevistos: '',
        };
      } else if (field === 'ivaChecked' && checked) {
        updatedForm = {
          ...updatedForm,
          ivaSobreSubtotalChecked: false,
          ivaSobreSubtotal: '',
        };
      }

      // Si se desmarca un checkbox, limpiar su input asociado
      if (!checked) {
        let valueField = '';

        if (field === 'ivaSobreSubtotalChecked') {
          valueField = 'ivaSobreSubtotal';
        } else if (field === 'ivaChecked') {
          valueField = 'IVASobreUtilidad';
        } else if (field === 'adminChecked') {
          valueField = 'porcentajeDeAdministracion';
        } else if (field === 'imprevistosChecked') {
          valueField = 'imprevistos';
        } else if (field === 'porcentajeSobreUtilidadChecked') {
          valueField = 'porcentajeSobreUtilidad';
        }

        if (valueField) {
          updatedForm = { ...updatedForm, [valueField]: '' };
        }
      }

      return updatedForm;
    });
  };

  const handleAddItem = () => {
    if (!description || !quantity || !value) return;

    const newItem: Item = {
      descripcion: description,
      cantidad: parseInt(quantity, 10) || 0,
      valorUnitario: parseFloat(value) || 0,
      porcentajeIva: 0,
    };

    setItems((prevItems) => [...prevItems, newItem]);
  };

  const handleIconClick = () => {
    setShowCalendarModal(true);
  };

  //Maneja todos los cambios en el form en tiempo real
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Validaciones en tiempo real
    switch (name) {
      case 'factura':
        setErrors((prev) => ({ ...prev, factura: !value }));
        break;
      case 'valor':
        setErrors((prev) => ({ ...prev, valor: !value }));
        break;
      case 'cantidad':
        setErrors((prev) => ({ ...prev, cantidad: !value }));
        break;
      case 'observaciones':
        setErrors((prev) => ({ ...prev, observaciones: !value }));
        break;
      case 'ivaSobreSubtotal':
        setErrors((prev) => ({ ...prev, ivaSobreSubtotal: !value }));
        break;
      case 'IVASobreUtilidad':
        setErrors((prev) => ({ ...prev, IVASobreUtilidad: !value }));
        break;
      case 'porcentajeSobreUtilidad':
        setErrors((prev) => ({ ...prev, porcentajeSobreUtilidad: !value }));
        break;
      case 'porcentajeDeAdministracion':
        setErrors((prev) => ({ ...prev, porcentajeDeAdministracion: !value }));
        break;
      case 'imprevistos':
        setErrors((prev) => ({ ...prev, imprevistos: !value }));
        break;
      default:
        break;
    }
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = date.toISOString().split('T')[0]; // Convertir Date a formato ISO
      setFormData((prev) => ({
        ...prev,
        vencimiento: formattedDate, // Actualizar el campo `vencimiento`
      }));
    }
  };

  const handleSubmit = () => {
    // Determinar si se deben validar descripcion, valor y cantidad
    const shouldValidateFields = items.length === 0;

    // Validaciones al enviar
    const newErrors: Errors = {
      factura: !formData.factura,
      valor: shouldValidateFields && !formData.valor,
      cantidad: shouldValidateFields && !formData.cantidad,
      observaciones: !formData.observaciones,
      IVASobreUtilidad: formData.ivaChecked && !formData.IVASobreUtilidad,
      ivaSobreSubtotal:
        formData.ivaSobreSubtotalChecked && !formData.ivaSobreSubtotal,
      porcentajeSobreUtilidad:
        formData.ivaChecked && !formData.porcentajeSobreUtilidad,
      porcentajeDeAdministracion:
        formData.adminChecked && !formData.porcentajeDeAdministracion,
      imprevistos: formData.imprevistosChecked && !formData.imprevistos,
      tipoDeNegociacion:
        formData.tipoDeNegociacion === 'Credito' && !formData.plazo,
      items: items.length === 0,
      plazo: formData.tipoDeNegociacion === 'Credito' && !formData.plazo,
      cliente: false,
      acta: false,
      contrato: false,
      descripcionDelContrato: false,
      descripcion: shouldValidateFields && !formData.descripcion, // Validar solo si no hay items
      retencionIva: false,
      retefuente: false,
      reteica: false,
      retegarantia: false,
      anticipo: false,
    };

    setErrors(newErrors);

    // Si hay errores, no enviar
    if (Object.values(newErrors).some((error) => error)) {
      return;
    }

    const formListo = {
      id_factura: Number(formData.factura),
      fecha: formData.fecha, //
      tiponegocio: formData.tipoDeNegociacion,
      cantidadDeDiasParaVencimiento: (() => {
        if (formData.plazo === 'Mensual') return 30;
        if (formData.plazo === 'Catorcenal') return 14;
        if (formData.plazo === 'Manual') {
          const inicio = new Date(formData.fecha);
          const vencimiento = new Date(formData.vencimiento);
          const diffTime = vencimiento.getTime() - inicio.getTime();
          return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        return 0;
      })(),
      data_table: items.map((item) => ({
        descripcion: item.descripcion,
        cantidad: String(item.cantidad),
        valor: String(item.valorUnitario),
      })),
      DC: 0,
      observaciones: formData.observaciones,
      checkIvaNC: formData.ivaSobreSubtotalChecked,
      iva: formData.ivaChecked,
      administracion: formData.adminChecked,
      imprevistos: formData.imprevistosChecked,
      montoIvaSubtotal: Number(formData.ivaSobreSubtotal),
      montoIvaUtilidad: Number(formData.IVASobreUtilidad),
      porcentaje_u: Number(formData.porcentajeSobreUtilidad),
      porcentaje_a: Number(formData.porcentajeDeAdministracion),
      porcentaje_i: Number(formData.imprevistos),
    };
    // console.log(formListo);
    crearNotaCredito(formListo);
  };

  const LabelWithAsterisk = ({
    htmlFor,
    children,
  }: {
    htmlFor: string;
    children: React.ReactNode;
  }) => (
    <label htmlFor={htmlFor}>
      {children}
      <span className="text-blueQ ml-1">*</span>
    </label>
  );

  return (
    <LayoutAdmi>
      <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-12 w-full overflow-hidden">
        {/* Contenedor principal */}
        <div className="w-full max-w-[1152px] h-auto rounded-[20px] flex justify-center px-4 sm:px-12 pb-14 mx-auto bg-white mb-40">
          {/* Contenedor Gestor de facturas */}
          <div className="w-full max-w-full md:max-w-[1061px] mt-8">
            <div className="h-auto flex ">
              <div className="">
                <h1 className=" w-full md:w-auto h-10 text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F] mb-4 sm:mb-6">
                  Notas Crédito
                </h1>
                <h2 className="w-full min-[525px]:mt-[20px] min-[309px]:mt-[60px] min-[1px]:mt-[80px] mt-14 text-base font-montserrat font-normal text-[#6F6F6F]">
                  {infoDelUsuario?.correo ?? 'Correo del usuario'}
                </h2>
              </div>
            </div>

            <div className="space-y-4 font-montserrat font-normal text-[#565656] text-sm pb-6 mt-10 ">
              {/* Factura */}
              <div className="grid gap-4 w-full">
                <LabelWithAsterisk htmlFor="invoice">Factura</LabelWithAsterisk>
                <div className="relative mt-4">
                  {facturas.length > 0 ? (
                    <SimpleSelect
                      options={facturas}
                      placeholder="Buscar una factura"
                      width={'100%'}
                      value={formData.factura}
                      onChange={(value) => {
                        setFormData((prev) => ({ ...prev, factura: value }));
                        setErrors((prev) => ({ ...prev, factura: !value }));
                      }}
                      error={errors.factura}
                    />
                  ) : (
                    <h2>Cargando facturas...</h2>
                  )}
                </div>
                {errors.factura && (
                  <p className="text-red-500 text-sm">
                    El campo es obligatorio.
                  </p>
                )}
              </div>

              {/* Fecha */}
              {/* Campo Fecha */}
              <div className="w-full md:w-[100%]">
                <label>Fecha</label>
                <input
                  type="date"
                  name="fecha"
                  value={formData.fecha}
                  className="mt-4 w-full h-10 px-4 border border-[#00A7E1] rounded-[25px] text-[#C3C3C3] text-sm focus:ring-blue-300 focus:outline-none shadow-sm"
                  readOnly
                />
              </div>

              {/* Campo Tipo de negociación */}

              <div className="w-full md:w-[100%] ">
                <label>
                  Tipo de negociación
                  <span
                    className={`text-red-500 ${
                      errors.tipoDeNegociacion ? '' : 'invisible'
                    }`}
                  >
                    *
                  </span>
                </label>
                <div className="relative mt-4">
                  <SimpleSelect
                    options={tiposDeNegociacion}
                    width={'100%'}
                    value={formData.tipoDeNegociacion}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        tipoDeNegociacion: value,
                      }));
                      setErrors((prev) => ({
                        ...prev,
                        tipoDeNegociacion: !value,
                      }));
                    }}
                    error={errors.tipoDeNegociacion}
                  />
                </div>
                {errors.tipoDeNegociacion && (
                  <p className="text-red-500 text-sm">
                    El campo es obligatorio.
                  </p>
                )}
              </div>

              {/* Plazo - solo se muestra si la opción es "Credito" */}
              {formData.tipoDeNegociacion === 'Credito' && (
                <div className="flex flex-col mt-4">
                  <label className="">
                    Plazo
                    <span
                      className={`text-red-500 ${
                        errors.plazo ? '' : 'invisible'
                      }`}
                    >
                      *
                    </span>
                  </label>
                  <div className="mt-4">
                    <SimpleSelect
                      options={plazos}
                      width="100%"
                      value={formData.plazo}
                      onChange={(value) => {
                        setFormData((prev) => ({ ...prev, plazo: value }));
                        setErrors((prev) => ({ ...prev, plazo: false }));
                      }}
                      error={errors.plazo}
                    />
                  </div>
                  {errors.plazo && (
                    <p className="text-red-500 text-sm mt-1">
                      Debe seleccionar un plazo.
                    </p>
                  )}
                </div>
              )}

              {/* Campo vencimiento */}
              <div className="flex-1 w-full relative mt-4">
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
                    className={`w-full h-10 px-4  pr-10 border border-[#00A7E1]
                       text-[#C3C3C3]
                      rounded-[25px] text-sm focus:ring-blue-300 focus:outline-none shadow-sm
                      appearance-none [&::-webkit-calendar-picker-indicator]:hidden`} // Eliminar el ícono predeterminado
                  />
                  <Calendar
                    onClick={() => {
                      if (formData.plazo === 'Manual') {
                        handleIconClick();
                      }
                    }}
                    className={`absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                      formData.plazo !== 'Manual'
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-[#C3C3C3] cursor-pointer'
                    }`}
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
                              ? new Date(formData.vencimiento + 'T00:00:00') // Usa la zona horaria local en lugar de UTC
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

              {/* Descripcion */}
              <div className="grid gap-4">
                <LabelWithAsterisk htmlFor="description">
                  Descripción
                </LabelWithAsterisk>
                <Input
                  id="description"
                  placeholder="Ingrese descripción"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((prev) => ({
                      ...prev,
                      descripcion: !e.target.value,
                    }));
                  }}
                  className={` w-full h-10 px-4 border ${
                    errors.descripcion ? 'border-red-500' : 'border-[#00A7E1]'
                  }
                  rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                />
                {errors.descripcion && (
                  <p className="text-red-500 text-sm">
                    El campo es obligatorio.
                  </p>
                )}
              </div>

              {/* Valor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Valor */}
                <div className="grid gap-4">
                  <LabelWithAsterisk htmlFor="value">Valor</LabelWithAsterisk>
                  <Input
                    id="value"
                    placeholder="Subtotal antes de IVA"
                    value={value}
                    onChange={(e) => {
                      setValue(e.target.value);
                      setErrors((prev) => ({
                        ...prev,
                        valor: !e.target.value,
                      }));
                    }}
                    type="number"
                    className={` w-full h-10 px-4 border ${
                      errors.valor ? 'border-red-500' : 'border-[#00A7E1]'
                    }
                    rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                  />
                  {errors.valor && (
                    <p className="text-red-500 text-sm">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>

                {/* Cantidad */}
                <div className="grid gap-4">
                  <LabelWithAsterisk htmlFor="quantity">
                    Cantidad
                  </LabelWithAsterisk>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                      id="quantity"
                      placeholder="Ingrese la cantidad"
                      value={quantity}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        setErrors((prev) => ({
                          ...prev,
                          cantidad: !e.target.value,
                        }));
                      }}
                      type="number"
                      className={` w-full h-10 px-4 border ${
                        errors.cantidad ? 'border-red-500' : 'border-[#00A7E1]'
                      }
                      rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                    />
                  </div>
                  {errors.cantidad && (
                    <p className="text-red-500 text-sm">
                      El campo es obligatorio.
                    </p>
                  )}
                </div>
              </div>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault(); // Evita la recarga de la página
                    handleAddItem(); // Llama a la función de agregar el item
                  }}
                  className="absolute right-0 bg-[#00A7E1] font-bold text-white h-8 px-14 text-xs rounded-full hover:bg-[#008ec1]"
                >
                  Agregar Item
                </button>
                <TablaDeOrdenamiento
                  items={items.filter((item) =>
                    item.descripcion
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )}
                  onItemsChange={setItems}
                  allowEdit
                />
              </div>

              <p className="">{items.length} en total</p>

              {/* Campo "Observaciones" */}
              <div className="mt-10">
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
                <textarea
                  name="observaciones"
                  placeholder="Observaciones "
                  value={formData.observaciones}
                  className={`w-full h-28 px-4 border rounded-[25px]  font-montserrat text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm mt-4 ${
                    errors.observaciones ? 'border-red-500' : 'border-[#00A7E1]'
                  } placeholder-[#C3C3C3]`}
                  onChange={handleChange}
                />
                {errors.observaciones && (
                  <p className="text-red-500 text-sm">
                    El campo es obligatorio.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap mt-9 gap-x-4 gap-y-6">
                <div className="flex flex-col w-full md:w-[48%]">
                  {/* IVA SOBRE subtotal */}
                  <div className="">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.ivaSobreSubtotalChecked}
                        onChange={(e) =>
                          handleCheckboxChange(e, 'ivaSobreSubtotalChecked')
                        }
                        className="hidden"
                      />
                      <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                        <span
                          className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                            formData.ivaSobreSubtotalChecked
                              ? 'scale-100'
                              : 'scale-0'
                          }`}
                        ></span>
                      </span>
                      <span className="text-sm ml-2  ">
                        IVA sobre subtotal
                        <span
                          className={`text-red-500 ${
                            errors.ivaSobreSubtotal ? '' : 'invisible'
                          }`}
                        >
                          *
                        </span>
                      </span>
                    </label>

                    {formData.ivaSobreSubtotalChecked && (
                      <div className="">
                        <input
                          type="number"
                          name="ivaSobreSubtotal"
                          placeholder="Valor"
                          min="0"
                          value={formData.ivaSobreSubtotal}
                          className={`mt-4 w-full h-10 px-4 border ${
                            errors.ivaSobreSubtotal
                              ? 'border-red-500'
                              : 'border-[#00A7E1]'
                          }
                          rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                          onChange={handleChange}
                        />
                        {errors.ivaSobreSubtotal && (
                          <p className="text-red-500 text-sm mt-1">
                            El campo es obligatorio.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                  {/* IVA SOBRE UTILIDAD */}
                  <div className="mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.ivaChecked}
                        onChange={(e) => handleCheckboxChange(e, 'ivaChecked')}
                        className="hidden"
                      />
                      <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                        <span
                          className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                            formData.ivaChecked ? 'scale-100' : 'scale-0'
                          }`}
                        ></span>
                      </span>
                      <span className="text-sm ml-2  ">
                        IVA sobre utilidad
                        <span
                          className={`text-red-500 ${
                            errors.IVASobreUtilidad ? '' : 'invisible'
                          }`}
                        >
                          *
                        </span>
                      </span>
                    </label>

                    {formData.ivaChecked && (
                      <div>
                        <input
                          type="number"
                          name="IVASobreUtilidad"
                          placeholder="Valor"
                          value={formData.IVASobreUtilidad}
                          className={`mt-4 w-full h-10 px-4 border ${
                            errors.IVASobreUtilidad
                              ? 'border-red-500'
                              : 'border-[#00A7E1]'
                          }
                          rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                          onChange={handleChange}
                        />
                        {errors.IVASobreUtilidad && (
                          <p className="text-red-500 text-sm mt-1">
                            El campo es obligatorio.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {formData.ivaChecked && (
                    <div>
                      {/* Porcentaje de Administración */}
                      <div className="mt-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.adminChecked}
                            onChange={(e) =>
                              handleCheckboxChange(e, 'adminChecked')
                            }
                            className="hidden"
                          />
                          <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                            <span
                              className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                                formData.adminChecked ? 'scale-100' : 'scale-0'
                              }`}
                            ></span>
                          </span>
                          <span className="text-sm ml-2  ">
                            Porcentaje de Administración
                            <span
                              className={`text-red-500 ${
                                errors.porcentajeDeAdministracion
                                  ? ''
                                  : 'invisible'
                              }`}
                            >
                              *
                            </span>
                          </span>
                        </label>
                        {formData.adminChecked && (
                          <div>
                            <input
                              type="number"
                              name="porcentajeDeAdministracion"
                              placeholder="Porcentaje"
                              value={formData.porcentajeDeAdministracion}
                              className={`mt-4 w-full h-10 px-4 border ${
                                errors.porcentajeDeAdministracion
                                  ? 'border-red-500'
                                  : 'border-[#00A7E1]'
                              } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                              onChange={handleChange}
                            />
                            {errors.porcentajeDeAdministracion && (
                              <p className="text-red-500 text-sm mt-1">
                                El campo es obligatorio.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Porcentaje de Imprevistos */}
                      <div className="mt-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.imprevistosChecked}
                            onChange={(e) =>
                              handleCheckboxChange(e, 'imprevistosChecked')
                            }
                            className="hidden"
                          />
                          <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                            <span
                              className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                                formData.imprevistosChecked
                                  ? 'scale-100'
                                  : 'scale-0'
                              }`}
                            ></span>
                          </span>
                          <span className="text-sm ml-2  ">
                            Porcentaje de imprevistos
                            <span
                              className={`text-red-500 ${
                                errors.imprevistos ? '' : 'invisible'
                              }`}
                            >
                              *
                            </span>
                          </span>
                        </label>
                        {formData.imprevistosChecked && (
                          <div>
                            <input
                              type="number"
                              name="imprevistos"
                              placeholder="Porcentaje"
                              value={formData.imprevistos}
                              className={`mt-4 w-full h-10 px-4 border ${
                                errors.imprevistos
                                  ? 'border-red-500'
                                  : 'border-[#00A7E1]'
                              } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                              onChange={handleChange}
                            />
                            {errors.imprevistos && (
                              <p className="text-red-500 text-sm mt-1">
                                El campo es obligatorio.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Porcentaje sobre utilidad */}
                      <div className="mt-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.porcentajeSobreUtilidadChecked}
                            onChange={(e) =>
                              handleCheckboxChange(
                                e,
                                'porcentajeSobreUtilidadChecked'
                              )
                            }
                            className="hidden"
                          />
                          <span className="flex items-center justify-center w-8 h-8 border border-[#00A7E1] rounded-xl cursor-pointer">
                            <span
                              className={`absolute w-3 h-3 rounded-full bg-[#00A7E1] transition-all duration-200 ${
                                formData.porcentajeSobreUtilidadChecked
                                  ? 'scale-100'
                                  : 'scale-0'
                              }`}
                            ></span>
                          </span>
                          <span className="text-sm ml-2  ">
                            Porcentaje sobre utilidad
                            <span
                              className={`text-red-500 ${
                                errors.porcentajeSobreUtilidad
                                  ? ''
                                  : 'invisible'
                              }`}
                            >
                              *
                            </span>
                          </span>
                        </label>
                        {formData.porcentajeSobreUtilidadChecked && (
                          <div>
                            <input
                              type="number"
                              name="porcentajeSobreUtilidad"
                              placeholder="Porcentaje"
                              value={formData.porcentajeSobreUtilidad}
                              className={`mt-4 w-full h-10 px-4 border ${
                                errors.porcentajeSobreUtilidad
                                  ? 'border-red-500'
                                  : 'border-[#00A7E1]'
                              } rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm`}
                              onChange={handleChange}
                            />
                            {errors.porcentajeSobreUtilidad && (
                              <p className="text-red-500 text-sm mt-1">
                                El campo es obligatorio.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Medios de pago y tipo de Operacion */}
              <div className="flex flex-col md:flex-row gap-4 mt-9">
                <div className="w-full md:w-[48%] relative">
                  <label className="">Medio de pago</label>
                  <div className="mt-4">
                    {loadingMetodosDePago ? (
                      <div>Cargando Medios de pago...</div> // Indicador de carga dentro del select
                    ) : (
                      <SimpleSelect
                        options={nombresDeMetodosDePago} // Opciones cargadas desde zustand
                        width={'100%'}
                        value={formData.medioDePago}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            medioDePago: value,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            medioDePago: !value,
                          }));
                        }}
                        placeholder="Seleccione un Tipo de Operacion"
                      />
                    )}
                  </div>
                </div>
                <div className="w-full md:w-[50%] mt-4 md:mt-0 relative">
                  <label className="">Tipo de Operacion</label>
                  <div className="mt-4">
                    {loadingTiposDeOperacion ? (
                      <div>Cargando opciones...</div>
                    ) : (
                      <SimpleSelect
                        options={tiposDeOperacion}
                        value={formData.tipoDeOperacion}
                        onChange={(value) => {
                          setFormData((prev) => ({
                            ...prev,
                            tipoDeOperacion: value,
                          }));
                          setErrors((prev) => ({
                            ...prev,
                            tipoDeOperacion: false,
                          }));
                        }}
                        placeholder="Genérica"
                      />
                    )}
                  </div>
                </div>
              </div>

              {loadingCreditoStore ? <Spinner /> : ''}

              {/* Botones */}
              <div className="flex justify-between mt-4">
                {/* <Button className="bg-[#333332] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-32">
                  Vista previa
                </Button> */}
                <div className="space-x-2" onClick={handleSubmit}>
                  <Button className="bg-[#00A7E1] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-32">
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LayoutAdmi>
  );
}
