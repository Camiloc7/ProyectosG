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
  LineChartCard,
} from "@/components/reports/components";
import { useReportesDashboardStore } from "@/stores/reportesStore";
import { motion } from "framer-motion";
import { FONDO } from "@/styles/colors";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef } from "react";
import Checkbox from "@/components/ui/CheckBox";

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

  const getNextDayString = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return date.toISOString().split("T")[0];
  };

  const todayString = new Date().toISOString().split("T")[0];
  const getAdjustedEndDate = (
    start: string,
    end: string,
    period: string 
  ): string => {
    if (start === end) {
      return getNextDayString(end);
    }
    return end;
  };

  const [periodo, setPeriodo] = useState("day");
  const [fechaInicio, setFechaInicio] = useState(todayString);
  const [fechaFin, setFechaFin] = useState(
    getAdjustedEndDate(todayString, todayString, periodo)
  );
  const [isComparison, setIsComparison] = useState(false);
  const [fechaInicioComparacion, setFechaInicioComparacion] = useState("");
  const [fechaFinComparacion, setFechaFinComparacion] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [cajeroId, setCajeroId] = useState("");
  const [diasSeleccionados, setDiasSeleccionados] = useState<Record<string, boolean>>({
    Lun: true,
    Mar: true,
    Mie: true,
    Jue: true,
    Vie: true,
    Sab: true,
    Dom: true,
  });
  const reporteRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reporteVentas) {
      console.log("[DEBUG] reporteVentas:", reporteVentas);
      console.log("[DEBUG] ventasPorDia:", reporteVentas.ventasPorDia);
      console.log("[DEBUG] ventasPorDiaHora:", reporteVentas.ventasPorDiaHora);
    }
  }, [reporteVentas]);
  useEffect(() => {
    traerEmpleados();
  }, [traerEmpleados]);
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
        const startOfWeek = new Date(today);
        const day = today.getDay();
        const diff = day === 0 ? 6 : day - 1;
        startOfWeek.setDate(today.getDate() - diff);
        newStartDate = startOfWeek.toISOString().split("T")[0];
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
    setFechaFin(fechaFin);
  };
  useEffect(() => {
    if (fechaInicio && fechaFin) {
      const offset = (currentPage - 1) * rowsPerPage;
      const adjustedFin = getAdjustedEndDate(fechaInicio, fechaFin, periodo);
      generarReporteVentas(
        fechaInicio,
        adjustedFin,
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
    periodo,
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

  const handleDownloadPDF = async () => {
    if (!reporteRef.current) return;

    const input = reporteRef.current;

    try {
      const canvas = await html2canvas(input, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll("*").forEach((el) => {
            const style = window.getComputedStyle(el);
            const target = el as HTMLElement;

            const fixColor = (value: string | null, fallback: string) => {
              if (!value) return fallback;
              if (
                value.includes("lab") ||
                value.includes("lch") ||
                value.includes("oklch")
              ) {
                return fallback;
              }
              return value;
            };

            target.style.color = fixColor(style.color, "rgb(0,0,0)");
            target.style.backgroundColor = fixColor(
              style.backgroundColor,
              "rgb(255,255,255)"
            );
            target.style.borderColor = fixColor(
              style.borderColor,
              "rgb(200,200,200)"
            );
          });
        },
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pageWidth;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = pdfHeight;
      let position = 0;

      // Dibujar primera página
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      // Dibujar páginas siguientes recortando con "y-offset"
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`reporte_ventas_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert(
        "Ocurrió un error al generar el PDF. Ver consola para más detalles."
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
            max={todayString}
          />
          <InputField
            label="Fecha de Fin"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            max={todayString}
            min={fechaInicio}
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
                const adjustedFin = getAdjustedEndDate(
                  fechaInicio,
                  fechaFin,
                  periodo
                );

                generarReporteVentas(
                  fechaInicio,
                  adjustedFin,
                  cajeroId,
                  rowsPerPage,
                  offset
                );
              }}
              className="w-full transition-all duration-200 ease-in-out hover:scale-105"
            />
          </div>
          <Boton
            label="Descargar Informe"
            onClick={handleDownloadPDF}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white transition-all duration-200 ease-in-out hover:scale-105"
          />
        </div>
      </ReportHeader>
      <div ref={reporteRef}>
        {reporteVentas ? (
          <>
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
                  max={todayString}
                />
                <InputField
                  label="Fecha de Fin (Comparación)"
                  type="date"
                  value={fechaFinComparacion}
                  onChange={(e) => setFechaFinComparacion(e.target.value)}
                  min={fechaInicioComparacion}
                  max={todayString}
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {(() => {
                const rawDaily = reporteVentas.ventasPorDia || [];

                // Mapear a la forma que espera el LineChartCard: { fecha, total }
                const mappedDaily = rawDaily.map((it: any) => ({
                  fecha: it.fecha ?? it.fechaReporte ?? it.label ?? it.date ?? String(it?.dia ?? ''),
                  total: Number(it.total ?? it.totalVentas ?? it.totalVenta ?? it.monto ?? 0),
                }));

                return (
                  <>
                        <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                      <h4 className="text-md font-semibold mb-2">Resumen rápido</h4>
                      <p className="text-sm text-gray-700">Selecciona o deselecciona días para enfocarte en horarios concretos.</p>
                      <p className="text-sm text-gray-500 mt-2">Los picos se calculan sumando las ventas por hora para los días seleccionados.</p>
                    </div>

                    
                    {/* {mappedDaily && mappedDaily.length > 0 ? (
                      <LineChartCard
                        title="Ventas Diarias"
                        data={mappedDaily}
                        dataKey="total"
                        xLabel="fecha"
                        yLabel="Total ($)"
                      />
                    ) : (
                      <div className="bg-white p-6 rounded-xl shadow border border-dashed border-gray-200 text-gray-500">
                        <p className="font-medium">No hay datos diarios disponibles para las fechas seleccionadas.</p>
                        <p className="text-sm mt-2">Revisa el rango de fechas o presiona 'Actualizar Reporte' para recargar los datos.</p>
                      </div>
                    )} */}

                    {/* DEBUG VISIBLE: primeros elementos de ventas diarios para inspección rápida
                    {rawDaily && rawDaily.length > 0 && (
                      <div className="bg-white p-4 rounded-xl shadow border border-gray-100 mt-4 text-sm text-gray-700">
                        <div className="font-medium mb-2">Datos diarios (primeros 5 registros)</div>
                        <pre className="text-xs max-h-48 overflow-auto">{JSON.stringify(rawDaily.slice(0,5), null, 2)}</pre>
                      </div>
                    )} */}
                  
                  </>
                );
              })()}
</div>
<div>
              {/* Ventas por Hora: adaptar al periodo seleccionado */}
              {(() => {
                const rawFromBackend = reporteVentas.ventasPorDiaHora || [];
                let raw = rawFromBackend;
                const needDeriveFromDetalle = !rawFromBackend || rawFromBackend.length === 0 || rawFromBackend.every((r: any) => r.horaDia == null && r.diaSemana == null);
                if (needDeriveFromDetalle) {
                  const detalle = reporteVentas.detalleFacturas?.data || [];
                  const derivedMap: Record<string, { diaSemana: number; horaDia: number; totalVentas: number }> = {};
                  detalle.forEach((inv: any) => {
                    const fechaHora = inv.fecha_hora_factura || inv.fechaHora || inv.fecha || null;
                    if (!fechaHora) return;
                    // Asegurar formato ISO aceptable: 'YYYY-MM-DD HH:MM:SS' -> 'YYYY-MM-DDTHH:MM:SS'
                    const fechaIso = String(fechaHora).includes('T') ? fechaHora : String(fechaHora).replace(' ', 'T');
                    const d = new Date(fechaIso);
                    if (isNaN(d.getTime())) return;
                    const diaSemana = d.getDay();
                    const horaDia = d.getHours();
                    const key = `${diaSemana}-${horaDia}`;
                    if (!derivedMap[key]) derivedMap[key] = { diaSemana, horaDia, totalVentas: 0 };
                    derivedMap[key].totalVentas += Number(inv.total_factura ?? inv.montoAplicado ?? inv.total ?? 0);
                  });
                  const derived: any[] = Object.keys(derivedMap).map((k) => {
                    const parts = k.split('-');
                    return { diaSemana: Number(parts[0]), horaDia: Number(parts[1]), totalVentas: derivedMap[k].totalVentas };
                  });
                  raw = derived;
                }

                const isSingleDay = periodo === 'day' || fechaInicio === fechaFin;

                // Helper: obtener map hora -> objeto
                const buildHoraMap = () => {
                  const mapa: Record<string, any> = {};
                  raw.forEach((v: any) => {
                    const hora = typeof v.horaDia === 'number' ? v.horaDia : Number(v.horaDia);
                    const horaLabel = `${String(hora).padStart(2, '0')}:00`;
                    if (!mapa[horaLabel]) mapa[horaLabel] = { hora: horaLabel };
                    // si tiene diaSemana, acumula bajo su etiqueta (usada para multi-serie)
                    const diaKey = (typeof v.diaSemana === 'number') ? String(v.diaSemana) : String(v.diaSemana);
                    mapa[horaLabel][diaKey] = (mapa[horaLabel][diaKey] || 0) + (v.totalVentas ?? v.total ?? 0);
                    // acumulado total
                    mapa[horaLabel].total = (mapa[horaLabel].total || 0) + (v.totalVentas ?? v.total ?? 0);
                  });
                  return mapa;
                };

                const horaMap = buildHoraMap();

                // Ordenar horas asc
                const dataByHour = Object.keys(horaMap)
                  .sort((a, b) => Number(a.split(':')[0]) - Number(b.split(':')[0]))
                  .map((k) => horaMap[k]);

                if (isSingleDay) {
                  // Mostrar serie única por hora (suma total)
                  const dataSingle = dataByHour.map((r) => ({ hora: r.hora, total: r.total || 0 }));
                  // hora pico total
                  let pico = { hora: '', total: -1 };
                  dataSingle.forEach((r) => { if (r.total > pico.total) pico = { hora: r.hora, total: r.total }; });

                  return (
                    <div className="mb-4 grid grid-cols-1 gap-4">
                      <LineChartCard
                        title={`Ventas por Hora (${periodo === 'day' ? 'día' : 'rango'})`}
                        data={dataSingle}
                        dataKey="total"
                        xLabel="hora"
                        yLabel="Total ($)"
                      />
                      <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                        <h5 className="text-sm font-medium">Hora pico</h5>
                        <div className="mt-2 text-sm text-gray-700">{pico.hora || '-'} ({pico.total >= 0 ? pico.total : 0})</div>
                      </div>
                    </div>
                  );
                }

                // Si no es single day, por defecto mostrar series por día de la semana si hay diaSemana en data
                const diasNombres: Record<string, string> = {
                  '0': 'Dom',
                  '1': 'Lun',
                  '2': 'Mar',
                  '3': 'Mie',
                  '4': 'Jue',
                  '5': 'Vie',
                  '6': 'Sab',
                };

                // Determinar dias presentes (por clave numérica en cada fila)
                const diasPresentes = new Set<string>();
                dataByHour.forEach((row) => {
                  Object.keys(row).forEach((k) => { if (k !== 'hora' && k !== 'total') diasPresentes.add(k); });
                });

                const series = Array.from(diasPresentes).map((d) => ({ dataKey: diasNombres[d] || `D${d}`, name: diasNombres[d] || `D${d}`, stroke: undefined, rawKey: d }));

                // Mapear dataByHour a formato con keys por nombre de día
                const dataWide = dataByHour.map((row) => {
                  const out: any = { hora: row.hora };
                  Array.from(diasPresentes).forEach((d) => {
                    const name = diasNombres[d] || `D${d}`;
                    out[name] = row[d] || 0;
                  });
                  return out;
                });

                // Filtrar series por diasSeleccionados (por nombre)
                const activeSeries = series.filter(s => diasSeleccionados[s.name]);

                // Calcular picos
                const horaPicoPorDia: Record<string, { hora: string; total: number }> = {};
                activeSeries.forEach(s => {
                  let pico = { hora: '', total: -1 };
                  dataWide.forEach((r) => { const val = r[s.name] || 0; if (val > pico.total) pico = { hora: r.hora, total: val }; });
                  horaPicoPorDia[s.name] = pico;
                });
                let horaPicoTotal = { hora: '', total: -1 };
                dataWide.forEach((r) => {
                  const suma = activeSeries.reduce((acc, s) => acc + (r[s.name] || 0), 0);
                  if (suma > horaPicoTotal.total) horaPicoTotal = { hora: r.hora, total: suma };
                });

                return (
                  <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <LineChartCard
                      title="Ventas por Hora (por día de la semana)"
                      data={dataWide}
                      series={activeSeries.map(s => ({ dataKey: s.name, name: s.name, stroke: s.stroke }))}
                      xLabel="hora"
                      yLabel="Total ($)"
                    />

                    <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                      <h4 className="text-md font-semibold mb-2">Filtrar días</h4>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(diasPresentes).map((d) => {
                          const name = diasNombres[d] || `D${d}`;
                          return (
                            <div key={d} className="flex items-center">
                              <Checkbox
                                label={name}
                                checked={!!diasSeleccionados[name]}
                                onChange={(checked: boolean) => setDiasSeleccionados(prev => ({ ...prev, [name]: checked }))}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="mt-4">
                        <h5 className="text-sm font-medium">Hora pico</h5>
                        <ul className="text-sm text-gray-700 mt-2">
                          {Object.keys(horaPicoPorDia).map((k) => (
                            <li key={k}>{k}: {horaPicoPorDia[k].hora || '-'} ({horaPicoPorDia[k].total ?? 0})</li>
                          ))}
                        </ul>
                        <div className="mt-3 text-sm font-medium">
                          Pico total: {horaPicoTotal.hora || '-'} ({horaPicoTotal.total >= 0 ? horaPicoTotal.total : 0})
                        </div>
                      </div>
                    </div>

              
                  </div>
                );
              })()}

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
            <p className="mt-2 text-lg font-medium">
              No hay datos para mostrar
            </p>
            <p className="text-sm text-gray-500">
              Selecciona un rango de fechas y actualiza el reporte.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReporteVentasView;
