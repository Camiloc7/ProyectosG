'use client';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { useState, useRef } from 'react';
import {
  validateEntradasNumericas,
  validateTextos,
} from '@/app/gestionDeFacturasElectronicas/validations';
import { Calendar } from 'lucide-react';
import TablaDeOrdenamiento from '@/components/ui/tablaDeOrdenamiento';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import { useNotasDebitoStore } from '@/store/useNotasDebitoStore';

interface Item {
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  porcentajeIva: number;
}

interface FormData {
  factura: string;
  descripcion: string;
  valor: string;
  cantidad: string;
  fecha: string;
}

interface Errors {
  descripcion: boolean;
  valor: boolean;
  cantidad: boolean;
  item: boolean;
}

const facturasElectronicas: string[] = [
  'Factura electronica-1',
  'Factura electronica-2',
];

export default function Component() {
  const { crearNotaDebito } = useNotasDebitoStore();
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    factura: '',
    fecha: '',
    descripcion: '',
    valor: '',
    cantidad: '',
  });
  const [errors, setErrors] = useState<Errors>({
    descripcion: false,
    valor: false,
    cantidad: false,
    item: false,
  });

  const handleAddItem = () => {
    const description = formData.descripcion;
    const quantity = formData.cantidad;
    const value = formData.valor;

    if (!description || !quantity || !value) {
      return;
    }

    const newItem: Item = {
      descripcion: description,
      cantidad: parseInt(quantity, 10) || 0,
      valorUnitario: parseFloat(value) || 0,
      porcentajeIva: 0,
    };

    setItems((prevItems) => [...prevItems, newItem]);
    setFormData((prev) => ({
      ...prev,
      descripcion: '',
      cantidad: '',
      valor: '',
    }));
    setErrors((prev) => ({ ...prev, item: false }));
  };

  const handleIconClick = () => {
    setShowCalendarModal(true);
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      // Convertir la fecha a UTC solo cuando se guarde
      const utcDate = new Date(
        Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
      );
      setFormData((prev) => ({
        ...prev,
        fecha: utcDate.toISOString().split('T')[0], // Usar 'YYYY-MM-DD'
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        fecha: '', // En caso de null, dejar como cadena vacía
      }));
    }
    setShowCalendarModal(false); // Cierra el modal
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
      descripcion: validateTextos,
      valor: validateEntradasNumericas,
      cantidad: validateEntradasNumericas,
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

    const isItemPresent = items.length > 0;

    // Resetear errores antes de la validación
    Object.keys(errorState).forEach((key) => {
      errorState[key as keyof Errors] = false;
    });

    let isDescripcionValid = true;
    let isValorValid = true;
    let isCantidadValid = true;

    if (!isItemPresent) {
      isDescripcionValid = validateTextos(formData.descripcion);
      isValorValid = validateEntradasNumericas(formData.valor);
      isCantidadValid = validateEntradasNumericas(formData.cantidad);

      errorState.item = true;
      errorState.descripcion = !isDescripcionValid;
      errorState.valor = !isValorValid;
      errorState.cantidad = !isCantidadValid;
    }

    setErrors(errorState);

    // Determinar si hay errores
    const hasErrors =
      !isItemPresent &&
      (!isDescripcionValid || !isValorValid || !isCantidadValid);

    if (hasErrors) {
      console.error('Errores detectados. El formulario no se enviará.');
      return;
    }

    const formListo = {
      id_factura: formData.factura,
      fecha: formData.fecha,
      data_table: items,
    };

    crearNotaDebito(formListo);
  };

  return (
    <LayoutAdmi>
      <div className="bg-[#F7F7F7] pt-12 px-6 sm:px-12 w-full overflow-hidden">
        {/* Contenedor principal */}
        <div className="w-full max-w-[1152px] h-auto rounded-[20px] flex flex-col justify-center px-4 sm:px-12 pb-14 mx-auto bg-white">
          {/* Contenedor Gestor de facturas */}
          <div className="w-full md:max-w-[1061px] mt-8">
            <h1 className="text-3xl font-bold font-montserrat text-[#6F6F6F] mb-4">
              Notas de Débito
            </h1>
            <div className="flex flex-col w-full mt-10  font-montserrat font-normal text-[#565656] text-sm">
              {/* Factura */}
              <div className="flex flex-col">
                <label>
                  Factura<span className="text-blueQ ml-1">*</span>
                </label>
                <div className="mt-4">
                  <SimpleSelect
                    options={facturasElectronicas}
                    placeholder="Buscar una factura"
                    width="100%"
                    value={formData.factura}
                    onChange={(value) => {
                      setFormData((prev) => ({ ...prev, factura: value }));
                    }}
                  />
                </div>
              </div>

              {/* Fecha */}
              <div className="flex flex-col mt-4">
                <label>Fecha</label>
                <div className="relative mt-4">
                  <input
                    ref={inputRef}
                    type="date"
                    name="fecha"
                    value={formData.fecha}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        fecha: e.target.value,
                      }))
                    }
                    className="w-full h-10 px-4 pr-10 border border-[#00A7E1] text-[#C3C3C3] rounded-full text-sm focus:ring-blue-300 focus:outline-none shadow-sm appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
                  />
                  <Calendar
                    onClick={handleIconClick}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#C3C3C3] cursor-pointer"
                  />
                </div>
                {showCalendarModal && (
                  <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex justify-center items-center z-[201]">
                    <div className="bg-white p-4 rounded-lg shadow-lg w-[90%] sm:w-[300px] lg:w-[350px]">
                      <h2 className="text-center text-lg font-semibold mb-3">
                        Seleccionar Fecha
                      </h2>
                      <DatePicker
                        selected={
                          formData.fecha
                            ? new Date(formData.fecha + 'T00:00:00')
                            : null
                        }
                        onChange={handleDateChange}
                        inline
                        className="border border-gray-300 rounded-lg shadow-sm w-full"
                      />
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

              {/* Descripción */}
              <div className="flex flex-col mt-4">
                <label>
                  Descripción<span className="text-blueQ ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="descripcion"
                  value={formData.descripcion}
                  placeholder="Descripcion"
                  className={`w-full h-10 mt-4 px-4 text-sm placeholder:text-[#C3C3C3] text-[#6F6F6F] border rounded-full outline-none focus:ring-blue-200 focus:ring-2 shadow-sm transition-all ${
                    errors.descripcion ? 'border-red-500' : 'border-[#00A7E1]'
                  }`}
                  onChange={handleChange}
                />
                {errors.descripcion && (
                  <p className="text-red-500 text-xs mt-1">
                    El campo es obligatorio.
                  </p>
                )}
              </div>

              {/* Valor y Cantidad */}
              <div className="flex flex-col mt-4 md:flex-row md:space-x-4 w-full">
                {/* Valor */}
                <div className="flex flex-col w-full md:w-full">
                  <label>
                    Valor<span className="text-blueQ ml-1">*</span>
                  </label>
                  <input
                    type="number"
                    name="valor"
                    value={formData.valor}
                    placeholder="Ingrese el valor"
                    className={`w-full h-10 px-4 mt-4 text-sm placeholder:text-[#C3C3C3] text-[#6F6F6F] border rounded-full outline-none focus:ring-blue-200 focus:ring-2 shadow-sm transition-all ${
                      errors.valor ? 'border-red-500' : 'border-[#00A7E1]'
                    }`}
                    onChange={handleChange}
                  />
                  <p
                    className={`text-xs mt-1 ${
                      errors.valor ? 'text-red-500 visible' : 'invisible'
                    }`}
                  >
                    El campo es obligatorio.
                  </p>
                </div>

                {/* Cantidad */}
                <div className="flex flex-col w-full md:w-full">
                  <label>
                    Cantidad<span className="text-blueQ ml-1">*</span>
                  </label>
                  <div className="flex items-center gap-2 mt-4">
                    <input
                      type="number"
                      name="cantidad"
                      value={formData.cantidad}
                      placeholder="Ingrese la cantidad"
                      className={`w-full h-10 px-4 text-sm placeholder:text-[#C3C3C3] text-[#6F6F6F] border rounded-full outline-none focus:ring-blue-200 focus:ring-2 shadow-sm transition-all ${
                        errors.cantidad ? 'border-red-500' : 'border-[#00A7E1]'
                      }`}
                      onChange={handleChange}
                    />
                    <button
                      className="w-10 ml-3 h-10 flex-shrink-0 flex items-center justify-center rounded-[20px] border-[1px] border-[#00A7E1] hover:bg-blue-200 text-2xl leading-[2.5rem] text-[#C3C3C3]"
                      onClick={handleAddItem}
                    >
                      +
                    </button>
                  </div>
                  <p
                    className={`text-xs mt-1 ${
                      errors.cantidad ? 'text-red-500 visible' : 'invisible'
                    }`}
                  >
                    El campo es obligatorio.
                  </p>
                </div>
              </div>

              {/* Tabla */}
              <div className="flex flex-col">
                <TablaDeOrdenamiento
                  items={items.filter((item) =>
                    item.descripcion
                      .toLowerCase()
                      .includes(searchTerm.toLowerCase())
                  )}
                  onItemsChange={setItems}
                  allowEdit
                />
                {errors.item && (
                  <p className="text-red-500 text-sm text-center mt-4">
                    Debe ingresar al menos un item.
                  </p>
                )}
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-4">
                <button className="bg-black font-bold text-white h-8 px-4 text-xs rounded-full hover:bg-gray-800">
                  Vista Previa
                </button>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto space-y-4 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleSubmitButton}
                    className="bg-[#00A7E1] font-bold text-white h-8 px-4 text-xs rounded-full hover:bg-[#008ec1]"
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
