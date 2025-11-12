"use client";
import BotonRestaurante from "@/components/ui/Boton";
import InputField from "../../components/ui/InputField";
import { ArrowLeft } from "lucide-react";
import React, { useState, useEffect } from "react";
import Checkbox from "@/components/ui/CheckBox";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";
import { useDineroExtraStore } from "@/stores/gastosIngresosExtraStore";
import { useCajaStore } from "@/stores/cierreDeCajaStore";

export type FormExtraMoney = {
  cantidad: string;
  razon: string;
  tipo: "Ingresos" | "Egresos" | "";
};

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Errors {
  cantidad: boolean;
  razon: boolean;
}

const FormExtraMoney: React.FC<ModalFormProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { cajaActiva } = useCajaStore();
  const { ingresoExtra, gastoExtra } = useDineroExtraStore();
  const [formData, setFormData] = useState<FormExtraMoney>({
    cantidad: "",
    razon: "",
    tipo: "Ingresos",
  });

  const [errors, setErrors] = useState<Errors>({
    cantidad: false,
    razon: false,
  });

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Errors = {
      cantidad: formData.cantidad === "",
      razon: formData.razon === "",
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      toast.error("Por favor completa todos los campos.");
      return;
    }

    if (!formData.tipo) {
      toast.error("Selecciona Ingresos o Egresos.");
      return;
    }

    const formattedData = {
      monto: Number(formData.cantidad),
      descripcion: formData.razon,
      cierre_caja_id: cajaActiva?.id || "",
    };
    if (formData.tipo === "Ingresos") {
      const response = await ingresoExtra(formattedData);
      if (!response) return;
    } else {
      const response = await gastoExtra(formattedData);
      if (!response) return;
    }

    handleVolverAtras();
  };

  const handleVolverAtras = () => {
    setFormData({
      cantidad: "",
      razon: "",
      tipo: "Ingresos",
    });
    setErrors({
      cantidad: false,
      razon: false,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backdropFilter: "blur(8px)",
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 201,
      }}
      onClick={() => onClose()}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: 24,
          borderRadius: 20,
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: 480,
          maxHeight: "90vh",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <button onClick={handleVolverAtras}>
            <ArrowLeft size={24} color="#4B5563" />
          </button>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "#374151",
            }}
          >
            {user?.rol !== "ADMIN"
              ? "Ingresos Extra de caja"
              : "Ingresos / Egresos Extra de caja"}
          </h2>
          <div style={{ width: 24 }} />
        </header>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 24 }}>
            <InputField
              label="Cantidad"
              name="cantidad"
              placeholder="Ingrese la cantidad de dinero"
              type="number"
              value={formData.cantidad}
              onChange={(e) =>
                setFormData({ ...formData, cantidad: e.target.value })
              }
              error={errors.cantidad}
            />
            <InputField
              label="Razon"
              name="razon"
              placeholder="Ingrese la razon"
              value={formData.razon}
              onChange={(e) =>
                setFormData({ ...formData, razon: e.target.value })
              }
              error={errors.razon}
            />
            {user?.rol === "ADMIN" && (
              <div className="flex gap-4">
                <Checkbox
                  label="Ingresos"
                  onChange={() =>
                    setFormData({ ...formData, tipo: "Ingresos" })
                  }
                  checked={formData.tipo === "Ingresos"}
                />
                <Checkbox
                  label="Egresos"
                  onChange={() => setFormData({ ...formData, tipo: "Egresos" })}
                  checked={formData.tipo === "Egresos"}
                />
              </div>
            )}
          </div>

          <footer
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              marginTop: 24,
            }}
          >
            <BotonRestaurante
              label="Volver Atras"
              variacion="claro"
              onClick={handleVolverAtras}
            />
            <BotonRestaurante type="submit" label="Agregar al registro" />
          </footer>
        </form>
      </div>
    </div>
  );
};

export default FormExtraMoney;
