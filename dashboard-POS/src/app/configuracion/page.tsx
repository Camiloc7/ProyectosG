"use client";
import {
  ConfirmProvider,
  useConfirm,
} from "@/components/feedback/confirmModal";
import Spinner from "@/components/feedback/Spinner";
import { InputFieldDos } from "@/components/Input2";
import Checkbox from "@/components/ui/CheckBox";
import { useAuthStore } from "@/stores/authStore";
import {
  useConfiguracionStore,
  IConfiguracionPedidos,
} from "@/stores/configuracionStore";
import { useImpresoraStore } from "@/stores/impresoraStore";
import { COLOR_TEXTO, ORANGE } from "@/styles/colors";
import {
  CircleDollarSign,
  Edit3,
  Pencil,
  Printer,
  Settings,
  Trash2,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
export type IFormMedioDePago = {
  es_efectivo: boolean;
  nombre: string;
};
export type IImpresora = {
  id: string;
  nombre: string;
  descripcion: string;
  tipo_impresion: string;
  tipo_conexion_tecnico:string;
  activa: boolean;
  establecimiento_id?: string;
};
type FormState = {
  limite_cancelacion_preparacion_minutos: number;
  limite_cancelacion_enviado_cocina_minutos: number;
  limite_edicion_pedido_minutos: number;
  maximoCuentas: string;
  mesas: string | number;
  electronica: boolean;
};
type ImpresoraFormState = {
  nombre: string;
  descripcion: string;
  tipo_impresion: string;
  activa: boolean;
};
type ImpresoraFormErrors = {
  nombre?: boolean;
  descripcion?: boolean;
  tipo_impresion?: boolean;
};
type FormErrors = {
  minutos?: boolean;
  mesas?: boolean;
  maximoCuentas?: boolean;
};
const BotonRestaurante = ({
  label,
  onClick,
  variant = "primary",
}: {
  label: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: "#6b7280",
          color: "white",
        };
      case "danger":
        return {
          backgroundColor: "#dc2626",
          color: "white",
        };
      default:
        return {
          backgroundColor: ORANGE,
          color: "white",
        };
    }
  };
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
      style={{ ...getButtonStyle(), boxShadow: "0 2px 6px rgba(0,0,0,0.25)" }}
    >
      {label}
    </button>
  );
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
    loading: loadingMedios,
  } = useConfiguracionStore();
  const {
    traerImpresoras,
    crearImpresora,
    impresoras,
    traerImpresorasDisponibles,
    impresorasDisponibles,
    eliminarImpresora,
    actualizarImpresora,
    loading,
  } = useImpresoraStore();
  const { user } = useAuthStore();
  const [form, setForm] = useState<FormState>({
    limite_cancelacion_preparacion_minutos: 0,
    limite_cancelacion_enviado_cocina_minutos: 0,
    limite_edicion_pedido_minutos: 0,
    mesas: "",
    maximoCuentas: "",
    electronica: false,
  });
  const confirm = useConfirm();
  const [esEfectivo, setEsEfectivo] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [nuevoMedio, setNuevoMedio] = useState<string>("");
  const [impresoraForm, setImpresoraForm] = useState<ImpresoraFormState>({
    nombre: "",
    descripcion: "",
    tipo_impresion: "",
    activa: true,
  });
  const [impresoraErrors, setImpresoraErrors] = useState<ImpresoraFormErrors>(
    {}
  );
  const [editandoImpresora, setEditandoImpresora] = useState<string | null>(
    null
  );
  useEffect(() => {
    traerMediosDePago();
    traerImpresoras();
    traerImpresorasDisponibles();
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
        limite_cancelacion_preparacion_minutos:
          configuracionPedidos.limite_cancelacion_preparacion_minutos,
        limite_cancelacion_enviado_cocina_minutos:
          configuracionPedidos.limite_cancelacion_enviado_cocina_minutos,
        limite_edicion_pedido_minutos:
          configuracionPedidos.limite_edicion_pedido_minutos,
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
    if (form.limite_cancelacion_preparacion_minutos < 0)
      newErrors.minutos = true;
    if (form.limite_cancelacion_enviado_cocina_minutos < 0)
      newErrors.minutos = true;
    if (form.limite_edicion_pedido_minutos < 0) newErrors.minutos = true;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const toggleImpresoraActiva = (impresora: IImpresora, newState: boolean) => {
    const paraEditar = {
      nombre: impresora.nombre,
      descripcion: impresora.descripcion, 
      tipo_impresion: impresora.tipo_impresion,
      activa: newState,
      establecimiento_id: user?.establecimiento_id,
    };
    actualizarImpresora(paraEditar, impresora.id);
  };
  const handleSubmit = async () => {
    if (validateForm()) {
      const dataToUpdate: IConfiguracionPedidos = {
        limite_cancelacion_preparacion_minutos:
          form.limite_cancelacion_preparacion_minutos,
        limite_cancelacion_enviado_cocina_minutos:
          form.limite_cancelacion_enviado_cocina_minutos,
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

  const cancelarEdicion = () => {
    setImpresoraForm({
      nombre: "",
      descripcion: "",
      tipo_impresion: "",
      activa: true,
    });
    setEditandoImpresora(null);
    setImpresoraErrors({});
  };
  const eliminarMedio = (id: string | undefined) => {
    if (!id) {
      console.error("No hay id al eliminar");
      return;
    }
    eliminarMedioDePago(id);
  };
  const validateImpresoraForm = () => {
    const newErrors: ImpresoraFormErrors = {};
    if (!impresoraForm.nombre.trim()) newErrors.nombre = true;
    if (!impresoraForm.descripcion.trim()) newErrors.descripcion = true;
    if (!impresoraForm.tipo_impresion) newErrors.tipo_impresion = true;
    setImpresoraErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
const handleEliminarImpresora = async (id: string) => {
    const impresoraAEliminar = impresoras.find(i => i.id === id);
    if (impresoraAEliminar) {
        const nombreTecnico = impresoraAEliminar.descripcion; 
        eliminarImpresora(id, nombreTecnico); 
    } else {
        toast.error("Impresora no encontrada localmente.");
    }
};

  const onImpresoraFormUpdate = (
    field: keyof ImpresoraFormState,
    value: any
  ) => {
    setImpresoraForm((prev) => ({ ...prev, [field]: value }));
    setImpresoraErrors((prev) => ({ ...prev, [field]: false }));
  };

  const editarImpresora = (impresora: IImpresora) => {
    setImpresoraForm({
      descripcion: impresora.descripcion, 
      nombre: impresora.nombre, 
      tipo_impresion: impresora.tipo_impresion,
      activa: impresora.activa,
    });
    setEditandoImpresora(impresora.id);
  };
const agregarOEditarImpresora = () => {
    if (!validateImpresoraForm()) {
        console.error("Hay errores en el formulario de impresora");
        return;
    }
    const configPlugin = impresorasDisponibles.find(
        (i) => i.ruta === impresoraForm.nombre.trim()
    );

    if (!configPlugin) {
        toast.error("No se encontró el driver seleccionado en la lista de disponibles.");
        return;
    }
    const nuevaImpresora: IImpresora = {
        id: editandoImpresora || "",
        nombre: impresoraForm.descripcion.trim(),     
        descripcion: impresoraForm.nombre.trim(),    
        tipo_impresion: impresoraForm.tipo_impresion, 
        tipo_conexion_tecnico: "WINDOWS",
        activa: impresoraForm.activa,
        establecimiento_id: user?.establecimiento_id,
    };
    
    const { id, ...ImpresoraSinId } = nuevaImpresora; 

    if (editandoImpresora) {
        actualizarImpresora(ImpresoraSinId, id);
    } else {
        crearImpresora(ImpresoraSinId, configPlugin); 
    }
    cancelarEdicion(); 
};
  return (
    <div className="p-6 bg-gray-50 min-h-screen font-sans">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1
          className="text-3xl font-bold mb-4 sm:mb-0"
          style={{ color: ORANGE }}
        >
          Configuración
        </h1>
      </header>
      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex gap-4 align-center">
              <Settings className="text-orange-500" />
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2  text-gray-700">
                Configuración de Pedidos
              </h2>
            </div>
            <InputFieldDos
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
            <InputFieldDos
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
            <InputFieldDos
              label="Límite de edición pedido en minutos"
              type="number"
              value={form.limite_edicion_pedido_minutos}
              onChange={(e) =>
                onUpdate({
                  limite_edicion_pedido_minutos: Number(e.target.value),
                })
              }
            />
            <div className="mb-auto mt-28">
              <BotonRestaurante
                label="Guardar Configuración"
                onClick={handleSubmit}
              />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm max-h-[45vh] overflow-y-auto">
            <div className="flex gap-4 align-center">
              <CircleDollarSign className="text-orange-500" />
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-700">
                Medios de Pago
              </h2>
            </div>
            <div className="flex gap-2 mb-4 items-center">
              <input
                type="text"
                placeholder="Nuevo medio de pago"
                value={nuevoMedio}
                onChange={(e) => setNuevoMedio(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <BotonRestaurante label="Agregar" onClick={agregarMedio} />
            </div>
            <ul className="space-y-2">
              {mediosDePago.map((medio) => (
                <li
                  key={medio.id}
                  className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg"
                >
                  <div style={{ color: COLOR_TEXTO }}>
                    <span className="font-medium">{medio.nombre}</span>
                    {medio.es_efectivo && (
                      <span className="ml-2 text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full">
                        Efectivo
                      </span>
                    )}
                  </div>
                  {!medio.es_efectivo && (
                    <button
                      onClick={() => eliminarMedio(medio.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar medio de pago"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2  text-gray-700">
            <Printer className="text-orange-500" size={24} />
            Configuración de Impresoras
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6  text-gray-500">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">
                {editandoImpresora
                  ? "Editar Impresora"
                  : "Agregar Nueva Impresora"}
              </h3>
            <div className="mb-4">
                <BotonRestaurante
                  label={loading ? <Spinner /> : "Buscar Impresoras Disponibles"}
                  onClick={() => traerImpresorasDisponibles()}
                  variant="secondary"
                />
                <p className="text-xs text-gray-500 mt-1">
                  (La lista debe aparecer en el selector 'Driver' de abajo.)
                </p>
              </div>

              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <InputFieldDos
                  label="Nombre Amigable (Ej: Caja Tiquetes)" 
                  value={impresoraForm.descripcion} 
                  onChange={(e) =>
                    onImpresoraFormUpdate("descripcion", e.target.value)
                  }
                  error={impresoraErrors.descripcion}
                  placeholder="Ej: Tiquete de Caja Principal"
                />

                <div className="flex flex-col mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="impresora-nombre">
                    Driver (Nombre Técnico)
                  </label>
                  <div className="relative">
                   <select
  id="impresora-nombre"
  value={impresoraForm.nombre}
  onChange={(e) => onImpresoraFormUpdate("nombre", e.target.value)}
  disabled={impresorasDisponibles.length === 0}
  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none transition-all ${impresoraErrors.nombre
      ? "border-red-500 ring-red-200 ring-2"
      : "border-gray-300 focus:ring-2 focus:ring-orange-500"
    } ${impresoraForm.nombre === "" ? 'text-gray-400' : 'text-gray-700'}`}
>
  <option value="" disabled>
    {loading
      ? "Cargando..."
      : impresorasDisponibles.length === 0
        ? "Presione 'Buscar Impresoras' primero"
        : "Seleccione un driver..."
    }
  </option>
  {impresorasDisponibles.map((driver) => (
    <option 
      key={driver.ruta} 
      value={driver.ruta} 
      title={`Tipo: ${driver.tipo}`}
    >
      {driver.nombre} ({driver.tipo})
    </option>
  ))}
</select>

                  </div>
                  {impresoraErrors.nombre && (
                    <p className="text-xs text-red-500 mt-1">
                      Debe seleccionar un driver.
                    </p>
                  )}
                </div>
                <div className="flex flex-col mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="tipo-impresion">
                    Tipo de Impresión (Rol)
                  </label>
                  <select
                    id="tipo-impresion"
                    value={impresoraForm.tipo_impresion}
                    onChange={(e) => onImpresoraFormUpdate("tipo_impresion", e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 ${impresoraErrors.tipo_impresion
                        ? "border-red-500 ring-red-200"
                        : "border-gray-300 focus:ring-orange-500"
                      } ${impresoraForm.tipo_impresion === "" ? 'text-gray-400' : 'text-gray-700'}`}
                  >
                    <option value="" disabled>Seleccione el rol...</option>
                    <option value="COCINA">COCINA (Comandas)</option>
                    <option value="CAJA">CAJA (Tiquetes/Facturas)</option>
                  </select>
                  {impresoraErrors.tipo_impresion && (
                    <p className="text-xs text-red-500 mt-1">
                      Debe seleccionar el tipo de impresión.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 mt-6 pt-4 border-t border-gray-100">
                <BotonRestaurante
                  label={editandoImpresora ? "Guardar Cambios" : "Agregar Impresora"}
                  onClick={agregarOEditarImpresora}
                />
                {editandoImpresora && (
                  <BotonRestaurante
                    label="Cancelar Edición"
                    onClick={cancelarEdicion}
                    variant="secondary"
                  />
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-4">
                Impresoras Configuradas
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {impresoras.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No hay impresoras configuradas
                  </p>
                ) : (
                  impresoras.map((impresora) => {
                    const isEditing = editandoImpresora === impresora.id;

                    return (
                      <div
                        key={impresora.id}
                        className={`
                          relative p-4 rounded-lg transition-all duration-200
                          ${impresora.activa
                            ? "border-2 border-green-200 bg-green-50"
                            : "border-2 border-gray-200 bg-gray-50"
                          }
                          ${isEditing
                            ? "border-blue-400 bg-blue-50 shadow-lg "
                            : "hover:shadow-md"
                          }
                        `}
                      >                        {isEditing && (
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1 animate-pulse">
                          <Pencil size={12} />
                          Editando
                        </div>
                      )}

                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4
                              className={`font-semibold flex items-center gap-2 ${isEditing ? "text-blue-800" : "text-gray-800"
                                }`}
                            >
                              {impresora.nombre}
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${impresora.activa
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                                  }`}
                              >
                                {impresora.activa ? "Activa" : "Inactiva"}
                              </span>
                            </h4>
                            <div
                              className={`text-sm mt-1 space-y-1 text-gray-600`}
                            >
                              <p>
                                <strong>Tipo:</strong>
                                <span
                                  className={`ml-1 px-2 py-0.5 text-xs rounded-full font-medium ${isEditing
                                    ? "bg-blue-200 text-blue-800"
                                    : "bg-blue-100 text-blue-800"
                                    }`}
                                >
                                  {impresora.tipo_impresion}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 ml-4">
                            <Checkbox
                              checked={impresora.activa}
                              onChange={(e) =>
                                toggleImpresoraActiva(impresora, e)
                              }
                            />
                            <button
                              onClick={() => editarImpresora(impresora)}
                              className={`p-2 rounded-lg transition-colors ${isEditing
                                ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                                : "text-blue-600 hover:bg-blue-50"
                                }`}
                              title="Editar impresora"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() =>
                                handleEliminarImpresora(impresora.id)
                              }
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar impresora"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        {isEditing && (
                          <div className="mt-3 pt-3 border-t border-blue-200">
                            <div className="text-xs text-blue-600 font-medium mb-1">
                              Modificando configuración...
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-1">
                              <div className="bg-blue-500 h-1 rounded-full w-full animate-pulse"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
        {loading || (loadingMedios && <Spinner />)}
      </div>
    </div>
  );
}