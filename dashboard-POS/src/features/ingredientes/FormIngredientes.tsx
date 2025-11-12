"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import InputField from "@/components/ui/InputField";
import toast from "react-hot-toast";
import BotonRestaurante from "@/components/ui/Boton";
import SimpleSelect from "@/components/ui/SimpleSelect";
import { useDatosExtraStore } from "@/stores/datosExtraStore";
import SelectConSearch from "@/components/ui/SelectConSearch";
import { useIngredientesStore } from "@/stores/ingredientesStore";
import Spinner from "@/components/feedback/Spinner";
import { GiConsoleController } from "react-icons/gi";

export type IIngredientesFormData = {
  id?: string;
  nombre: string;
  unidad_medida: string;
  volumen_por_unidad?: number;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number;
  observaciones: string;
};

interface ModalFormProps {
  isOpen: boolean;
  ingrediente?: IIngredientesFormData;
  onClose: () => void;
  // onSave: (data: IIngredientesFormData) => void | Promise<void>;
}

interface Errors {
  nombre: boolean;
  unidad_medida: boolean;
  stock_actual: boolean;
  stock_minimo: boolean;
  costo_unitario: boolean;
  volumen_por_unidad: boolean;
  observaciones: boolean;
}

const formatNumber = (value: any): number => {
  if (value === null || value === undefined || value === "") return 0; // opcional, placeholder

  const num = Number(value);
  if (isNaN(num)) return value; // si no es número, devuelvo tal cual

  if (Number.isInteger(num)) {
    return num;
  }
  return Number(num.toFixed(2));
};

const FormIngredientes: React.FC<ModalFormProps> = ({
  isOpen,
  ingrediente,
  onClose,
  // onSave,
}) => {
  const { fetchUnidadesDeMedida, unidadesDeMedida } = useDatosExtraStore();
  const { actualizarIngrediente, crearIngrediente, loading } =
    useIngredientesStore();
  const [formData, setFormData] = useState<IIngredientesFormData>({
    id: "",
    nombre: "",
    unidad_medida: "",
    stock_actual: 0,
    volumen_por_unidad: 0,
    stock_minimo: 0,
    costo_unitario: 0,
    observaciones: "",
  });
  const [errors, setErrors] = useState<Errors>({
    nombre: false,
    unidad_medida: false,
    stock_actual: false,
    stock_minimo: false,
    costo_unitario: false,
    volumen_por_unidad: false,
    observaciones: false,
  });

  useEffect(() => {
    fetchUnidadesDeMedida();
  }, []);

  useEffect(() => {
    if (ingrediente) {
      setFormData({
        id: ingrediente?.id,
        nombre: ingrediente?.nombre,
        unidad_medida: ingrediente?.unidad_medida,
        stock_actual: formatNumber(ingrediente?.stock_actual),
        stock_minimo: formatNumber(ingrediente?.stock_minimo),
        costo_unitario: formatNumber(ingrediente?.costo_unitario),
        observaciones: ingrediente?.observaciones,
        volumen_por_unidad: formatNumber(ingrediente?.volumen_por_unidad),
      });
    } else {
      setFormData({
        id: "",
        nombre: "",
        unidad_medida: "",
        stock_actual: 0,
        stock_minimo: 0,
        costo_unitario: 0,
        volumen_por_unidad: 0,
        observaciones: "",
      });
      resetErrors();
    }
    // 👇 importante: no toques formData si ingrediente === undefined
  }, [ingrediente]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación básica
    const newErrors: Errors = {
      unidad_medida: formData.unidad_medida === "",
      nombre: formData.nombre.trim() === "",
      stock_actual:
        isNaN(Number(formData.stock_actual)) ||
        Number(formData.stock_actual) < 0,
      stock_minimo: Number(formData.stock_minimo) <= 0,
      costo_unitario: Number(formData.costo_unitario) <= 0,
      observaciones: false,
      volumen_por_unidad:
        formData.unidad_medida === "unidad"
          ? Number(formData.volumen_por_unidad) <= 0
          : false,
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }
    const dataToSend: any = {
      id: formData.id,
      nombre: formData.nombre.trim(),
      unidad_medida: formData.unidad_medida,
      stock_actual: Number(formData.stock_actual),
      stock_minimo: Number(formData.stock_minimo),
      costo_unitario: Number(formData.costo_unitario),
      observaciones: formData.observaciones.trim(),
    };
    if (formData.unidad_medida === "unidades") {
      dataToSend.volumen_por_unidad = Number(formData.volumen_por_unidad);
    }

    let respuesta = null;
    if (ingrediente) {
      respuesta = await actualizarIngrediente(dataToSend);
    } else {
      respuesta = await crearIngrediente(dataToSend);
    }

    if (respuesta === false) return;
    handleCancel();
  };

  const handleCancel = () => {
    setFormData({
      id: "",
      nombre: "",
      unidad_medida: "",
      stock_actual: 0,
      stock_minimo: 0,
      costo_unitario: 0,
      volumen_por_unidad: 0,
      observaciones: "",
    });
    resetErrors();
    onClose();
  };

  const resetErrors = () => {
    setErrors({
      nombre: false,
      unidad_medida: false,
      stock_actual: false,
      stock_minimo: false,
      costo_unitario: false,
      volumen_por_unidad: false,
      observaciones: false,
    });
  };

  const handleSoftClose = () => {
    resetErrors();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all"
      onClick={handleSoftClose}
    >
      <div
        className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between mb-6">
          <button onClick={handleSoftClose}>
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h2 className="text-xl font-semibold text-gray-700">
            {ingrediente ? "Editar" : "Crear"} Ingrediente
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

          <SelectConSearch
            label="Unidades de Medida"
            options={unidadesDeMedida}
            value={formData.unidad_medida}
            onChange={(value: string) =>
              setFormData((prev) => ({ ...prev, unidad_medida: value }))
            }
            error={errors.unidad_medida}
            errorMessage="Debes seleccionar una unidad de medida"
          />

          {formData.unidad_medida === "unidades" && (
            <InputField
              label="Volumen por unidad"
              name="volumen_por_unidad"
              value={formData.volumen_por_unidad || "0"}
              type="Number"
              onChange={handleChange}
              error={errors.volumen_por_unidad}
            />
          )}

          <InputField
            label="Stock Actual"
            name="stock_actual"
            value={formData.stock_actual}
            type="Number"
            onChange={handleChange}
            error={errors.stock_actual}
          />
          <InputField
            label="Stock Minimo"
            name="stock_minimo"
            type="Number"
            value={formData.stock_minimo}
            onChange={handleChange}
            error={errors.stock_minimo}
          />
          <InputField
            label="Costo Unitario"
            name="costo_unitario"
            type="Number"
            value={formData.costo_unitario}
            onChange={handleChange}
            error={errors.costo_unitario}
          />
          <InputField
            label="Observaciones"
            name="observaciones"
            value={formData.observaciones}
            onChange={handleChange}
            error={errors.observaciones}
          />
          <footer className="flex justify-end space-x-3 mt-6">
            <BotonRestaurante
              label="Cancelar"
              type="button"
              variacion="claro"
              onClick={handleCancel}
            />
            <BotonRestaurante
              type="submit"
              label={ingrediente ? "Actualizar" : "Crear"}
            />
          </footer>
        </form>
        {loading && <Spinner />}
      </div>
    </div>
  );
};

export default FormIngredientes;
