"use client";
import BotonRestaurante from "@/components/ui/Boton";
import InputField from "@/components/ui/InputField";
import { useAuthStore } from "@/stores/authStore";
import { useConfiguracionStore, IConfiguracionPedidos } from "@/stores/configuracionStore";
import { useRolesStore } from "@/stores/rolesStore";
import { COLOR_TEXTO, ORANGE } from "@/styles/colors";
import { Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";

export type IFormMedioDePago = {
  es_efectivo: boolean;
  nombre: string;
};

type FormState = {
  limite_cancelacion_preparacion_minutos: number;
  limite_cancelacion_enviado_cocina_minutos: number;
  limite_edicion_pedido_minutos: number;
  maximoCuentas: string;
  mesas: string | number;
  electronica: boolean;
};

type FormErrors = {
  minutos?: boolean;
  mesas?: boolean;
  maximoCuentas?: boolean;
};

export default function Configuracion() {
  const {
    mediosDePago,
    crearMedioDePago,
    eliminarMedioDePago,
    traerMediosDePago,
    traerConfiguracionEstablecimiento,
    crearOActualizarConfiguracionPedidos, 
    configuracionPedidos, 
  } = useConfiguracionStore();
  
  const { user } = useAuthStore();
  const [form, setForm] = useState<FormState>({
    limite_cancelacion_preparacion_minutos: 0,
    limite_cancelacion_enviado_cocina_minutos: 0,
    limite_edicion_pedido_minutos: 0,
    mesas: "",
    maximoCuentas: "",
    electronica: false,
  });

  const [esEfectivo, setEsEfectivo] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [nuevoMedio, setNuevoMedio] = useState<string>("");

  useEffect(() => {
    traerMediosDePago();
  }, []);
  useEffect(() => {
    if (user?.establecimiento_id) {
      traerConfiguracionEstablecimiento();
    }
  }, [user]);

  useEffect(() => {
    if (configuracionPedidos) {
      setForm((prev) => ({
        ...prev,
        limite_cancelacion_preparacion_minutos: configuracionPedidos.limite_cancelacion_preparacion_minutos,
        limite_cancelacion_enviado_cocina_minutos: configuracionPedidos.limite_cancelacion_enviado_cocina_minutos,
        limite_edicion_pedido_minutos: configuracionPedidos.limite_edicion_pedido_minutos,
      }));
    }
  }, [configuracionPedidos]);

  const onUpdate = (updatedFields: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updatedFields }));
    const cleanedErrors: Partial<FormErrors> = {};
    Object.keys(updatedFields).forEach((key) => {
      cleanedErrors[key as keyof FormErrors] = false;
    });
    setErrors((prev) => ({ ...prev, ...cleanedErrors }));
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (form.limite_cancelacion_preparacion_minutos < 0) newErrors.minutos = true;
    if (form.limite_cancelacion_enviado_cocina_minutos < 0) newErrors.minutos = true;
    if (form.limite_edicion_pedido_minutos < 0) newErrors.minutos = true;    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      const dataToUpdate: IConfiguracionPedidos = {
        limite_cancelacion_preparacion_minutos: form.limite_cancelacion_preparacion_minutos,
        limite_cancelacion_enviado_cocina_minutos: form.limite_cancelacion_enviado_cocina_minutos,
        limite_edicion_pedido_minutos: form.limite_edicion_pedido_minutos,
      };
      
      await crearOActualizarConfiguracionPedidos(dataToUpdate);
    } else {
      toast.error("Hay errores en el formulario");
    }
  };

  const agregarMedio = () => {
    const trimmed = nuevoMedio.trim();
    if (!trimmed) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    const yaExiste = mediosDePago.some(
      (medio) => medio.nombre.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (yaExiste) {
      toast.error("Ya existe ese medio de pago");
      return;
    }
    const data = {
      nombre: trimmed,
      es_efectivo: esEfectivo,
    };
    crearMedioDePago(data);
    setNuevoMedio(""); 
    setEsEfectivo(false); 
  };

  const eliminarMedio = (id: string) => {
    eliminarMedioDePago(id);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1
          className="text-3xl font-bold mb-4 sm:mb-0"
          style={{ color: ORANGE }}
        >
          Configuración
        </h1>
      </header>

      <div className="w-full">
        <div className="flex gap-4">
          <div className="flex flex-col w-[50%]">
            <InputField
              label="Límite de cancelación preparación en minutos"
              type="number"
              value={form.limite_cancelacion_preparacion_minutos}
              onChange={(e) =>
                onUpdate({
                  limite_cancelacion_preparacion_minutos: Number(
                    e.target.value
                  ),
                })
              }
            />
            <InputField
              label="Límite de cancelación ya enviado a cocina en minutos"
              type="number"
              value={form.limite_cancelacion_enviado_cocina_minutos}
              onChange={(e) =>
                onUpdate({
                  limite_cancelacion_enviado_cocina_minutos: Number(
                    e.target.value
                  ),
                })
              }
            />
            <InputField
              label="Límite de edición pedido en minutos"
              type="number"
              value={form.limite_edicion_pedido_minutos}
              onChange={(e) =>
                onUpdate({
                  limite_edicion_pedido_minutos: Number(e.target.value),
                })
              }
            />
            <InputField
              label="Máximo que puede un cliente dividir la cuenta (No se recomienda más de 200)"
              name="maximoCuentas"
              type="number"
              value={form.maximoCuentas}
              onChange={(e) => onUpdate({ maximoCuentas: e.target.value })}
              error={errors.maximoCuentas}
            />
          </div>
          <div className="bg-white p-4 rounded-xl w-[50%] shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Medios de Pago</h2>
            <div className="flex gap-2 mb-3 items-center">
              <input
                type="text"
                placeholder="Nuevo medio de pago"
                value={nuevoMedio}
                onChange={(e) => setNuevoMedio(e.target.value)}
                className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-700 focus:outline-none"
              />
              <label className="flex items-center gap-1">
                <input
                  type="checkbox"
                  checked={esEfectivo}
                  onChange={(e) => setEsEfectivo(e.target.checked)}
                />
                ¿Es efectivo?
              </label>
              <BotonRestaurante label="Agregar" onClick={agregarMedio} />
            </div>
            <ul className="space-y-2">
              {mediosDePago.map((medio) => (
                <li
                  key={medio.id}
className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded-lg"
        >
          <div style={{ color: COLOR_TEXTO }}> 
            <span>{medio.nombre}</span>
            {medio.es_efectivo && (
              <span className="ml-2 text-xs text-green-600 font-semibold">
                (Efectivo)
              </span>
            )}
          </div>
                  <button
                    onClick={() => eliminarMedio(medio.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{
                      backgroundColor: ORANGE,
                      boxShadow: "0 2px 6px rgba(245, 101, 101, 0.25)",
                    }}
                    title="Eliminar medio de pago"
                  >
                    <Trash2 size={16} className="opacity-90" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex gap-4 left-auto pt-4">
          <BotonRestaurante label="Guardar" onClick={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
