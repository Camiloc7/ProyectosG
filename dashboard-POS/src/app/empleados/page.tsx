"use client";
import { useConfirm } from "@/components/feedback/confirmModal";
import Spinner from "@/components/feedback/Spinner";
import BotonRestaurante from "@/components/ui/Boton";
import FormEmpleadoRestaurante, {
  EmpleadoFormData,
} from "@/features/Empleados/FormEmpleado";
import { Empleado, useEmpleadosStore } from "@/stores/empleadosStore";
import { ORANGE } from "@/styles/colors";
import React, { useState, useMemo, useEffect } from "react";
import toast from "react-hot-toast";
export default function Empleados() {
  const confirm = useConfirm();

  const { traerEmpleados, empleados, eliminarEmpleados, loading } =
    useEmpleadosStore();
  const [search, setSearch] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>("");
  useEffect(() => {
    traerEmpleados();
  }, [traerEmpleados]);
  const empleadosFiltrados = useMemo(() => {
    if (!empleados) return [];
    return empleados.filter((emp) => {
      const full = `${emp.nombre} ${emp.apellido}`.toLowerCase();
      return (
        full.includes(search.toLowerCase()) ||
        emp.username.toLowerCase().includes(search.toLowerCase()) ||
        emp.rol.nombre.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [empleados, search]);
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedId("");
  };
  // const handleSaveEmpleado = async (data: EmpleadoFormData) => {
  //   const isEditing = Boolean(data.id);
  //   if (isEditing) {
  //     actualizarEmpleado(data);
  //   } else {
  //     crearEmpleado(data);
  //   }
  // };

  const handleEliminarEmpleado = async (id: string) => {
    const confirmado = await confirm({
      title: "¿Eliminar Empleado?",
      description: "Esta accion no se puede deshacer",
      confirmText: "Eliminar",
      cancelText: "Cancelar",
    });

    if (confirmado) {
      eliminarEmpleados(id);
    }
  };
  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4 md:mb-0">
          Gestión de Empleados
        </h1>
        <div className="flex gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar empleados..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm  text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <BotonRestaurante
            label="Nuevo Empleado"
            onClick={() => setIsFormOpen(true)}
          />
        </div>
      </header>
      {empleadosFiltrados.length === 0 ? (
        <p className="text-gray-500 text-center mt-12">
          No se encontraron empleados.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {empleadosFiltrados.map((emp) => (
            <div
              key={emp.id}
              className="bg-white rounded-lg shadow-md p-5 flex flex-col justify-between hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedId(emp.id);
                setIsFormOpen(true);
              }}
            >
              <div className="space-y-1">
                <p className="text-xl font-semibold text-gray-700">
                  {emp.nombre} {emp.apellido}
                </p>
                <p className="text-sm text-gray-600">@{emp.username}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span
                    className="px-2 py-1 text-xs font-medium rounded-full"
                    style={{ backgroundColor: `${ORANGE}20`, color: ORANGE }}
                  >
                    {emp.rol.nombre.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                    Activo: {emp.activo ? "Sí" : "No"}
                  </span>
                </div>

                <div className="mt-3 text-sm text-gray-700 space-y-1">
                  <p>
                    Establecimiento:{" "}
                    <span className="font-medium">
                      {emp.establecimiento.nombre}
                    </span>
                  </p>
                  <p>Dirección: {emp.establecimiento.direccion}</p>
                  <p>Teléfono: {emp.establecimiento.telefono}</p>
                  <p>Impuesto: {emp.establecimiento.impuesto_porcentaje}%</p>
                </div>

                <div className="mt-3 text-xs text-gray-500 space-y-0.5">
                  <p>Creado: {new Date(emp.created_at).toLocaleString()}</p>
                  <p>
                    Actualizado: {new Date(emp.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex self-end mt-4 gap-4">
                <BotonRestaurante
                  label="Editar"
                  variacion="claro"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(emp.id);
                    setIsFormOpen(true);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && <Spinner />}
      <FormEmpleadoRestaurante
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        empleado={
          selectedId
            ? empleados.find((emp) => emp.id === selectedId)
            : undefined
        }
      />
    </div>
  );
}
