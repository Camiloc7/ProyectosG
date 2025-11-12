"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import InputField from "@/components/ui/InputField";
import toast from "react-hot-toast";
import BotonRestaurante from "@/components/ui/Boton";
import { useDatosExtraStore } from "@/stores/datosExtraStore";
import { IProveedor } from "@/types/models";

interface ModalFormProps {
  isOpen: boolean;
  proveedor?: IProveedor;
  onClose: () => void;
  onSave: (data: IProveedor) => void | Promise<void>;
}

interface Errors {
  nombre: boolean;
  contacto: boolean;
  telefono: boolean;
  nit: boolean;
  email: boolean;
}

const FormProveedores: React.FC<ModalFormProps> = ({
  isOpen,
  proveedor,
  onClose,
  onSave,
}) => {
  const { fetchUnidadesDeMedida, unidadesDeMedida } = useDatosExtraStore();
  // Estado inicial, usa datos existentes o defaults
  const [formData, setFormData] = useState<IProveedor>({
    id: "",
    nombre: "",
    nit: "",
    contacto: "",
    telefono: "",
    email: "",
  });

  const [errors, setErrors] = useState<Errors>({
    nombre: false,
    contacto: false,
    nit: false,
    telefono: false,
    email: false,
  });

  useEffect(() => {
    fetchUnidadesDeMedida();
  }, []);

  useEffect(() => {
    if (proveedor) {
      setFormData({
        id: proveedor?.id,
        nombre: proveedor?.nombre,
        nit: proveedor?.nit,
        contacto: proveedor?.contacto,
        telefono: proveedor?.telefono,
        email: proveedor?.email,
      });
    } else {
      setFormData({
        id: "",
        nombre: "",
        nit: "",
        contacto: "",
        telefono: "",
        email: "",
      });
    }

    setErrors({
      nombre: false,
      contacto: false,
      telefono: false,
      email: false,
      nit: false,
    });
  }, [proveedor]);

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

  const resetData = () => {
    setFormData({
      id: "",
      nombre: "",
      nit: "",
      contacto: "",
      telefono: "",
      email: "",
    });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Validación básica de email
    const newErrors: Errors = {
      nombre: formData.nombre.trim() === "",
      contacto: formData.contacto.trim() === "",
      nit: formData.nit.trim() === "",
      telefono: formData.telefono.trim() === "",
      email: formData.email.trim() === "" || !emailRegex.test(formData.email),
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      toast.error(
        "Por favor completa todos los campos requeridos con información válida."
      );
      return;
    }

    onSave(formData);
    resetData();
    onClose();
  };

  const handleCancel = () => {
    resetData();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all"
      onClick={handleCancel}
    >
      <div
        className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-6">
          <button onClick={handleCancel}>
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-700">
            {proveedor ? "Editar" : "Crear"} Proveedor
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
            label="Contacto"
            name="contacto"
            value={formData.contacto}
            onChange={handleChange}
            error={errors.contacto}
          />
          <InputField
            label="telefono"
            name="telefono"
            type="number"
            value={formData.telefono}
            onChange={handleChange}
            error={errors.telefono}
          />
          <InputField
            label="Nit"
            name="nit"
            value={formData.nit}
            onChange={handleChange}
            error={errors.nit}
          />
          <InputField
            label="Email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />
          {errors.email ? (
            <p
              style={{
                color: "#f56565",
                fontSize: 12,
                marginTop: 4,
                fontFamily: "Lato, sans-serif",
              }}
            >
              El Email debe ser valido
            </p>
          ) : (
            ""
          )}
          <footer className="flex justify-end space-x-3 mt-6">
            <BotonRestaurante
              label="Cancelar"
              variacion="claro"
              type="button"
              onClick={handleCancel}
            />
            <BotonRestaurante
              type="submit"
              label={proveedor ? "Actualizar" : "Crear"}
            />
          </footer>
        </form>
      </div>
    </div>
  );
};

export default FormProveedores;
