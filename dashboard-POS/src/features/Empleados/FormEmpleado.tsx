"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import InputField from "@/components/ui/InputField";
import SimpleSelect from "@/components/ui/SimpleSelect";
import toast from "react-hot-toast";
import BotonRestaurante from "@/components/ui/Boton";
import { useEstablecimientosStore } from "@/stores/establecimientosStore";
import { useRolesStore } from "@/stores/rolesStore";
import Checkbox from "@/components/ui/CheckBox";
import { useConfirm } from "@/components/feedback/confirmModal";
import { useEmpleadosStore } from "@/stores/empleadosStore";
import Spinner from "@/components/feedback/Spinner";

export type EmpleadoFormData = {
  id?: string;
  establecimiento_id: string;
  rol_id: string;
  nombre: string;
  password?: string;
  apellido: string;
  username: string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  rol?: Rol;
};

type Rol = {
  id: string;
  nombre: string;
};
interface ModalFormProps {
  isOpen: boolean;
  empleado?: EmpleadoFormData;
  onClose: () => void;
}

interface Errors {
  // establecimiento_id: boolean;
  rol_id: boolean;
  nombre: boolean;
  apellido: boolean;
  password: boolean;
  username: boolean;
}

const FormEmpleadoRestaurante: React.FC<ModalFormProps> = ({
  isOpen,
  empleado,
  onClose,
}) => {
  const confirm = useConfirm();
  const { crearEmpleado, actualizarEmpleado, loading } = useEmpleadosStore();
  const { fetchEstablecimientos, establecimientos } =
    useEstablecimientosStore();
  const { fetchRoles, roles } = useRolesStore();
  const [canEditPassword, setCanEditPassword] = useState(false);

  // Estado inicial, usa datos existentes o defaults
  const [formData, setFormData] = useState<EmpleadoFormData>({
    id: empleado?.id || undefined,
    password: "",
    establecimiento_id: empleado?.establecimiento_id || "",
    rol_id: empleado?.rol_id || "",
    nombre: empleado?.nombre || "",
    apellido: empleado?.apellido || "",
    username: empleado?.username || "",
    activo: empleado?.activo ?? true,
    created_at: empleado?.created_at,
    updated_at: empleado?.updated_at,
  });
  const [errors, setErrors] = useState<Errors>({
    // establecimiento_id: false,
    rol_id: false,
    nombre: false,
    apellido: false,
    password: false,
    username: false,
  });

  useEffect(() => {
    fetchEstablecimientos();
    fetchRoles();
  }, []);

  useEffect(() => {
    setFormData({
      id: empleado?.id,
      establecimiento_id: empleado?.establecimiento_id || "",
      rol_id: empleado?.rol_id || "",
      nombre: empleado?.nombre || "",
      apellido: empleado?.apellido || "",
      username: empleado?.username || "",
      password: "",
      activo: empleado?.activo ?? true,
      created_at: empleado?.created_at,
      updated_at: empleado?.updated_at,
    });
    setCanEditPassword(false);
  }, [empleado]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onUpdate = (updatedFields: Partial<EmpleadoFormData>) => {
    setFormData((prev) => ({ ...prev, ...updatedFields }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // 👈 evita que cierre el modal

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    const newErrors: Errors = {
      rol_id: formData.rol_id === "",
      nombre: formData.nombre.trim() === "",
      apellido: formData.apellido.trim() === "",
      username: formData.username.trim() === "",
      password: false,
    };

    if (!empleado) {
      newErrors.password =
        !formData.password || !passwordRegex.test(formData.password.trim());
    }

    if (empleado && formData.password?.trim()) {
      newErrors.password = !passwordRegex.test(formData.password.trim());
    }

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      toast.error(
        newErrors.password
          ? "La contraseña debe tener mínimo 8 caracteres, incluir una mayúscula, una minúscula y un número."
          : "Por favor completa todos los campos requeridos."
      );
      return;
    }

    const rolSeleccionado = roles.find(
      (rol) => rol.id === formData.rol_id || rol.nombre === formData.rol_id
    );

    if (!rolSeleccionado) {
      toast.error("No se encontró un rol válido.");
      return;
    }

    // Construimos payload limpio
    let dataConRolId: any = {
      ...formData,
      rolName: rolSeleccionado.nombre,
    };

    // 🚨 Si es admin, no mandamos el rol
    if (rolSeleccionado.nombre.toLowerCase() === "admin") {
      delete dataConRolId.rol_id;
      delete dataConRolId.rolName;
    }

    // 🚨 Solo agregamos password_nueva si realmente la editaron
    const conRolYNuevaPassword = {
      ...dataConRolId,
      ...(formData.password?.trim()
        ? { password_nueva: formData.password }
        : {}),
    };

    let respuesta = false;
    if (empleado) {
      respuesta = await actualizarEmpleado(conRolYNuevaPassword);
    } else {
      respuesta = await crearEmpleado(dataConRolId);
    }

    if (respuesta) {
      handleCancel();
    }
  };

  const handleCancel = () => {
    resetFormData();
    resetErrors();
    onClose();
  };

  const softClose = () => {
    resetErrors();
    onClose();
  };

  const resetFormData = () => {
    setFormData({
      id: "",
      establecimiento_id: "",
      rol_id: "",
      nombre: "",
      password: "",
      apellido: "",
      username: "",
      activo: true,
      created_at: "",
      updated_at: "",
    });
  };

  const resetErrors = () => {
    setErrors({
      rol_id: false,
      nombre: false,
      apellido: false,
      password: false,
      username: false,
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all"
      onClick={(e) => {
        if (e.target === e.currentTarget) softClose();
      }}
    >
      <div
        className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-6">
          <button onClick={softClose}>
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-700">
            {empleado ? "Editar" : "Crear"} Empleado
          </h2>
          <div className="w-6" />
        </header>
        <form onSubmit={handleSubmit} className="space-y-4">
          <InputField
            label="Nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            error={errors.nombre}
          />

          <InputField
            label="Apellido"
            name="apellido"
            value={formData.apellido}
            onChange={handleChange}
            error={errors.apellido}
          />

          <InputField
            label="Usuario (username)"
            name="username"
            value={formData.username}
            onChange={handleChange}
            error={errors.username}
          />

          <SimpleSelect
            label="Rol"
            options={roles}
            placeholder="Seleccione un rol"
            width="100%"
            value={formData.rol_id}
            onChange={(val) => onUpdate({ rol_id: val })}
            readOnly={empleado ? true : false}
          />

          {!empleado ? (
            <InputField
              label="Contraseña"
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              error={errors.password}
            />
          ) : (
            <InputField
              label="Contraseña Nueva"
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              error={errors.password}
            />
          )}

          {errors.password && (
            <h3
              style={{ color: "red", marginTop: "4px", fontSize: "0.875rem" }}
            >
              La contraseña debe tener al menos 8 caracteres, una mayúscula, una
              minúscula y un número.
            </h3>
          )}

          <div className="flex items-center space-x-2">
            {empleado?.rol?.nombre !== "ADMIN" && (
              <Checkbox
                label="Activo"
                checked={formData.activo}
                onChange={(checked) => onUpdate({ activo: checked })}
              />
            )}
          </div>

          {empleado && (
            <div className="text-gray-500 text-sm">
              <p>Creado: {new Date(formData.created_at!).toLocaleString()}</p>
              <p>
                Última actualización:{" "}
                {new Date(formData.updated_at!).toLocaleString()}
              </p>
            </div>
          )}

          <footer className="flex justify-end space-x-3 mt-6">
            <BotonRestaurante
              label="Cancelar"
              type="button"
              variacion="claro"
              onClick={handleCancel}
            />
            <BotonRestaurante
              type="submit"
              label={empleado ? "Actualizar" : "Crear"}
            />
          </footer>
        </form>
        {loading && <Spinner />}
      </div>
    </div>
  );
};

export default FormEmpleadoRestaurante;
