// src/views/ReporteVentasView.tsx
"use client"

import { useEmpleadosStore } from '@/stores/empleadosStore';
import { useState, useEffect } from 'react';
import Spinner from '@/components/feedback/Spinner';
import InputField from '@/components/ui/InputField';
import Boton from '@/components/ui/Boton';
import SimpleSelect from '@/components/ui/SimpleSelect';
import {
    StatCard,
    ReportHeader,
    BarChartCard,
    PieChartCard,
    TableWithPagination,
    LineChartCard // <-- ¡Importamos el nuevo componente!
} from '@/components/reports/components';
import { useReportesDashboardStore } from '@/stores/reportesStore';
import { motion } from "framer-motion";
import { FONDO } from '@/styles/colors';

const ErrorMessage = ({ message }: { message: string }) => (
    <div className="p-6 bg-red-50 text-red-700 rounded-xl shadow text-center">
        <p className="font-semibold text-lg">Error al cargar los datos</p>
        <p className="text-sm mt-2">{message}</p>
        <p className="text-xs text-gray-500 mt-1">Por favor, inténtalo de nuevo más tarde.</p>
    </div>
);

const PERIOD_OPTIONS = [
    { value: 'day', label: 'Diario' },
    { value: 'week', label: 'Semanal' },
    { value: 'month', label: 'Mensual' },
    { value: 'year', label: 'Anual' },
];

const ReporteVentasView = () => {
    const { reporteVentas, reporteVentasComparacion, loading, error, generarReporteVentas } = useReportesDashboardStore();
    const { empleados, loading: cajerosLoading, traerEmpleados } = useEmpleadosStore();

    const todayString = new Date().toISOString().split('T')[0];

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
        generarReporteVentas(todayString, todayString, cajeroId, rowsPerPage, (currentPage - 1) * rowsPerPage);
    }, [traerEmpleados, generarReporteVentas]);

    const handlePeriodoChange = (newPeriodo: string) => {
        setPeriodo(newPeriodo);
        const today = new Date();
        let newStartDate = "";
        const todayString = new Date().toISOString().split('T')[0];

        switch (newPeriodo) {
            case 'day':
                newStartDate = todayString;
                break;
            case 'week':
                const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
                newStartDate = firstDayOfWeek.toISOString().split('T')[0];
                break;
            case 'month':
                const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                newStartDate = firstDayOfMonth.toISOString().split('T')[0];
                break;
            case 'year':
                const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
                newStartDate = firstDayOfYear.toISOString().split('T')[0];
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
            generarReporteVentas(fechaInicio, fechaFin, cajeroId, rowsPerPage, offset);
        }
    }, [generarReporteVentas, fechaInicio, fechaFin, cajeroId, currentPage, rowsPerPage]);

    const handlePageChange = (page: number) => setCurrentPage(page);
    const handleRowsPerPageChange = (limit: number) => {
        setRowsPerPage(limit);
        setCurrentPage(1);
    };

    const cajerosOptions = [
        { value: '', label: 'Todos los cajeros' },
        ...empleados.map(empleado => ({
            value: empleado.id,
            label: `${empleado.nombre} ${empleado.apellido}`
        }))
    ];

    const handleGenerateComparison = () => {
        if (fechaInicioComparacion && fechaFinComparacion) {
            generarReporteVentas(fechaInicioComparacion, fechaFinComparacion, cajeroId, undefined, undefined, true);
        }
    };

    if (loading.ventas || cajerosLoading) return <Spinner />;
    if (error.ventas) return <ErrorMessage message={error.ventas} />;

    const detalleFacturas = reporteVentas?.detalleFacturas.data || [];
    const totalDetalles = reporteVentas?.detalleFacturas.total || 0;

    return (
        <div className="min-h-screen p-6 sm:p-10 font-sans" style={{ background: FONDO }}>
            <ReportHeader title="Reporte de Ventas">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl shadow-inner">
                    <SimpleSelect label="Periodo" value={periodo} options={PERIOD_OPTIONS} onChange={handlePeriodoChange} />
                    <InputField label="Fecha de Inicio" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                    <InputField label="Fecha de Fin" type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                    <SimpleSelect label="Filtrar por Cajero" value={cajeroId} options={cajerosOptions} onChange={setCajeroId} />
                    <div className="flex items-end col-span-1 sm:col-span-2 lg:col-span-1">
                        <Boton
                            label="Actualizar Reporte"
                            onClick={() => {
                                setCurrentPage(1);
                                const offset = (currentPage - 1) * rowsPerPage;
                                generarReporteVentas(fechaInicio, fechaFin, cajeroId, rowsPerPage, offset);
                            }}
                            className="w-full transition-all duration-200 ease-in-out hover:scale-105"
                        />
                    </div>
                </div>
            </ReportHeader>

            {reporteVentas ? (
                <>
                    {/* Sección de Comparación */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-8">
                        <h2 className="text-xl font-bold text-gray-700 mb-4">Análisis Comparativo</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl shadow-inner">
                            <InputField label="Fecha de Inicio (Comparación)" type="date" value={fechaInicioComparacion} onChange={e => setFechaInicioComparacion(e.target.value)} />
                            <InputField label="Fecha de Fin (Comparación)" type="date" value={fechaFinComparacion} onChange={e => setFechaFinComparacion(e.target.value)} />
                            <div className="col-span-full">
                                <Boton label="Generar Comparación" onClick={handleGenerateComparison} className="w-full" />
                            </div>
                        </div>
                    </motion.div>
                    
                    {reporteVentasComparacion && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                            <StatCard title="Total Ventas (Comp.)" value={`$${reporteVentasComparacion.resumenFinanciero.totalVentas.toLocaleString()}`} bg-blue-50 border-blue-100 />
                            <StatCard title="Ventas Netas (Comp.)" value={`$${reporteVentasComparacion.resumenFinanciero.totalNeto.toLocaleString()}`} bg-green-50 border-green-100 />
                            <StatCard title="Total Impuestos (Comp.)" value={`$${reporteVentasComparacion.resumenFinanciero.totalImpuestos.toLocaleString()}`} bg-yellow-50 border-yellow-100 />
                            <StatCard title="Total Descuentos (Comp.)" value={`$${reporteVentasComparacion.resumenFinanciero.totalDescuentos.toLocaleString()}`} bg-red-50 border-red-100 />
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
                        <StatCard title="Total Ventas" value={`$${reporteVentas.resumenFinanciero.totalVentas.toLocaleString()}`} bg-blue-50 border-blue-100 />
                        <StatCard title="Ventas Netas" value={`$${reporteVentas.resumenFinanciero.totalNeto.toLocaleString()}`} bg-green-50 border-green-100 />
                        <StatCard title="Total Impuestos" value={`$${reporteVentas.resumenFinanciero.totalImpuestos.toLocaleString()}`} bg-yellow-50 border-yellow-100 />
                        <StatCard title="Total Descuentos" value={`$${reporteVentas.resumenFinanciero.totalDescuentos.toLocaleString()}`} bg-red-50 border-red-100 />
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
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Detalle de Facturas</h3>
                        <TableWithPagination
                            data={detalleFacturas}
                            columns={[
                                { key: 'id', header: 'ID Factura', render: (item) => <span className="truncate">{item.id.substring(0, 8)}...</span> },
                                { key: 'fecha_hora_factura', header: 'Fecha y Hora' },
                                { key: 'total_factura', header: 'Total ($)', render: (item) => <span className="font-semibold text-green-600">${item.total_factura.toLocaleString()}</span> },
                                { key: 'usuarioCajero', header: 'Cajero' },
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
                    <svg className="mx-auto h-12 w-12 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v2h6v-2m-6-4h6m2 6a2 2 0 002-2V7a2 2 0 00-2-2h-3.586a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 2H6a2 2 0 00-2 2v12a2 2 0 002 2h12z" />
                    </svg>
                    <p className="mt-2 text-lg font-medium">No hay datos para mostrar</p>
                    <p className="text-sm text-gray-500">Selecciona un rango de fechas y actualiza el reporte.</p>
                </div>
            )}
        </div>
    );
};

export default ReporteVentasView;



















// // src/views/ReporteVentasView.tsx
// "use client"

// import { useEmpleadosStore } from '@/stores/empleadosStore';
// import { useState, useEffect } from 'react';
// import Spinner from '@/components/feedback/Spinner';
// import InputField from '@/components/ui/InputField';
// import Boton from '@/components/ui/Boton';
// import SimpleSelect from '@/components/ui/SimpleSelect';
// import {
//   StatCard,
//   ReportHeader,
//   BarChartCard,
//   PieChartCard,
//   TableWithPagination
// } from '@/components/reports/components';
// import { useReportesDashboardStore } from '@/stores/reportesStore';
// import { motion } from "framer-motion";
// import { FONDO } from '@/styles/colors';

// const ErrorMessage = ({ message }: { message: string }) => (
//   <div className="p-6 bg-red-50 text-red-700 rounded-xl shadow text-center">
//     <p className="font-semibold text-lg">Error al cargar los datos</p>
//     <p className="text-sm mt-2">{message}</p>
//     <p className="text-xs text-gray-500 mt-1">Por favor, inténtalo de nuevo más tarde.</p>
//   </div>
// );

// const PERIOD_OPTIONS = [
//   { value: 'day', label: 'Diario' },
//   { value: 'week', label: 'Semanal' },
//   { value: 'month', label: 'Mensual' },
//   { value: 'year', label: 'Anual' },
// ];

// const ReporteVentasView = () => {
//   const { reporteVentas, loading, error, generarReporteVentas } = useReportesDashboardStore();
//   const { empleados, loading: cajerosLoading, traerEmpleados } = useEmpleadosStore();

//   const [fechaInicio, setFechaInicio] = useState("");
//   const [fechaFin, setFechaFin] = useState("");
//   const [periodo, setPeriodo] = useState("month");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(10);
//   const [cajeroId, setCajeroId] = useState("");

//   useEffect(() => {
//     traerEmpleados();
//   }, [traerEmpleados]);

//   const handlePeriodoChange = (newPeriodo: string) => {
//     setPeriodo(newPeriodo);
//     const today = new Date();
//     let newStartDate = "";
//     const todayString = new Date().toISOString().split('T')[0];

//     switch (newPeriodo) {
//       case 'day':
//         newStartDate = todayString;
//         break;
//       case 'week':
//         const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
//         newStartDate = firstDayOfWeek.toISOString().split('T')[0];
//         break;
//       case 'month':
//         const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//         newStartDate = firstDayOfMonth.toISOString().split('T')[0];
//         break;
//       case 'year':
//         const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
//         newStartDate = firstDayOfYear.toISOString().split('T')[0];
//         break;
//       default:
//         newStartDate = todayString;
//     }
//     setFechaInicio(newStartDate);
//     setFechaFin(todayString);
//   };

//   useEffect(() => {
//     if (fechaInicio && fechaFin) {
//       const offset = (currentPage - 1) * rowsPerPage;
//       generarReporteVentas(fechaInicio, fechaFin, cajeroId, rowsPerPage, offset);
//     }
//   }, [generarReporteVentas, fechaInicio, fechaFin, cajeroId, currentPage, rowsPerPage]);

//   const handlePageChange = (page: number) => setCurrentPage(page);
//   const handleRowsPerPageChange = (limit: number) => {
//     setRowsPerPage(limit);
//     setCurrentPage(1);
//   };

//   const cajerosOptions = [
//     { value: '', label: 'Todos los cajeros' },
//     ...empleados.map(empleado => ({
//       value: empleado.id,
//       label: `${empleado.nombre} ${empleado.apellido}`
//     }))
//   ];

//   if (loading.ventas || cajerosLoading) return <Spinner />;
//   if (error.ventas) return <ErrorMessage message={error.ventas} />;

//   const detalleFacturas = reporteVentas?.detalleFacturas.data || [];
//   const totalDetalles = reporteVentas?.detalleFacturas.total || 0;

//   return (
//        <div className="min-h-screen p-6 sm:p-10 font-sans" style={{ background: FONDO }}>
//       <ReportHeader title="Reporte de Ventas">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl shadow-inner">
//           <SimpleSelect label="Periodo" value={periodo} options={PERIOD_OPTIONS} onChange={handlePeriodoChange} />
//           <InputField label="Fecha de Inicio" type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
//           <InputField label="Fecha de Fin" type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
//           <SimpleSelect label="Filtrar por Cajero" value={cajeroId} options={cajerosOptions} onChange={setCajeroId} />
//           <div className="flex items-end">
//             <Boton
//               label="Actualizar Reporte"
//               onClick={() => {
//                 setCurrentPage(1);
//                 const offset = (currentPage - 1) * rowsPerPage;
//                 generarReporteVentas(fechaInicio, fechaFin, cajeroId, rowsPerPage, offset);
//               }}
//               className="w-full transition-all duration-200 ease-in-out hover:scale-105"
//             />
//           </div>
//         </div>
//       </ReportHeader>

//       {reporteVentas ? (
//         <>
//           {/* Resumen financiero */}
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.4 }}
//             className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
//           >
//             <StatCard title="Total Ventas" value={`$${reporteVentas.resumenFinanciero.totalVentas.toLocaleString()}`} bg-blue-50  border-blue-100/>
//             <StatCard title="Ventas Netas" value={`$${reporteVentas.resumenFinanciero.totalNeto.toLocaleString()}`} bg-green-50  border-green-100 />
//             <StatCard title="Total Impuestos" value={`$${reporteVentas.resumenFinanciero.totalImpuestos.toLocaleString()}`} bg-yellow-50  border-yellow-100  />
//             <StatCard title="Total Descuentos" value={`$${reporteVentas.resumenFinanciero.totalDescuentos.toLocaleString()}`} bg-red-50  border-red-100 />
//           </motion.div>

//           <div className="border-t border-gray-200 my-6" />

//           {/* Gráficos */}
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//             <PieChartCard
//               title="Ventas por Medio de Pago"
//               data={reporteVentas.ventasPorMedioPago}
//               nameKey="medio"
//               valueKey="total"
//             />
//             <BarChartCard
//               title="Ventas por Categoría"
//               data={reporteVentas.ventasPorCategoria}
//               dataKey="total"
//               xLabel="categoria"
//               yLabel="Total ($)"
//             />
//           </div>

//           <div className="border-t border-gray-200 my-6" />

//           {/* Tabla */}
//           <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
//             <h3 className="text-lg font-semibold mb-4 text-gray-800">Detalle de Facturas</h3>
//             <TableWithPagination
//               data={detalleFacturas}
//               columns={[
//                 { key: 'id', header: 'ID Factura', render: (item) => <span className="truncate">{item.id.substring(0, 8)}...</span> },
//                 { key: 'fecha_hora_factura', header: 'Fecha y Hora' },
//                 { key: 'total_factura', header: 'Total ($)', render: (item) => <span className="font-semibold text-green-600">${item.total_factura.toLocaleString()}</span> },
//                 { key: 'usuarioCajero', header: 'Cajero' },
//               ]}
//               totalItems={totalDetalles}
//               itemsPerPage={rowsPerPage}
//               currentPage={currentPage}
//               onPageChange={handlePageChange}
//               onRowsPerPageChange={handleRowsPerPageChange}
//             />
//           </div>
//         </>
//       ) : (
//         <div className="text-center p-8 bg-gray-50 rounded-xl shadow-inner border border-dashed border-gray-200 text-gray-400">
//           <svg className="mx-auto h-12 w-12 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v2h6v-2m-6-4h6m2 6a2 2 0 002-2V7a2 2 0 00-2-2h-3.586a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 2H6a2 2 0 00-2 2v12a2 2 0 002 2h12z" />
//           </svg>
//           <p className="mt-2 text-lg font-medium">No hay datos para mostrar</p>
//           <p className="text-sm text-gray-500">Selecciona un rango de fechas y actualiza el reporte.</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ReporteVentasView;






































// "use client"

// import { useReportesDashboardStore } from '@/stores/reportesStore';
// import { useState, useEffect } from 'react';
// import toast from 'react-hot-toast';
// import { FONDO, FONDO_COMPONENTES } from "@/styles/colors";
// import Spinner from '@/components/feedback/Spinner';
// import InputField from '@/components/ui/InputField';
// import SimpleSelect from '@/components/ui/SimpleSelect';
// import Boton from '@/components/ui/Boton';

// const ErrorMessage = ({ message }: { message: string }) => (
//     <div className="p-6 bg-red-50 text-red-700 rounded-xl shadow text-center">
//         <p className="font-semibold text-lg">Error al cargar los datos</p>
//         <p className="text-sm mt-2">{message}</p>
//         <p className="text-xs text-gray-500 mt-1">Por favor, inténtalo de nuevo más tarde.</p>
//     </div>
// );

// const StatCard = ({ title, value }: { title: string, value: string | number }) => (
//     <div className="bg-white p-6 rounded-xl shadow flex flex-col items-start justify-between border border-gray-100">
//         <h3 className="text-sm font-medium text-gray-700 mb-2">{title}</h3>
//         <p className="text-2xl font-bold text-gray-900">{value}</p>
//     </div>
// );

// const ReportHeader = ({ title, children }: { title: string, children?: React.ReactNode }) => (
//     <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
//         <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
//         {children && <div className="flex flex-wrap items-end gap-4">{children}</div>}
//     </header>
// );

// const ReporteVentasView = () => {
//     const { reporteVentas, loading, error, generarReporteVentas } = useReportesDashboardStore();
//     const [fechaInicio, setFechaInicio] = useState(""); 
//     const [fechaFin, setFechaFin] = useState(""); 

//     const handleGenerarReporte = () => {
//         if (!fechaInicio || !fechaFin) {
//             toast.error("Por favor, selecciona un rango de fechas completo.");
//             return;
//         }
//         generarReporteVentas(fechaInicio, fechaFin);
//     };

//     if (loading.ventas) return <Spinner />;
//     if (error.ventas) return <ErrorMessage message={error.ventas} />;

//     return (
//         <div className="space-y-8">
//             <ReportHeader title="Reporte de Ventas">
//                 <InputField
//                     label="Fecha de Inicio"
//                     type="date"
//                     value={fechaInicio}
//                     onChange={e => setFechaInicio(e.target.value)}
//                 />
//                 <InputField
//                     label="Fecha de Fin"
//                     type="date"
//                     value={fechaFin}
//                     onChange={e => setFechaFin(e.target.value)}
//                 />
//                 <Boton label="Generar Reporte" onClick={handleGenerarReporte}>
//                     Generar Reporte
//                 </Boton>
//             </ReportHeader>
            
//             {reporteVentas ? (
//                 <>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//                         <StatCard 
//                             title="Total Ventas" 
//                             value={`$${reporteVentas.resumenFinanciero.totalVentas.toLocaleString()}`} 
//                         />
//                         <StatCard 
//                             title="Ventas Netas" 
//                             value={`$${reporteVentas.resumenFinanciero.totalNeto.toLocaleString()}`} 
//                         />
//                         <StatCard 
//                             title="Total Impuestos" 
//                             value={`$${reporteVentas.resumenFinanciero.totalImpuestos.toLocaleString()}`} 
//                         />
//                         <StatCard 
//                             title="Total Descuentos" 
//                             value={`$${reporteVentas.resumenFinanciero.totalDescuentos.toLocaleString()}`} 
//                         />
//                     </div>
//                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//                         <div className="bg-gray-50 p-6 rounded-xl shadow border border-gray-100">
//                             <h3 className="text-lg font-semibold mb-4 text-gray-800">Ventas por Categoría</h3>
//                             <ul className="space-y-4">
//                                 {reporteVentas.ventasPorCategoria.map((item, index) => (
//                                     <li key={index} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
//                                         <span className="font-medium text-gray-700">{item.categoria}</span>
//                                         <span className="text-gray-900 font-bold">${item.total.toLocaleString()}</span>
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//                         <div className="bg-gray-50 p-6 rounded-xl shadow border border-gray-100">
//                             <h3 className="text-lg font-semibold mb-4 text-gray-800">Top Productos Vendidos</h3>
//                             <ul className="space-y-4">
//                                 {reporteVentas.topProductosVendidos.map((item, index) => (
//                                     <li key={index} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
//                                         <span className="font-medium text-gray-700">{item.producto}</span>
//                                         <span className="text-gray-900 font-bold">{item.cantidad} unidades</span>
//                                     </li>
//                                 ))}
//                             </ul>
//                         </div>
//                     </div>
//                 </>
//             ) : (
//                 <div className="text-center p-8 bg-gray-50 rounded-xl shadow-inner border border-dashed border-gray-200 text-gray-400">
//                     <p className="text-lg">Selecciona un rango de fechas y haz clic en "Generar Reporte".</p>
//                 </div>
//             )}
//         </div>
//     );
// };

// const ReporteInventarioView = () => {
//     const { reporteInventario, loading, error, generarReporteInventario } = useReportesDashboardStore();

//     useEffect(() => {
//         generarReporteInventario();
//     }, [generarReporteInventario]);

//     if (loading.inventario) return <Spinner />;
//     if (error.inventario) return <ErrorMessage message={error.inventario} />;
//     if (!reporteInventario) return <div className="text-center p-8 text-gray-500">Reporte de inventario no disponible.</div>;

//     const { resumenInventario, detalleInventario } = reporteInventario;

//     return (
//         <div className="space-y-8">
//             <ReportHeader title="Reporte de Inventario" />
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
//                 <StatCard 
//                     title="Total Ingredientes" 
//                     value={resumenInventario.totalIngredientes} 
//                 />
//                 <StatCard 
//                     title="Items Bajo Stock" 
//                     value={resumenInventario.itemsBajoStock} 
//                 />
//                 <StatCard 
//                     title="Valor Total" 
//                     value={`$${resumenInventario.valorTotalInventario.toLocaleString()}`} 
//                 />
//             </div>

//             <div className="bg-gray-50 p-6 rounded-xl shadow border border-gray-100">
//                 <h3 className="text-lg font-semibold mb-4 text-gray-800">Detalle de Inventario</h3>
//                 <div className="overflow-x-auto rounded-xl">
//                     <table className="min-w-full bg-white rounded-lg">
//                         <thead className="bg-gray-100 text-gray-700 uppercase text-xs sm:text-sm">
//                             <tr>
//                                 <th className="py-4 px-6 text-left">Nombre</th>
//                                 <th className="py-4 px-6 text-left">Stock Actual</th>
//                                 <th className="py-4 px-6 text-left">Stock Mínimo</th>
//                                 <th className="py-4 px-6 text-left">Costo Unitario</th>
//                                 <th className="py-4 px-6 text-left">Estado</th>
//                             </tr>
//                         </thead>
//                         <tbody className="bg-white divide-y divide-gray-200 text-gray-600">
//                             {detalleInventario.map((item) => (
//                                 <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-200">
//                                     <td className="py-4 px-6 font-medium">{item.nombre}</td>
//                                     <td className="py-4 px-6">{item.stockActual}</td>
//                                     <td className="py-4 px-6">{item.stockMinimo}</td>
//                                     <td className="py-4 px-6">${item.costoUnitario.toLocaleString()}</td>
//                                     <td className="py-4 px-6">
//                                         <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
//                                             item.estado === 'BAJO_STOCK' ? 'bg-red-100 text-red-700' : 
//                                             item.estado === 'INVENTARIO_SUFICIENTE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
//                                         }`}>
//                                             {item.estado.replace(/_/g, ' ')}
//                                         </span>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     );
// };

// const ReportePedidosView = () => {
//     const { reportePedidos, loading, error, generarReportePedidos } = useReportesDashboardStore();
//     const [estadoPedido, setEstadoPedido] = useState("ABIERTO"); 
//     const [estadoCocinaItem, setEstadoCocinaItem] = useState("PENDIENTE"); 
//     const estadosPedido = ["ABIERTO", "PAGADO", "CANCELADO"];
//     const estadosCocina = ["PENDIENTE", "EN_PREPARACION", "ENVIADO_A_COCINA", "LISTO", "CANCELADO"];

//     const handleGenerarReporte = () => {
//         generarReportePedidos(estadoPedido, estadoCocinaItem);
//     };

//     if (loading.pedidos) return <Spinner />;
//     if (error.pedidos) return <ErrorMessage message={error.pedidos} />;

//     return (
//         <div className="space-y-8">
//             <ReportHeader title="Reporte de Pedidos">
//                 <SimpleSelect
//                     label="Estado del Pedido"
//                     value={estadoPedido}
//                     options={estadosPedido.map(e => ({ value: e, label: e.replace(/_/g, ' ') }))}
//                     onChange={setEstadoPedido}
//                 />
//                 <SimpleSelect
//                     label="Estado en Cocina"
//                     value={estadoCocinaItem}
//                     options={estadosCocina.map(e => ({ value: e, label: e.replace(/_/g, ' ') }))}
//                     onChange={setEstadoCocinaItem}
//                 />
//                 <Boton label="Generar Reporte" onClick={handleGenerarReporte}>
//                     Generar Reporte
//                 </Boton>
//             </ReportHeader>
            
//             {reportePedidos ? (
//                 <>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//                         <StatCard 
//                             title="Total Pedidos" 
//                             value={reportePedidos.resumenPedidos.totalPedidos} 
//                         />
//                         <StatCard 
//                             title="Pedidos Abiertos" 
//                             value={reportePedidos.resumenPedidos.pedidosAbiertos} 
//                         />
//                         <StatCard 
//                             title="En Preparación" 
//                             value={reportePedidos.resumenPedidos.pedidosEnPreparacion} 
//                         />
//                         <StatCard 
//                             title="Listos para Entregar" 
//                             value={reportePedidos.resumenPedidos.pedidosListos} 
//                         />
//                     </div>
//                     <div className="bg-gray-50 p-6 rounded-xl shadow border border-gray-100">
//                         <h3 className="text-lg font-semibold mb-4 text-gray-800">Detalle de Pedidos</h3>
//                         <div className="overflow-x-auto rounded-xl">
//                             <table className="min-w-full bg-white rounded-lg">
//                                 <thead className="bg-gray-100 text-gray-700 uppercase text-xs sm:text-sm">
//                                     <tr>
//                                         <th className="py-4 px-6 text-left">Pedido ID</th>
//                                         <th className="py-4 px-6 text-left">Tipo</th>
//                                         <th className="py-4 px-6 text-left">Estado</th>
//                                         <th className="py-4 px-6 text-left">Mesa</th>
//                                         <th className="py-4 px-6 text-left">Total</th>
//                                     </tr>
//                                 </thead>
//                                 <tbody className="bg-white divide-y divide-gray-200 text-gray-600">
//                                     {reportePedidos.detallePedidos.map((pedido) => (
//                                         <tr key={pedido.id} className="hover:bg-gray-50 transition-colors duration-200">
//                                             <td className="py-4 px-6 font-medium">{pedido.id.substring(0, 8)}...</td>
//                                             <td className="py-4 px-6">{pedido.tipoPedido.replace(/_/g, ' ')}</td>
//                                             <td className="py-4 px-6">
//                                                 <span className={`py-1 px-3 rounded-full text-xs font-semibold ${
//                                                     pedido.estadoPedido === 'PAGADO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
//                                                 }`}>
//                                                     {pedido.estadoPedido.replace(/_/g, ' ')}
//                                                 </span>
//                                             </td>
//                                             <td className="py-4 px-6">{pedido.mesa}</td>
//                                             <td className="py-4 px-6">${pedido.totalEstimado.toLocaleString()}</td>
//                                         </tr>
//                                     ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>
//                 </>
//             ) : (
//                 <div className="text-center p-8 bg-gray-50 rounded-xl shadow-inner border border-dashed border-gray-200 text-gray-400">
//                     <p className="text-lg">Selecciona los estados deseados y haz clic en "Generar Reporte".</p>
//                 </div>
//             )}
//         </div>
//     );
// };

// // Componente principal
// export default function App() {
//     const [activeReporte, setActiveReporte] = useState<'ventas' | 'inventario' | 'pedidos'>('ventas');

//     return (
//         <div className="min-h-screen p-6 sm:p-10 font-sans" style={{ background: FONDO }}>
//             <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-8">
//                 Dashboard de Reportes
//             </h1>

//             <div className="flex justify-center space-x-4 mb-8">
//                 <Boton
//                     label="Ventas"
//                     onClick={() => setActiveReporte('ventas')}
//                 />
//                 <Boton
//                     label="Inventario"
//                     onClick={() => setActiveReporte('inventario')}
//                 />
//                 <Boton
//                     label="Pedidos"
//                     onClick={() => setActiveReporte('pedidos')}
//                 />
//             </div>

//             <div className="max-w-7xl mx-auto p-8 rounded-3xl shadow-2xl border border-gray-100" style={{ background: FONDO_COMPONENTES }}>
//                 {activeReporte === 'ventas' && <ReporteVentasView />}
//                 {activeReporte === 'inventario' && <ReporteInventarioView />}
//                 {activeReporte === 'pedidos' && <ReportePedidosView />}
//             </div>
//         </div>
//     );
// }
