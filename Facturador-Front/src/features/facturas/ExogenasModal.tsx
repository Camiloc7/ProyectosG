import React, { useEffect, useState } from 'react';
import DatePickerInput from '@/components/ui/DatePickerInput';
import { useInformesStore } from '@/store/useInformesStore';
import { useNotasCreditoStore } from '@/store/useNotasCreditoStore';
import SelectConSearch from '@/components/ui/selectConSearch';
import { useClientStore } from '@/store/useClientStore';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { useFacturaStore } from '@/store/useFacturaStore';
import { showErrorToast } from '@/components/feedback/toast';

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface FormExogenas {
  cliente: string;
  year: string;
  anuladas: string;
  opciones: string;
  informe: string;
  desde: string;
  hasta: string;
  desde2: string;
  hasta2: string;
}
const opcionesSimples = [
  { id: 'SI', nombre: 'Si' },
  { id: 'NO', nombre: 'No' },
];

const opciones = ['Retefuente', 'Retegarantia', 'Reteica', 'Todas'];

const tiposInformes = [
  { id: 'informe1006', nombre: 'Informe 1006' },
  { id: 'informe1006g', nombre: 'Informe 1006 g (Nota Credito)' },
  {
    id: 'informe1006comprasg',
    nombre: 'Informe 1006 Compras G (Nota Credito)',
  },
  { id: 'informe1003', nombre: 'Informe 1003' },
  { id: 'informe1003g', nombre: 'Informe 1003 g (Nota Credito)' },
  { id: 'informe1g', nombre: '1007 g (Nota Credito)' },
  { id: 'informe1', nombre: '1007' },
  { id: 'informeiva1005', nombre: 'Informe IVA 1005' },
  { id: 'informecomparativo', nombre: 'Informe Comparativo' },
];

const ExogenasModal: React.FC<ModalFormProps> = ({ isOpen, onClose }) => {
  const {
    clientes,
    fetchClientes,
    loading: loadingClientes,
  } = useClientStore();

  const handleBackgroundClick = (
    e: React.MouseEvent<HTMLDivElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    onClose();
  };
  const { informeExogenas } = useFacturaStore();

  const [formData, setFormData] = useState({
    cliente: '',
    year: '',
    anuladas: '',
    opciones: '',
    informe: '',
    desde: '',
    hasta: '',
    desde2: '',
    hasta2: '',
  });

  const [errors, setErrors] = useState({
    cliente: false,
    year: false,
    anuladas: false,
    opciones: false,
    informe: false,
    desde: false,
    hasta: false,
    desde2: false,
    hasta2: false,
  });
  useEffect(() => {
    fetchClientes();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar campos
    const newErrors = {
      cliente: !formData.cliente,
      year: !formData.year || !/^\d{4}$/.test(formData.year),
      anuladas: !formData.anuladas,
      opciones: !formData.opciones,
      informe: !formData.informe,
      desde: !formData.desde,
      hasta: !formData.hasta,
      desde2: !formData.desde2,
      hasta2: !formData.hasta2,
    };

    setErrors(newErrors);

    // Verificar si hay algún error
    const hasErrors = Object.values(newErrors).some((val) => val);

    if (hasErrors) {
      showErrorToast('Hay Errores en el Formulario');
      return; // No enviar si hay errores
    }

    // Enviar formulario
    informeExogenas(formData);
    // setFormData({
    //   cliente: '',
    //   year: '',
    //   anuladas: '',
    //   opciones: '',
    //   informe: '',
    //   desde: '',
    //   hasta: '',
    //   desde2: '',
    //   hasta2: '',
    // });
    // onClose();
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
          <h2 className="text-xl font-bold mb-4 text-[#6F6F6F]">EXOGENAS</h2>
          {/* Cliente */}
          <div className="flex flex-col">
            <div className="flex items-center w-full relative space-x-3">
              {loadingClientes ? (
                <div>Cargando opciones...</div>
              ) : (
                <div className="relative flex-1">
                  <SelectConSearch
                    label="Cliente"
                    options={clientes}
                    placeholder="Buscar un Cliente"
                    value={formData.cliente}
                    onChange={(value) => {
                      setFormData((prev) => ({
                        ...prev,
                        cliente: value,
                      }));

                      setErrors((prev) => ({
                        ...prev,
                        cliente: false, // No hay error al seleccionar el cliente
                      }));
                    }}
                    error={errors.cliente}
                    // errorMessage="Debes seleccionar un cliente"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Si o no Anuladas */}
          <div className="relative flex-1">
            <SelectConSearch
              label="Anulada"
              options={opcionesSimples}
              placeholder="Opciones"
              value={formData.anuladas}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  anuladas: value,
                }));

                setErrors((prev) => ({
                  ...prev,
                  anuladas: false, // No hay error al seleccionar el anuladas
                }));
              }}
              error={errors.anuladas}
              //   errorMessage="Debes seleccionar un anuladas"
            />
          </div>

          {/* Año */}
          <div>
            <label className="block text font-montserrat font-normal text-sm text-[#6F6F6F] mt-4">
              Año
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              className={`w-full h-10 px-4 border mt-5 rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 border-[#00A7E1] focus:outline-none shadow-sm ${
                errors.year ? 'border-red-500' : ''
              }`}
              value={formData.year}
              onChange={(e) => {
                const value = e.target.value;

                // Solo permitir dígitos del 0 al 9
                const onlyNumbers = value.replace(/\D/g, '');

                setFormData((prev) => ({
                  ...prev,
                  year: onlyNumbers,
                }));

                setErrors((prev) => ({ ...prev, year: !onlyNumbers }));
              }}
            />
          </div>

          {/* Opciones */}
          <label className="block text font-montserrat font-normal text-sm text-[#6F6F6F] mt-4">
            Opciones
          </label>
          <div className="mt-4">
            <SimpleSelect
              options={opciones}
              placeholder="Opciones"
              width={'100%'}
              value={formData.opciones}
              error={errors.opciones}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  opciones: value,
                }));
                setErrors((prev) => ({ ...prev, opciones: !value }));
              }}
            />
          </div>

          {/* Tipos Informes */}
          <div className="relative flex-1">
            <SelectConSearch
              label="Informes"
              options={tiposInformes}
              placeholder="Opciones"
              value={formData.informe}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  informe: value,
                }));

                setErrors((prev) => ({
                  ...prev,
                  informe: false, // No hay error al seleccionar el informe
                }));
              }}
              error={errors.informe}
              //   errorMessage="Debes seleccionar un informe"
            />
          </div>

          {/* Desde 1 */}
          <div>
            <DatePickerInput
              label="Desde"
              name="desde"
              value={formData.desde || ''}
              error={errors.desde}
              onChange={(newDate) => {
                setFormData((prev) => ({
                  ...prev,
                  desde: newDate,
                }));
                setErrors((prev) => ({
                  ...prev,
                  desde: false,
                }));
              }}
            />
          </div>

          {/* hasta 1 */}
          <div>
            <DatePickerInput
              label="Hasta"
              name="hasta"
              value={formData.hasta || ''}
              error={errors.hasta}
              onChange={(newDate) => {
                setFormData((prev) => ({
                  ...prev,
                  hasta: newDate,
                }));
                setErrors((prev) => ({
                  ...prev,
                  hasta: false,
                }));
              }}
            />
          </div>

          {/* desde 2 */}
          <div>
            <DatePickerInput
              label="Desde"
              name="desde2"
              value={formData.desde2 || ''}
              error={errors.desde2}
              onChange={(newDate) => {
                setFormData((prev) => ({
                  ...prev,
                  desde2: newDate,
                }));
                setErrors((prev) => ({
                  ...prev,
                  desde2: false,
                }));
              }}
            />
          </div>

          {/* Hasta 2 */}
          <div>
            <DatePickerInput
              label="Hasta"
              name="hasta2"
              value={formData.hasta2 || ''}
              error={errors.hasta2}
              onChange={(newDate) => {
                setFormData((prev) => ({
                  ...prev,
                  hasta2: newDate,
                }));
                setErrors((prev) => ({
                  ...prev,
                  hasta2: false,
                }));
              }}
            />
          </div>

          {/* Botones cancelar y enviar */}
          <div className="flex justify-end space-x-3 mt-6 mb-20 ">
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
              Crear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExogenasModal;
