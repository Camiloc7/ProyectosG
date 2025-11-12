"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, FolderMinus } from "lucide-react";
import InputField from "@/components/ui/InputField";
import toast from "react-hot-toast";
import BotonRestaurante from "@/components/ui/Boton";
import SimpleSelect from "@/components/ui/SimpleSelect";
import { useDatosExtraStore } from "@/stores/datosExtraStore";
import SelectConSearch from "@/components/ui/SelectConSearch";
import { useConfiguracionStore } from "@/stores/configuracionStore";
import Checkbox from "@/components/ui/CheckBox";

export type IFormCuentas = {
  id: string;
  nombre_banco: string;
  medio_pago_asociado_id: string;
  activa: boolean;
  tipo_cuenta: string;
  numero_cuenta: string;
  codigo_puc?: string;
};

interface ModalFormProps {
  isOpen: boolean;
  cuenta?: IFormCuentas;
  onClose: () => void;
  onSave: (data: IFormCuentas) => void | Promise<void>;
}

interface Errors {
  nombre_banco: boolean;
  tipo_cuenta: boolean;
  medio_pago_asociado_id: boolean;
  numero_cuenta: boolean;
}

const tiposDeCuentas = [
  { id: "AHORRO", nombre: "Cuenta de Ahorro" },
  { id: "CORRIENTE", nombre: "Cuenta Corriente" },
];

const FormCuentas: React.FC<ModalFormProps> = ({
  isOpen,
  cuenta,
  onClose,
  onSave,
}) => {
  const { mediosDePago, traerMediosDePago } = useConfiguracionStore();
  const { fetchUnidadesDeMedida, unidadesDeMedida } = useDatosExtraStore();
  // Estado inicial, usa datos existentes o defaults
  const [formData, setFormData] = useState<IFormCuentas>({
    id: "",
    nombre_banco: "",
    activa: true,
    tipo_cuenta: "",
    numero_cuenta: "",
    medio_pago_asociado_id: "",
    codigo_puc: "",
  });
  const [errors, setErrors] = useState<Errors>({
    nombre_banco: false,
    tipo_cuenta: false,
    medio_pago_asociado_id: false,
    numero_cuenta: false,
  });

  useEffect(() => {
    fetchUnidadesDeMedida();
  }, []);

  useEffect(() => {
    if (cuenta) {
      setFormData({
        id: cuenta?.id,
        activa: cuenta?.activa,
        nombre_banco: cuenta?.nombre_banco,
        medio_pago_asociado_id: cuenta?.medio_pago_asociado_id,
        tipo_cuenta: cuenta?.tipo_cuenta,
        numero_cuenta: cuenta?.numero_cuenta,
        codigo_puc: cuenta?.codigo_puc,
      });
    } else {
      setFormData({
        id: "",
        activa: true,
        nombre_banco: "",
        medio_pago_asociado_id: "",
        tipo_cuenta: "",
        numero_cuenta: "",
        codigo_puc: "",
      });
    }
    setErrors({
      nombre_banco: false,
      tipo_cuenta: false,
      medio_pago_asociado_id: false,
      numero_cuenta: false,
    });
  }, [cuenta]);
  useEffect(() => {
    traerMediosDePago();
  }, []);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    const newErrors: Errors = {
      nombre_banco: formData.nombre_banco === "",
      medio_pago_asociado_id: formData.medio_pago_asociado_id === "",
      tipo_cuenta: formData.tipo_cuenta.trim() === "",
      numero_cuenta: formData.numero_cuenta.trim() === "",
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }
    onSave(formData);
    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };
  const resetForm = () => {
    setFormData({
      id: "",
      nombre_banco: "",
      activa: true,
      medio_pago_asociado_id: "",
      tipo_cuenta: "",
      numero_cuenta: "",
      codigo_puc: "",
    });
  };
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-6">
          <button onClick={onClose}>
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-700">
            {cuenta ? "Editar" : "Crear"} Cuenta
          </h2>
          <div className="w-6" />
        </header>
        <form onSubmit={handleSubmit} className="space-y-4">
          <SimpleSelect
            label="Medios de Pago"
            options={mediosDePago}
            value={formData.medio_pago_asociado_id}
            onChange={(value: string) =>
              setFormData((prev) => ({
                ...prev,
                medio_pago_asociado_id: value,
              }))
            }
            error={errors.medio_pago_asociado_id}
          />
          <InputField
            label="Nombre del Banco"
            name="nombre_banco"
            value={formData.nombre_banco}
            onChange={handleChange}
            error={errors.nombre_banco}
          />

          <SimpleSelect
            label="Tipo de Cuenta"
            options={tiposDeCuentas}
            value={formData.tipo_cuenta}
            onChange={(value: string) =>
              setFormData((prev) => ({ ...prev, tipo_cuenta: value }))
            }
            error={errors.tipo_cuenta}
          />
          <InputField
            label="Numero de Cuenta"
            name="numero_cuenta"
            type="Number"
            value={formData.numero_cuenta}
            onChange={handleChange}
            error={errors.numero_cuenta}
          />
          {cuenta && (
            <InputField
              label="Codigo PUC"
              name="codigo_puc"
              readOnly={true}
              value={formData.codigo_puc || "No disponible"}
              onChange={handleChange}
            />
          )}
          <Checkbox
            label="activa"
            checked={formData.activa}
            onChange={(checked: boolean) =>
              setFormData((prev) => ({ ...prev, activa: checked }))
            }
          />
          <footer className="flex justify-end space-x-3 mt-6">
            <BotonRestaurante
              label="Cancelar"
              variacion="claro"
              onClick={handleCancel}
            />
            <BotonRestaurante
              type="submit"
              label={cuenta ? "Actualizar" : "Crear"}
            />
          </footer>
        </form>
      </div>
    </div>
  );
};

export default FormCuentas;
