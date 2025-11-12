'use client';
import React, { useEffect, useState } from 'react';
import { validateTextos } from '../../app/gestionDeFacturasElectronicas/validations';
import { ArrowLeft } from 'lucide-react';
import InputField from '@/components/ui/InputField';
import DatePickerInput from '../../components/ui/inputFechaCalendario';
import CheckboxUI from '@/components/ui/CheckBoxUI';
import BotonQuality from '@/components/ui/BotonQuality';
import { useEstablecimientoStore } from '@/store/POS/useEstablecimientoStore';
import { showErrorToast } from '@/components/feedback/toast';

export interface IFormEstablecimientos {
  id?: string;
  nombre: string;
  nit: string;
  email: string;
  direccion: string;
  codigo_postal: string;
  telefono: string;
  api_key: string;
  fecha_expiracion: string;
  activo: boolean;
  //No para crear
  impuesto_porcentaje?: string;
  licencia_key?: string;
  fecha_activacion?: string;
  licencia_activa?: boolean;
  dispositivo_id?: string;
  created_at?: string;
  updated_at?: string;
}

interface Errors {
  [key: string]: boolean;
}
interface ModalFormProps {
  isOpen: boolean;
  establecimiento: IFormEstablecimientos | null;
  onClose: () => void;
}

const FormEstablecimientos: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  establecimiento,
}) => {
  const { crearEstablecimiento, actualizarEstablecimiento } =
    useEstablecimientoStore();

  const initialFormData: IFormEstablecimientos = {
    nombre: '',
    nit: '',
    email: '',
    direccion: '',
    codigo_postal: '',
    telefono: '',
    api_key: '',
    fecha_expiracion: '',
    activo: true,
    //Opcionales
    impuesto_porcentaje: '',
    licencia_key: '',
    fecha_activacion: '',
    licencia_activa: true,
    dispositivo_id: '',
    created_at: '',
    updated_at: '',
  };
  const [formData, setFormData] =
    useState<IFormEstablecimientos>(initialFormData);
  const [errors, setErrors] = useState<Errors>({});

  // Si establecimiento existe, actualiza el estado del formulario.
  useEffect(() => {
    if (establecimiento) {
      console.log(establecimiento);
      setFormData({
        nombre: establecimiento.nombre || '',
        nit: establecimiento.nit || '',
        email: establecimiento.email || '',
        direccion: establecimiento.direccion || '',
        impuesto_porcentaje: establecimiento.impuesto_porcentaje || '',
        codigo_postal: establecimiento.codigo_postal || '',
        telefono: establecimiento.telefono || '',
        api_key: establecimiento.api_key || '',
        fecha_expiracion: establecimiento.fecha_expiracion || '',
        activo: establecimiento.activo || true,
        licencia_key: establecimiento.licencia_key || '',
        fecha_activacion: establecimiento.fecha_activacion || '',
        licencia_activa: establecimiento.licencia_activa || true,
        dispositivo_id: establecimiento.dispositivo_id || '',
        created_at: establecimiento.created_at || '',
        updated_at: establecimiento.updated_at || '',
      });
    }
  }, [establecimiento]);
  // Deshabilitar scroll cuando el formulario esté abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Deshabilitar scroll
    } else {
      document.body.style.overflow = 'auto'; // Restaurar el scroll de manera explícita
    }

    // Cleanup: Restaurar el scroll al desmontar o cambiar el estado
    return () => {
      document.body.style.overflow = 'auto'; // Asegurarse de que siempre se restaure
    };
  }, [isOpen]);

  const requiredFields = [
    'nombre',
    'nit',
    'email',
    'direccion',
    'codigo_postal',
    'telefono',
    'api_key',
    'fecha_expiracion',
  ];

  const validateField = (name: string, value: string | boolean): boolean => {
    if (name === 'activo') return false; // checkbox no se valida

    // Si el campo es requerido y está vacío => error
    if (
      requiredFields.includes(name) &&
      typeof value === 'string' &&
      value.trim() === ''
    ) {
      return true;
    }

    // Validación específica de email
    if (name === 'email') {
      if (typeof value === 'string' && value.trim() !== '') {
        const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string);
        return !isValidEmail;
      }
    }

    return false; // No error
  };

  // Maneja cambios en inputs de texto
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Validación en tiempo real
    const hasError = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: hasError }));
  };
  const handleDateChange = (field: string, value: string) => {
    const hasError = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: hasError }));
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validación al enviar
  const handleSubmit = async () => {
    const newErrors: Errors = {};
    Object.entries(formData).forEach(([key, value]) => {
      newErrors[key] = validateField(key, value);
    });

    setErrors(newErrors);

    const hasAnyError = Object.values(newErrors).some((v) => v === true);
    if (hasAnyError) {
      showErrorToast('Completa todos los campos');
      return;
    }

    const {
      licencia_key,
      fecha_activacion,
      licencia_activa,
      dispositivo_id,
      created_at,
      updated_at,
      impuesto_porcentaje,
      ...cleanData
    } = formData;

    let response;

    if (!establecimiento) {
      response = await crearEstablecimiento(cleanData);
    } else {
      response = await actualizarEstablecimiento(
        cleanData,
        establecimiento.id || ''
      );
    }

    if (response) handleCancel();
  };

  const handleCancel = () => {
    setFormData(initialFormData);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleCancel}
    >
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition"
              onClick={onClose}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold flex-1 text-center">
              {establecimiento ? 'Actualizar el' : 'Crear un'} establecimiento
            </h2>
            <div className="w-10" />
          </div>

          <div>
            {establecimiento && (
              <InputField
                label="ID"
                name="nombre"
                readOnly
                value={establecimiento.id || 'No disponible'}
                onChange={() => console.log()}
              />
            )}
            <InputField
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              error={errors.nombre}
              onChange={handleChange}
            />
            <InputField
              label="NIT"
              name="nit"
              value={formData.nit}
              error={errors.nit}
              onChange={handleChange}
            />
            <InputField
              label="Email"
              name="email"
              value={formData.email}
              error={errors.email}
              onChange={handleChange}
            />
            <InputField
              label="Direccion"
              name="direccion"
              value={formData.direccion}
              error={errors.direccion}
              onChange={handleChange}
            />
            <InputField
              label="Codigo Postal"
              name="codigo_postal"
              value={formData.codigo_postal}
              error={errors.codigo_postal}
              onChange={handleChange}
            />
            <InputField
              label="Telefono"
              name="telefono"
              value={formData.telefono}
              error={errors.telefono}
              onChange={handleChange}
            />
            <InputField
              label="Api Key"
              name="api_key"
              value={formData.api_key}
              error={errors.api_key}
              onChange={handleChange}
            />

            <DatePickerInput
              label="Fecha Expiracion"
              value={formData.fecha_expiracion}
              onChange={(value) => handleDateChange('fecha_expiracion', value)}
              error={errors.fecha_expiracion}
            />

            {establecimiento ? (
              <>
                <InputField
                  label="Licencia Key"
                  name="licencia_key"
                  readOnly={true}
                  value={formData.licencia_key || 'No se encontro la licencia'}
                  onChange={handleChange}
                />
                <InputField
                  label="Fecha de Activacion"
                  name="fecha_activacion"
                  readOnly={true}
                  value={formData.fecha_activacion || ''}
                  onChange={handleChange}
                />
                <InputField
                  label="Licencia Activa"
                  name="licencia_activa"
                  readOnly={true}
                  value={formData.licencia_activa === true ? 'NO' : 'SI'}
                  onChange={handleChange}
                />
                <InputField
                  label="Dispositivo ID"
                  name="dispositivo_id"
                  readOnly={true}
                  value={formData.dispositivo_id || ''}
                  onChange={handleChange}
                />
                <InputField
                  label="Creado el:"
                  name="created_at"
                  readOnly={true}
                  value={formData.created_at || ''}
                  onChange={handleChange}
                />
                <InputField
                  label="Actualizado el:"
                  name="updated_at"
                  readOnly={true}
                  value={formData.updated_at || ''}
                  onChange={handleChange}
                />
              </>
            ) : (
              ''
            )}
            <div className="mt-4">
              <CheckboxUI
                label="Activo"
                checked={formData.activo}
                onChange={(checked) =>
                  setFormData((prev) => ({ ...prev, activo: checked }))
                }
              />
            </div>

            {/* Agrega más campos aquí siguiendo el mismo patrón */}
            <div className="flex justify-end space-x-3 mt-4 ">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-[#333332] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#4b4b4b] w-full sm:w-auto"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                className="bg-[#00A7E1] text-white w-24 h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1]"
              >
                {establecimiento ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormEstablecimientos;
