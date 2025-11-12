"use client";
import { useConfirm } from "@/components/feedback/confirmModal";
import Spinner from "@/components/feedback/Spinner";
import BotonRestaurante from "@/components/ui/Boton";
import Checkbox from "@/components/ui/CheckBox";
import SimpleSelect from "@/components/ui/SimpleSelect";
import FormEmpleadoRestaurante from "@/features/Empleados/FormEmpleado";
import { Empleado, useEmpleadosStore } from "@/stores/empleadosStore";
import { ORANGE } from "@/styles/colors";
import React, { useState, useMemo, useEffect } from "react";

export default function Empleados() {
  const confirm = useConfirm();
  const { actualizarEmpleado } = useEmpleadosStore(); // Asegúrate de que exista esta función en tu store

  const { traerEmpleados, empleados, loading } = useEmpleadosStore();
  const [search, setSearch] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [mostrarInactivos, setMostrarInactivos] = useState<boolean>(true);
  const [pagina, setPagina] = useState<number>(1);
  const [tipoFiltrado, setTipoFiltrado] = useState<string>("Activos");

  const EMPLEADOS_POR_PAGINA = 6;

  useEffect(() => {
    traerEmpleados();
  }, [traerEmpleados]);

  const empleadosFiltrados = useMemo(() => {
    if (!empleados) return [];

    return empleados.filter((emp) => {
      // Filtrado por tipo
      if (tipoFiltrado === "Activos" && !emp.activo) return false;
      if (tipoFiltrado === "Inactivos" && emp.activo) return false;

      // Filtrado por checkbox (si quieres mantenerlo además del select)
      if (!mostrarInactivos && !emp.activo) return false;

      // Filtrado por búsqueda
      const full = `${emp.nombre} ${emp.apellido}`.toLowerCase();
      return (
        full.includes(search.toLowerCase()) ||
        emp.username.toLowerCase().includes(search.toLowerCase()) ||
        emp.rol.nombre.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [empleados, search, mostrarInactivos, tipoFiltrado]);

  // Calcular paginación
  const totalPaginas = Math.ceil(
    empleadosFiltrados.length / EMPLEADOS_POR_PAGINA
  );
  const empleadosPaginados = empleadosFiltrados.slice(
    (pagina - 1) * EMPLEADOS_POR_PAGINA,
    pagina * EMPLEADOS_POR_PAGINA
  );

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedId("");
  };

  const handleChangeEstadoEmpleado = async (
    id: string,
    nuevoEstado: boolean
  ) => {
    try {
      // Buscar el empleado en la lista
      const empleado = empleados.find((emp) => emp.id === id);
      if (!empleado) return;

      // Construir payload para actualizar
      const payload = {
        id: empleado.id,
        nombre: empleado.nombre,
        apellido: empleado.apellido,
        username: empleado.username,
        activo: nuevoEstado,
        establecimiento_id: empleado.establecimiento.id, // solo el id
        rol_id: empleado.rol.id, // solo el id
      };

      // Confirmación opcional
      const confirmado = await confirm({
        title: `${nuevoEstado ? "Activar" : "Desactivar"} empleado`,
        description: `¿Seguro que deseas ${
          nuevoEstado ? "activar" : "desactivar"
        } a ${empleado.nombre} ${empleado.apellido}?`,
      });

      if (!confirmado) return;

      // Actualizar en el backend / store
      const exito = await actualizarEmpleado(payload);

      if (exito) {
        // Actualizar estado local para reflejar cambio inmediatamente
        traerEmpleados(); // refresca la lista
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4 md:mb-0">
          Gestión de Empleados
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
          <input
            type="text"
            placeholder="Buscar empleados..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPagina(1); // reiniciar página al buscar
            }}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />

          <SimpleSelect
            options={["Todos", "Activos", "Inactivos"]}
            value={tipoFiltrado}
            onChange={(v) => {
              setTipoFiltrado(v);
              setSearch("");
            }}
          />

          <BotonRestaurante
            label="Nuevo Empleado"
            onClick={() => setIsFormOpen(true)}
          />
        </div>
      </header>

      <div className="min-h-[700px]">
        {/* <div className="min-h-2/3"> */}
        {empleadosFiltrados.length === 0 ? (
          <p className="text-gray-500 text-center mt-12">
            No se encontraron empleados.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {empleadosPaginados.map((emp) => (
                <div
                  key={emp.id}
                  className={`bg-white rounded-lg shadow-md p-5 flex flex-col justify-between hover:shadow-xl transition-shadow cursor-pointer
    ${!emp.activo ? "opacity-50 border border-red-400" : ""}`}
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
                        style={{
                          backgroundColor: `${ORANGE}20`,
                          color: ORANGE,
                        }}
                      >
                        {emp.rol.nombre.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 text-gray-700">
                        Activo: {emp.activo ? "Sí" : "No"}
                      </span>
                    </div>

                    {/* Datos del establecimiento */}
                    <div className="mt-3 text-sm text-gray-700 space-y-1">
                      <p>
                        Establecimiento:{" "}
                        <span className="font-medium">
                          {emp.establecimiento.nombre}
                        </span>
                      </p>
                      <p>Dirección: {emp.establecimiento.direccion}</p>
                      <p>Teléfono: {emp.establecimiento.telefono}</p>
                      <p>
                        Impuesto: {emp.establecimiento.impuesto_porcentaje}%
                      </p>
                    </div>

                    <div className="mt-3 text-xs text-gray-500 space-y-0.5">
                      <p>Creado: {new Date(emp.created_at).toLocaleString()}</p>
                      <p>
                        Actualizado: {new Date(emp.updated_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex self-end mt-4 gap-2">
                    {emp.rol.nombre !== "ADMIN" && (
                      <Checkbox
                        // label={emp.activo ? "Desactivar" : "Activar"}
                        onChange={async (checked) => {
                          handleChangeEstadoEmpleado(emp.id, checked);
                        }}
                        checked={emp.activo}
                      />
                    )}
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
          </>
        )}
      </div>

      {/* Paginación siempre visible */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <BotonRestaurante
          label="Anterior"
          disabled={pagina === 1 || totalPaginas === 0}
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
        />
        <span className="text-sm text-gray-600">
          {totalPaginas > 0
            ? `Página ${pagina} de ${totalPaginas}`
            : "Página 0 de 0"}
        </span>
        <BotonRestaurante
          label="Siguiente"
          disabled={pagina === totalPaginas || totalPaginas === 0}
          onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
        />
      </div>

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
