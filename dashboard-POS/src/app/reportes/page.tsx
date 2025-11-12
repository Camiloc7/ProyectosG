// src/views/ReporteVentasView.tsx
"use client";

import { useEmpleadosStore } from "@/stores/empleadosStore";
import { useState, useEffect } from "react";
import Spinner from "@/components/feedback/Spinner";
import InputField from "@/components/ui/InputField";
import Boton from "@/components/ui/Boton";
import SimpleSelect from "@/components/ui/SimpleSelect";
import {
  StatCard,
  ReportHeader,
  BarChartCard,
  PieChartCard,
  TableWithPagination,
  LineChartCard, // <-- ¡Importamos el nuevo componente!
} from "@/components/reports/components";
import { useReportesDashboardStore } from "@/stores/reportesStore";
import { motion } from "framer-motion";
import { FONDO } from "@/styles/colors";

const ErrorMessage = ({ message }: { message: string }) => (
  <div className="p-6 bg-red-50 text-red-700 rounded-xl shadow text-center">
    <p className="font-semibold text-lg">Error al cargar los datos</p>
    <p className="text-sm mt-2">{message}</p>
    <p className="text-xs text-gray-500 mt-1">
      Por favor, inténtalo de nuevo más tarde.
    </p>
  </div>
);

const PERIOD_OPTIONS = [
  { value: "day", label: "Diario" },
  { value: "week", label: "Semanal" },
  { value: "month", label: "Mensual" },
  { value: "year", label: "Anual" },
];

const ReporteVentasView = () => {
  const {
    reporteVentas,
    reporteVentasComparacion,
    loading,
    error,
    generarReporteVentas,
  } = useReportesDashboardStore();
  const {
    empleados,
    loading: cajerosLoading,
    traerEmpleados,
  } = useEmpleadosStore();

  const todayString = new Date().toISOString().split("T")[0];

  const [fechaInicio, setFechaInicio] = useState(todayString);
  const [fechaFin, setFechaFin] = useState(todayString);
  const [periodo, setPeriodo] = useState("day");
  const [isComparison, setIsComparison] = useState(false);
  const [fechaInicioComparacion, setFechaInicioComparacion] = useState("");
  const [fechaFinComparacion, setFechaFinComparacion] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [cajeroId, setCajeroId] = useState("");

  // Carga inicial del reporte para el día de hoy
  useEffect(() => {
    traerEmpleados();
    generarReporteVentas(
      todayString,
      todayString,
      cajeroId,
      rowsPerPage,
      (currentPage - 1) * rowsPerPage
    );
  }, [traerEmpleados, generarReporteVentas]);

  const handlePeriodoChange = (newPeriodo: string) => {
    setPeriodo(newPeriodo);
    const today = new Date();
    let newStartDate = "";
    const todayString = new Date().toISOString().split("T")[0];

    switch (newPeriodo) {
      case "day":
        newStartDate = todayString;
        break;
      case "week":
        const firstDayOfWeek = new Date(
          today.setDate(today.getDate() - today.getDay())
        );
        newStartDate = firstDayOfWeek.toISOString().split("T")[0];
        break;
      case "month":
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        newStartDate = firstDayOfMonth.toISOString().split("T")[0];
        break;
      case "year":
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        newStartDate = firstDayOfYear.toISOString().split("T")[0];
        break;
      default:
        newStartDate = todayString;
    }
    setFechaInicio(newStartDate);
    setFechaFin(todayString);
  };

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const offset = (currentPage - 1) * rowsPerPage;
      generarReporteVentas(
        fechaInicio,
        fechaFin,
        cajeroId,
        rowsPerPage,
        offset
      );
    }
  }, [
    generarReporteVentas,
    fechaInicio,
    fechaFin,
    cajeroId,
    currentPage,
    rowsPerPage,
  ]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleRowsPerPageChange = (limit: number) => {
    setRowsPerPage(limit);
    setCurrentPage(1);
  };

  const cajerosOptions = [
    { value: "", label: "Todos los cajeros" },
    ...empleados.map((empleado) => ({
      value: empleado.id,
      label: `${empleado.nombre} ${empleado.apellido}`,
    })),
  ];

  const handleGenerateComparison = () => {
    if (fechaInicioComparacion && fechaFinComparacion) {
      generarReporteVentas(
        fechaInicioComparacion,
        fechaFinComparacion,
        cajeroId,
        undefined,
        undefined,
        true
      );
    }
  };

  if (loading.ventas || cajerosLoading) return <Spinner />;
  if (error.ventas) return <ErrorMessage message={error.ventas} />;

  const detalleFacturas = reporteVentas?.detalleFacturas.data || [];
  const totalDetalles = reporteVentas?.detalleFacturas.total || 0;

  return (
    <div
      className="min-h-screen p-6 sm:p-10 font-sans"
      style={{ background: FONDO }}
    >
      <ReportHeader title="Reporte de Ventas">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl shadow-inner">
          <SimpleSelect
            label="Periodo"
            value={periodo}
            options={PERIOD_OPTIONS}
            onChange={handlePeriodoChange}
          />
          <InputField
            label="Fecha de Inicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <InputField
            label="Fecha de Fin"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
          <SimpleSelect
            label="Filtrar por Cajero"
            value={cajeroId}
            options={cajerosOptions}
            onChange={setCajeroId}
          />
          <div className="flex items-end col-span-1 sm:col-span-2 lg:col-span-1">
            <Boton
              label="Actualizar Reporte"
              onClick={() => {
                setCurrentPage(1);
                const offset = (currentPage - 1) * rowsPerPage;
                generarReporteVentas(
                  fechaInicio,
                  fechaFin,
                  cajeroId,
                  rowsPerPage,
                  offset
                );
              }}
              className="w-full transition-all duration-200 ease-in-out hover:scale-105"
            />
          </div>
        </div>
      </ReportHeader>

      {reporteVentas ? (
        <>
          {/* Sección de Comparación */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8"
          >
            <h2 className="text-xl font-bold text-gray-700 mb-4">
              Análisis Comparativo
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl shadow-inner">
              <InputField
                label="Fecha de Inicio (Comparación)"
                type="date"
                value={fechaInicioComparacion}
                onChange={(e) => setFechaInicioComparacion(e.target.value)}
              />
              <InputField
                label="Fecha de Fin (Comparación)"
                type="date"
                value={fechaFinComparacion}
                onChange={(e) => setFechaFinComparacion(e.target.value)}
              />
              <div className="col-span-full">
                <Boton
                  label="Generar Comparación"
                  onClick={handleGenerateComparison}
                  className="w-full"
                />
              </div>
            </div>
          </motion.div>

          {reporteVentasComparacion && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
              <StatCard
                title="Total Ventas (Comp.)"
                value={`$${reporteVentasComparacion.resumenFinanciero.totalVentas.toLocaleString()}`}
                bg-blue-50
                border-blue-100
              />
              <StatCard
                title="Ventas Netas (Comp.)"
                value={`$${reporteVentasComparacion.resumenFinanciero.totalNeto.toLocaleString()}`}
                bg-green-50
                border-green-100
              />
              <StatCard
                title="Total Impuestos (Comp.)"
                value={`$${reporteVentasComparacion.resumenFinanciero.totalImpuestos.toLocaleString()}`}
                bg-yellow-50
                border-yellow-100
              />
              <StatCard
                title="Total Descuentos (Comp.)"
                value={`$${reporteVentasComparacion.resumenFinanciero.totalDescuentos.toLocaleString()}`}
                bg-red-50
                border-red-100
              />
            </div>
          )}

          <div className="border-t border-gray-200 my-6" />

          {/* Resumen financiero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <StatCard
              title="Total Ventas"
              value={`$${reporteVentas.resumenFinanciero.totalVentas.toLocaleString()}`}
              bg-blue-50
              border-blue-100
            />
            <StatCard
              title="Ventas Netas"
              value={`$${reporteVentas.resumenFinanciero.totalNeto.toLocaleString()}`}
              bg-green-50
              border-green-100
            />
            <StatCard
              title="Total Impuestos"
              value={`$${reporteVentas.resumenFinanciero.totalImpuestos.toLocaleString()}`}
              bg-yellow-50
              border-yellow-100
            />
            <StatCard
              title="Total Descuentos"
              value={`$${reporteVentas.resumenFinanciero.totalDescuentos.toLocaleString()}`}
              bg-red-50
              border-red-100
            />
          </motion.div>

          <div className="border-t border-gray-200 my-6" />

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Nuevo Gráfico de Líneas */}
            <LineChartCard
              title="Ventas Diarias"
              data={reporteVentas.ventasPorDia}
              dataKey="total"
              xLabel="fecha"
              yLabel="Total ($)"
            />
            <PieChartCard
              title="Ventas por Medio de Pago"
              data={reporteVentas.ventasPorMedioPago}
              nameKey="medio"
              valueKey="total"
            />
          </div>

          <div className="border-t border-gray-200 my-6" />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BarChartCard
              title="Ventas por Categoría"
              data={reporteVentas.ventasPorCategoria}
              dataKey="total"
              xLabel="categoria"
              yLabel="Total ($)"
            />
            <BarChartCard
              title="Top Productos Vendidos"
              data={reporteVentas.topProductosVendidos}
              dataKey="cantidad"
              xLabel="nombre"
              yLabel="Cantidad"
            />
          </div>

          <div className="border-t border-gray-200 my-6" />

          {/* Tabla */}
          <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Detalle de Facturas
            </h3>
            <TableWithPagination
              data={detalleFacturas}
              columns={[
                {
                  key: "id",
                  header: "ID Factura",
                  render: (item) => (
                    <span className="truncate">
                      {item.id.substring(0, 8)}...
                    </span>
                  ),
                },
                { key: "fecha_hora_factura", header: "Fecha y Hora" },
                {
                  key: "total_factura",
                  header: "Total ($)",
                  render: (item) => (
                    <span className="font-semibold text-green-600">
                      ${item.total_factura.toLocaleString()}
                    </span>
                  ),
                },
                { key: "usuarioCajero", header: "Cajero" },
              ]}
              totalItems={totalDetalles}
              itemsPerPage={rowsPerPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </div>
        </>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-xl shadow-inner border border-dashed border-gray-200 text-gray-400">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 17v2h6v-2m-6-4h6m2 6a2 2 0 002-2V7a2 2 0 00-2-2h-3.586a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 2H6a2 2 0 00-2 2v12a2 2 0 002 2h12z"
            />
          </svg>
          <p className="mt-2 text-lg font-medium">No hay datos para mostrar</p>
          <p className="text-sm text-gray-500">
            Selecciona un rango de fechas y actualiza el reporte.
          </p>
        </div>
      )}
    </div>
  );
};

export default ReporteVentasView;
