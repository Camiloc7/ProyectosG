"use client";
import React, { useState, useEffect } from "react";
import { FONDO } from "@/styles/colors";
import { useCajaStore, CajaData } from "@/stores/cierreDeCajaStore";
import { useEmpleadosStore, Empleado } from "@/stores/empleadosStore";
import Spinner from "@/components/feedback/Spinner";
import BotonRestaurante from "@/components/ui/Boton";

export default function CierreDeCaja() {
  const {
    traerCierresDeCaja,
    cierresDeCaja,
    traerCajaActiva,
    cajaActiva,
    loading: loadingCajas,
  } = useCajaStore();
  // const {
  //   traerEmpleados,
  //   empleados,
  //   loading: loadingEmpleados,
  // } = useEmpleadosStore();

  const [search, setSearch] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  // Items expandidos
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    traerCajaActiva();
    traerCierresDeCaja();
    // traerEmpleados();
  }, [traerCajaActiva, traerCierresDeCaja]);

  const toggleDetalles = (id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const usuariosMap = new Map<string, Empleado>();
  const establecimientosMap = new Map<string, { nombre: string }>();
  // empleados.forEach((emp) => {
  //   usuariosMap.set(emp.id, emp);
  //   if (!establecimientosMap.has(emp.establecimiento.id)) {
  //     establecimientosMap.set(emp.establecimiento.id, {
  //       nombre: emp.establecimiento.nombre,
  //     });
  //   }
  // });

  const filteredCaja = cierresDeCaja.filter((item) => {
    const establecimiento =
      establecimientosMap.get(item.establecimiento_id)?.nombre || "";
    const usuario = usuariosMap.get(item.usuario_cajero_id);
    const nombreUsuario = usuario
      ? `${usuario.nombre} ${usuario.apellido}`
      : "";
    const fechaApertura = new Date(item.fecha_hora_apertura);

    const matchesSearch =
      establecimiento.toLowerCase().includes(search.toLowerCase()) ||
      nombreUsuario.toLowerCase().includes(search.toLowerCase());

    const matchesDateRange =
      (!fechaDesde || fechaApertura >= new Date(fechaDesde)) &&
      (!fechaHasta || fechaApertura <= new Date(fechaHasta));

    return matchesSearch && matchesDateRange;
  });

  const totalPages = Math.ceil(filteredCaja.length / itemsPerPage);
  const paginatedCaja = filteredCaja.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // const isLoading = loadingCajas || loadingEmpleados;
  const isLoading = loadingCajas;

  const totalSaldoFinal = filteredCaja.reduce(
    (sum, item) => sum + Number(item.saldo_final_contado || 0),
    0
  );
  const totalDiferencia = filteredCaja.reduce(
    (sum, item) => sum + Number(item.diferencia_caja || 0),
    0
  );

  // Helper para formatear números
  const formatNumber = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    const num = Number(value);
    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div
      className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato"
      style={{ backgroundColor: FONDO }}
    >
      <div className="flex flex-col md:flex-row items-center justify-between py-4 mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-4 md:mb-0">
          Estado de caja
        </h1>
        <div className="flex gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por establecimiento o cajero..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>
      </div>

      {isLoading && <Spinner />}

      {!isLoading && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Caja Activa</h2>
          {cajaActiva ? (
            <div className="border border-green-400 bg-green-50 rounded-lg p-6 shadow-md">
              <p className="text-sm text-green-700">
                Hay una caja activa en este momento.
              </p>
              <p className="mt-2 text-gray-800">
                <strong>Establecimiento:</strong>{" "}
                {establecimientosMap.get(cajaActiva.establecimiento_id)
                  ?.nombre || "Desconocido"}
              </p>
              <p className="text-gray-800">
                <strong>Cajero:</strong>{" "}
                {usuariosMap.get(cajaActiva.usuario_cajero_id)
                  ? `${usuariosMap.get(cajaActiva.usuario_cajero_id)?.nombre} ${
                      usuariosMap.get(cajaActiva.usuario_cajero_id)?.apellido
                    }`
                  : "Desconocido"}
              </p>
              <p className="text-gray-800">
                <strong>Saldo inicial:</strong> ${cajaActiva.saldo_inicial_caja}
              </p>
              <p className="text-gray-800">
                <strong>Fecha de apertura:</strong>{" "}
                {new Date(cajaActiva.fecha_hora_apertura).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="border border-gray-300 bg-gray-100 rounded-lg p-6 text-center text-gray-500">
              No hay una caja activa en este momento.
            </div>
          )}
        </div>
      )}

      {!isLoading && (
        <>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Cierres Anteriores
          </h2>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label htmlFor="fechaDesde" className="text-gray-700 text-sm">
                Desde:
              </label>
              <input
                type="date"
                id="fechaDesde"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="fechaHasta" className="text-gray-700 text-sm">
                Hasta:
              </label>
              <input
                type="date"
                id="fechaHasta"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
              />
            </div>
          </div>

          {filteredCaja.length === 0 ? (
            <div className="text-center text-gray-500">
              No se encontraron cierres de caja para los filtros seleccionados.
            </div>
          ) : (
            <>
              {/* Table for md+ screens */}
              <div className="hidden md:block overflow-x-auto shadow-md rounded-lg mb-6">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-200">
                    <tr>
                      <th className="py-3 px-6">Establecimiento</th>
                      <th className="py-3 px-6">Cajero</th>
                      <th className="py-3 px-6">Apertura</th>
                      <th className="py-3 px-6">Cierre</th>
                      <th className="py-3 px-6">Saldo Inicial</th>
                      <th className="py-3 px-6">Saldo Final</th>
                      <th className="py-3 px-6">Diferencia</th>
                      <th className="py-3 px-6">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCaja.map((item: CajaData) => {
                      const usuario = usuariosMap.get(item.usuario_cajero_id);
                      // const establecimiento = establecimientosMap.get(
                      //   item.establecimiento_id
                      // );
                      const fechaApertura = new Date(
                        item.fecha_hora_apertura
                      ).toLocaleString();
                      const fechaCierre = item.fecha_hora_cierre
                        ? new Date(item.fecha_hora_cierre).toLocaleString()
                        : "No cerrado";

                      const isExpanded = expandedItems.has(item.id);

                      return (
                        <tr
                          key={item.id}
                          className="bg-white border-b hover:bg-gray-50"
                        >
                          <td className="py-4 px-6 font-medium text-gray-900">
                            {item.establecimiento.nombre || "Desconocido"}
                          </td>
                          <td className="py-4 px-6">
                            {item.usuarioCajero.nombre}
                          </td>
                          <td className="py-4 px-6">{fechaApertura}</td>
                          <td className="py-4 px-6">{fechaCierre}</td>
                          <td className="py-4 px-6">
                            ${formatNumber(item.saldo_inicial_caja)}
                          </td>
                          <td className="py-4 px-6">
                            ${formatNumber(item.saldo_final_contado)}
                          </td>
                          <td className="py-4 px-6">
                            ${formatNumber(item.diferencia_caja)}
                          </td>
                          <td className="py-4 px-6">
                            <BotonRestaurante
                              label={isExpanded ? "Ocultar" : "Ver"}
                              onClick={() => toggleDetalles(item.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards for small screens */}
              <div className="md:hidden grid gap-4">
                {paginatedCaja.map((item: CajaData) => {
                  const usuario = usuariosMap.get(item.usuario_cajero_id);
                  const establecimiento = establecimientosMap.get(
                    item.establecimiento_id
                  );
                  const fechaApertura = new Date(
                    item.fecha_hora_apertura
                  ).toLocaleString();
                  const fechaCierre = item.fecha_hora_cierre
                    ? new Date(item.fecha_hora_cierre).toLocaleString()
                    : "No cerrado";

                  const isExpanded = expandedItems.has(item.id);

                  return (
                    <div
                      key={item.id}
                      className="bg-white shadow-md rounded-lg p-4"
                    >
                      <p className="font-semibold text-gray-900">
                        {establecimiento?.nombre || "Desconocido"}
                      </p>
                      <p>
                        <strong>Cajero:</strong>{" "}
                        {usuario
                          ? `${usuario.nombre} ${usuario.apellido}`
                          : "Desconocido"}
                      </p>
                      <p>
                        <strong>Apertura:</strong> {fechaApertura}
                      </p>
                      <p>
                        <strong>Cierre:</strong> {fechaCierre}
                      </p>
                      <p>
                        <strong>Saldo Final:</strong> $
                        {item.saldo_final_contado}
                      </p>
                      <p>
                        <strong>Diferencia:</strong> ${item.diferencia_caja}
                      </p>
                      <div className="mt-4 mb-4">
                        <BotonRestaurante
                          label={isExpanded ? "Ocultar" : "Ver Detalles"}
                          onClick={() => toggleDetalles(item.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Modales fuera de la tabla */}
              {paginatedCaja.map((item: CajaData) => {
                if (!expandedItems.has(item.id)) return null;

                const fechaApertura = new Date(
                  item.fecha_hora_apertura
                ).toLocaleString();
                const fechaCierre = item.fecha_hora_cierre
                  ? new Date(item.fecha_hora_cierre).toLocaleString()
                  : "No cerrado";

                return (
                  <div
                    className="fixed inset-0 backdrop-blur-md bg-white/40 dark:bg-black/40 flex items-center justify-center z-50"
                    onClick={() => toggleDetalles(item.id)}
                    key={item.id}
                  >
                    {/* Contenedor principal */}
                    <div
                      className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto p-8"
                      onClick={(e) => e.stopPropagation()} // evita que el clic se "suba" al overlay
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-base leading-relaxed">
                        {/* Información General */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-lg">
                            Información General
                          </h4>
                          <p>
                            <strong>Apertura:</strong> {fechaApertura}
                          </p>
                          <p>
                            <strong>Cierre:</strong> {fechaCierre}
                          </p>
                          <p>
                            <strong>Saldo inicial:</strong> $
                            {formatNumber(item.saldo_inicial_caja)}
                          </p>
                          <p>
                            <strong>Saldo final contado:</strong> $
                            {formatNumber(item.saldo_final_contado)}
                          </p>
                          <p>
                            <strong>Diferencia caja:</strong> $
                            {formatNumber(item.diferencia_caja)}
                          </p>
                          <p>
                            <strong>Gastos operacionales:</strong> $
                            {formatNumber(item.gastos_operacionales)}
                          </p>
                        </div>

                        {/* Ventas */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-lg">
                            Ventas
                          </h4>
                          <p>
                            <strong>Total bruto:</strong> $
                            {item.total_ventas_brutas}
                          </p>
                          <p>
                            <strong>Descuentos:</strong> $
                            {formatNumber(item.total_descuentos)}
                          </p>
                          <p>
                            <strong>Impuestos:</strong> $
                            {formatNumber(item.total_impuestos)}
                          </p>
                          <p>
                            <strong>Propina:</strong> $
                            {formatNumber(item.total_propina)}
                          </p>
                          <p>
                            <strong>Neto ventas:</strong> $
                            {formatNumber(item.total_neto_ventas)}
                          </p>
                        </div>

                        {/* Pagos */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-lg">
                            Pagos
                          </h4>
                          <p>
                            <strong>Efectivo:</strong> $
                            {formatNumber(item.total_pagos_efectivo)}
                          </p>
                          <p>
                            <strong>Tarjeta:</strong> $
                            {formatNumber(item.total_pagos_tarjeta)}
                          </p>
                          <p>
                            <strong>Otros:</strong> $
                            {formatNumber(item.total_pagos_otros)}
                          </p>
                          <p>
                            <strong>Total recaudado:</strong> $
                            {formatNumber(item.total_recaudado)}
                          </p>
                        </div>

                        {/* Denominaciones Apertura */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-lg">
                            Denominaciones Apertura
                          </h4>
                          {item.denominaciones_apertura &&
                            Object.entries(item.denominaciones_apertura).map(
                              ([denom, cantidad]) => (
                                <p key={denom}>
                                  ${formatNumber(denom)} x{" "}
                                  {formatNumber(cantidad)}
                                </p>
                              )
                            )}
                        </div>

                        {/* Denominaciones Cierre */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-lg">
                            Denominaciones Cierre
                          </h4>
                          {item.denominaciones_cierre &&
                            Object.entries(item.denominaciones_cierre).map(
                              ([denom, cantidad]) => (
                                <p key={denom}>
                                  ${formatNumber(denom)} x{" "}
                                  {formatNumber(cantidad)}
                                </p>
                              )
                            )}
                        </div>

                        {/* Observaciones */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 md:col-span-2 lg:col-span-3">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-lg">
                            Observaciones
                          </h4>
                          <p>{item.observaciones ?? "Ninguna"}</p>
                        </div>

                        {/* Metadatos */}
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700 md:col-span-2 lg:col-span-3">
                          <p>
                            <strong>Creado:</strong>{" "}
                            {new Date(item.created_at).toLocaleString()}
                          </p>
                          <p>
                            <strong>Última actualización:</strong>{" "}
                            {new Date(item.updated_at).toLocaleString()}
                          </p>
                        </div>
                        <BotonRestaurante
                          label="Cerrar"
                          onClick={() => toggleDetalles(item.id)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Paginación siempre visible */}
              <div className="flex justify-center items-center gap-4 mt-6">
                <BotonRestaurante
                  label="Anterior"
                  variacion={
                    currentPage === 1 || totalPages === 0 ? "claro" : "default"
                  }
                  disabled={currentPage === 1 || totalPages === 0}
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                />
                <span className="text-sm text-gray-600">
                  {totalPages > 0
                    ? `Página ${currentPage} de ${totalPages}`
                    : "Página 0 de 0"}
                </span>
                <BotonRestaurante
                  label="Siguiente"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  variacion={
                    currentPage === totalPages || totalPages === 0
                      ? "claro"
                      : "default"
                  }
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
