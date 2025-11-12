'use client';
import React, { useState, useEffect } from 'react';
import { validateTextos } from '../../app/gestionDeFacturasElectronicas/validations';
import { ArrowLeft } from 'lucide-react';
import 'react-datepicker/dist/react-datepicker.css';
import InputField from '@/components/ui/InputField';
import { showErrorToast } from '@/components/feedback/toast';

interface ModalFormProps {
  isOpen: boolean;
  id?: string;
  onClose: () => void;
  closeAcciones?: () => void;
}

interface Errors {
  nombre: boolean;
  password: boolean;
  rol: boolean;
  seccion: boolean;
}

export interface EmpleadosRestaurante {
  nombre: string;
  password: string;
  rol: string;
  seccion: string;
}

const FormEmpleadoRestaurante: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  id,
}) => {
  const [formData, setFormData] = useState<EmpleadosRestaurante>({
    nombre: '',
    password: '',
    rol: '',
    seccion: '',
  });

  const [errors, setErrors] = useState<Errors>({
    nombre: false,
    password: false,
    rol: false,
    seccion: false,
  });

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value ?? '',
    }));

    const validators: Record<string, (value: string) => boolean> = {
      nombre: validateTextos,
      password: validateTextos,
      rol: validateTextos,
      seccion: validateTextos,
    };

    if (validators[name]) {
      setErrors((prev) => ({ ...prev, [name]: !validators[name](value) }));
    }
  };

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const newErrors: Errors = {
      nombre: !validateTextos(formData.nombre),
      password: !validateTextos(formData.password),
      rol: !validateTextos(formData.rol),
      seccion: !validateTextos(formData.seccion),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((error) => error)) {
      showErrorToast('Faltan campos.');
      return;
    }

    console.log(id ? 'Actualizar empleado' : 'Crear empleado');
    console.log(formData);

    handleClose();
  };

  const handleClose = () => {
    setFormData({
      nombre: '',
      password: '',
      rol: '',
      seccion: '',
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleClose}
    >
      <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition"
              onClick={handleClose}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold flex-1 text-center">
              {id ? 'Actualizar' : 'Nuevo'} Empleado
            </h2>
            <div className="w-10"></div>
          </div>

          <div className="space-y-4">
            <InputField
              label="Nombre"
              name="nombre"
              value={formData.nombre}
              error={errors.nombre}
              onChange={handleChange}
            />

            <InputField
              label="Contraseña"
              name="password"
              value={formData.password}
              error={errors.password}
              onChange={handleChange}
            />

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rol
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 text-sm ${
                  errors.rol ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecciona un rol</option>
                <option value="mesero">Mesero</option>
                <option value="cocinero">Cocinero</option>
                <option value="cajero">Cajero</option>
              </select>
            </div>

            {/* Sección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sección
              </label>
              <select
                name="seccion"
                value={formData.seccion}
                onChange={handleChange}
                className={`w-full border rounded-md px-3 py-2 text-sm ${
                  errors.seccion ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecciona una sección</option>
                {[1, 2, 3, 4, 5].map((sec) => (
                  <option key={sec} value={sec}>{`Sección ${sec}`}</option>
                ))}
              </select>
            </div>

            {Object.values(errors).includes(true) && (
              <p className="text-red-500 text-sm flex justify-center mt-2">
                Debe llenar todos los campos requeridos.
              </p>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="bg-[#333332] text-white h-8 px-4 py-2 rounded-3xl text-[12px] hover:bg-[#4b4b4b]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="bg-[#00A7E1] text-white h-8 px-4 py-2 rounded-3xl text-[12px] hover:bg-[#008ec1]"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormEmpleadoRestaurante;
