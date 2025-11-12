'use client';
import React, { useEffect, useState } from 'react';
import { validateTextos } from '../../app/gestionDeFacturasElectronicas/validations';
import { ArrowLeft } from 'lucide-react';
import InputField from '@/components/ui/InputField';
import DatePickerInput from '../../components/ui/inputFechaCalendario';
import CheckboxUI from '@/components/ui/CheckBoxUI';
import BotonQuality from '@/components/ui/BotonQuality';
import { showErrorToast } from '@/components/feedback/toast';
import { useUsuariosPosStore } from '@/store/POS/useUsuariosPosStore';
import { useRolesPosStore } from '@/store/POS/useRolesStorePos';
import SimpleSelect from '@/components/ui/SimpleSelect';
import SelectConSearch from '@/components/ui/selectConSearch';
import { useEstablecimientoStore } from '@/store/POS/useEstablecimientoStore';
import { listItemAvatarClasses } from '@mui/material';
import Spinner from '@/components/feedback/Spinner';

export interface IFormUsuariosPos {
  id?: string;
  nombre: string;
  password: string;
  apellido: string;
  username: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  establecimientoName: string;
  rolName: string;
}

interface Errors {
  [key: string]: boolean;
}
interface ModalFormProps {
  isOpen: boolean;
  UsuarioPos: IFormUsuariosPos | null;
  onClose: () => void;
}

const FormUsuariosPos: React.FC<ModalFormProps> = ({
  isOpen,
  onClose,
  UsuarioPos,
}) => {
  const { traerEstablecimientos, listaEstablecimientos, loading } =
    useEstablecimientoStore();
  const { traerRoles, rolesPos, loading: loadingRoles } = useRolesPosStore();
  const {
    crearUsuariosPos,
    actualizarUsuariosPos,
    loading: loadingUsuarios,
  } = useUsuariosPosStore();
  const initialFormData: IFormUsuariosPos = {
    id: '',
    establecimientoName: '',
    rolName: '',
    password: '',
    nombre: '',
    apellido: '',
    username: '',
    activo: true,
    created_at: '',
    updated_at: '',
  };
  const [formData, setFormData] = useState<IFormUsuariosPos>(initialFormData);
  const [errors, setErrors] = useState<Errors>({});

  // Fetch data
  useEffect(() => {
    handleFetch();
  }, []);

  // Si UsuarioPos existe, actualiza el estado del formulario.
  useEffect(() => {
    if (UsuarioPos) {
      const rol = rolesPos.find(
        (rolPorEncontrar) => rolPorEncontrar.nombre === UsuarioPos.rolName
      );
      setFormData({
        id: UsuarioPos.nombre || '',
        password: UsuarioPos.password || '',
        nombre: UsuarioPos.nombre || '',
        apellido: UsuarioPos.apellido || '',
        username: UsuarioPos.username || '',
        activo: UsuarioPos.activo,
        created_at: UsuarioPos.created_at || '',
        updated_at: UsuarioPos.updated_at || '',
        establecimientoName: UsuarioPos.establecimientoName || '',
        rolName: rol?.id || '',
      });
    }
  }, [UsuarioPos]);
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

  const handleFetch = () => {
    traerRoles();
    traerEstablecimientos();
  };
  const requiredFields = [
    'nombre',
    'apellido',
    'username',
    'password',
    'rolName',
    'establecimientoName',
  ];

  const validateField = (name: string, value: string | boolean): boolean => {
    if (name === 'activo') return false; // checkbox no se valida

    // Validación específica de password
    if (name === 'password' && typeof value === 'string') {
      if (UsuarioPos) {
        // Estamos editando
        if (value.trim() === '') return false; // vacio está bien
      }
      // Validar si tiene valor
      if (value.trim() !== '') {
        const isValidPassword = /^(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(value);
        return !isValidPassword;
      }
      return false; // si está vacío y no hay UsuarioPos, no hay error (podrías hacerlo requerido si quieres)
    }
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

    // Buscar nombres por ID
    const establecimientoSeleccionado = listaEstablecimientos.find(
      (e) => e.id === formData.establecimientoName
    );
    const rolSeleccionado = rolesPos.find((r) => r.id === formData.rolName);

    if (!rolSeleccionado || (!UsuarioPos && !establecimientoSeleccionado)) {
      // Solo pedimos establecimiento si es creación
      showErrorToast('Selecciona un establecimiento y un rol válidos');
      return;
    }

    // Crear payload base
    let basePayload: any = {
      rolName: rolSeleccionado.nombre,
      nombre: formData.nombre,
      apellido: formData.apellido,
      username: formData.username,
      activo: formData.activo,
    };

    // Solo agregar establecimiento al crear
    if (!UsuarioPos) {
      basePayload.establecimientoName = establecimientoSeleccionado?.nombre;
    }

    let response;
    if (!UsuarioPos) {
      // CREATE siempre incluye password
      response = await crearUsuariosPos({
        ...basePayload,
        password: formData.password,
      });
    } else {
      // UPDATE: solo incluir password si no está vacío
      const payloadUpdate: any = { ...basePayload };
      if (formData.password.trim() !== '') {
        payloadUpdate.password_nueva = formData.password;
      }

      response = await actualizarUsuariosPos(
        payloadUpdate,
        UsuarioPos.id || 'NO SE ENCONTRO ID'
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

  const formFields = [
    { label: 'Nombre', name: 'nombre', type: 'text' },
    { label: 'Apellido', name: 'apellido', type: 'text' },
    { label: 'Usuario', name: 'username', type: 'text' },
    {
      label: UsuarioPos ? 'Contraseña nueva' : 'Contraseña',
      name: 'password',
      type: 'text',
    },
  ];

  const camposNoEditables = [
    { label: 'Creado el:', name: 'created_at', type: 'text', readOnly: true },
    {
      label: 'Actualizado el:',
      name: 'updated_at',
      type: 'text',
      readOnly: true,
    },
  ];
  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleCancel}
    >
      {loading || loadingRoles || (loadingUsuarios && <Spinner />)}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div
          className="bg-white p-6 rounded-md shadow-md w-[600px] max-h-[90vh] overflow-y-auto scroll-smooth"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              className="p-2 rounded-full hover:bg-gray-200 transition"
              onClick={handleCancel}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-xl font-bold flex-1 text-center">
              {UsuarioPos ? 'Actualizar el' : 'Crear un'} usuario POS
            </h2>
            <div className="w-10" />
          </div>

          <div>
            <SelectConSearch
              label="Rol"
              disabled={UsuarioPos ? true : false}
              options={rolesPos}
              value={formData.rolName}
              onChange={(value) =>
                handleChange({
                  target: { name: 'rolName', value },
                } as React.ChangeEvent<HTMLInputElement>)
              }
              error={errors.rolName}
            />
            {formFields.map((field) => (
              <InputField
                key={field.name}
                label={field.label}
                name={field.name}
                type={field.type}
                value={formData[field.name as keyof IFormUsuariosPos] as string}
                error={errors[field.name]}
                onChange={handleChange}
              />
            ))}
            <SelectConSearch
              label="Establecimiento"
              options={listaEstablecimientos}
              value={formData.establecimientoName}
              disabled={UsuarioPos ? true : false}
              onChange={(value) =>
                handleChange({
                  target: { name: 'establecimientoName', value },
                } as React.ChangeEvent<HTMLInputElement>)
              }
              error={errors.establecimientoName}
            />
            {UsuarioPos &&
              camposNoEditables.map((field) => (
                <InputField
                  key={field.name}
                  label={field.label}
                  readOnly={field.readOnly}
                  name={field.name}
                  type={field.type}
                  value={
                    formData[field.name as keyof IFormUsuariosPos] as string
                  }
                  error={errors[field.name]}
                  onChange={handleChange}
                />
              ))}

            <div className="mt-4">
              <CheckboxUI
                label="Activo"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    activo: e,
                  }))
                }
                checked={formData.activo}
              />
            </div>

            {/* Agrega más campos aquí siguiendo el mismo patrón */}
            <div className="flex justify-end space-x-3 mt-4 mb-44">
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
                {UsuarioPos ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormUsuariosPos;
