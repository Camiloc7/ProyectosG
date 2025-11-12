"use client";
import React, { useState, useEffect } from "react";
import { FONDO } from "@/styles/colors";
import { useCajaStore, CajaData } from "@/stores/cierreDeCajaStore";
import { useEmpleadosStore, Empleado } from "@/stores/empleadosStore";
import Spinner from "@/components/feedback/Spinner";

export default function CierreDeCaja() {
  const { traerCierresDeCaja, cierresDeCaja, traerCajaActiva, cajaActiva, loading: loadingCajas } = useCajaStore();
  const { traerEmpleados, empleados, loading: loadingEmpleados } = useEmpleadosStore();

  const [search, setSearch] = useState("");
  const [detallesId, setDetallesId] = useState<string | null>(null);
  const [fechaDesde, setFechaDesde] = useState<string>("");
  const [fechaHasta, setFechaHasta] = useState<string>("");

  useEffect(() => {
    traerCajaActiva();
    traerCierresDeCaja();
    traerEmpleados();
  }, [traerCajaActiva, traerCierresDeCaja, traerEmpleados]);

  const usuariosMap = new Map<string, Empleado>();
  const establecimientosMap = new Map<string, { nombre: string }>();
  empleados.forEach(emp => {
    usuariosMap.set(emp.id, emp);
    if (!establecimientosMap.has(emp.establecimiento.id)) {
      establecimientosMap.set(emp.establecimiento.id, { nombre: emp.establecimiento.nombre });
    }
  });

  const filteredCaja = cierresDeCaja.filter(
    (item) => {
      const establecimiento = establecimientosMap.get(item.establecimiento_id)?.nombre || "";
      const usuario = usuariosMap.get(item.usuario_cajero_id);
      const nombreUsuario = usuario ? `${usuario.nombre} ${usuario.apellido}` : "";
      const fechaApertura = new Date(item.fecha_hora_apertura);

      const matchesSearch =
        establecimiento.toLowerCase().includes(search.toLowerCase()) ||
        nombreUsuario.toLowerCase().includes(search.toLowerCase());

      const matchesDateRange =
        (!fechaDesde || fechaApertura >= new Date(fechaDesde)) &&
        (!fechaHasta || fechaApertura <= new Date(fechaHasta));

      return matchesSearch && matchesDateRange;
    }
  );

  const toggleDetalles = (id: string) => {
    setDetallesId(detallesId === id ? null : id);
  };

  const isLoading = loadingCajas || loadingEmpleados;

  const totalSaldoFinal = filteredCaja.reduce((sum, item) => sum + Number(item.saldo_final_contado || 0), 0);
  const totalDiferencia = filteredCaja.reduce((sum, item) => sum + Number(item.diferencia_caja || 0), 0);
  const totalVentasNetas = filteredCaja.reduce((sum, item) => sum + Number(item.total_neto_ventas || 0), 0);

  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato" style={{ backgroundColor: FONDO }}>
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
                {establecimientosMap.get(cajaActiva.establecimiento_id)?.nombre || "Desconocido"}
              </p>
              <p className="text-gray-800">
                <strong>Cajero:</strong>{" "}
                {usuariosMap.get(cajaActiva.usuario_cajero_id) ? 
                  `${usuariosMap.get(cajaActiva.usuario_cajero_id)?.nombre} ${usuariosMap.get(cajaActiva.usuario_cajero_id)?.apellido}` : "Desconocido"}
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

      {/* ------------------------------------------------------------- */}

      {!isLoading && (
        <>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Cierres Anteriores</h2>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex items-center gap-2">
              <label htmlFor="fechaDesde" className="text-gray-700 text-sm">Desde:</label>
              <input
                type="date"
                id="fechaDesde"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="fechaHasta" className="text-gray-700 text-sm">Hasta:</label>
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
            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-200">
                  <tr>
                    <th scope="col" className="py-3 px-6">Establecimiento</th>
                    <th scope="col" className="py-3 px-6">Cajero</th>
                    <th scope="col" className="py-3 px-6">Apertura</th>
                    <th scope="col" className="py-3 px-6">Cierre</th>
                    <th scope="col" className="py-3 px-6">Saldo Final</th>
                    <th scope="col" className="py-3 px-6">Diferencia</th>
                    <th scope="col" className="py-3 px-6">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCaja.map((item: CajaData) => {
                    const usuario = usuariosMap.get(item.usuario_cajero_id);
                    const establecimiento = establecimientosMap.get(item.establecimiento_id);
                    const fechaApertura = new Date(item.fecha_hora_apertura).toLocaleString();
                    const fechaCierre = item.fecha_hora_cierre ? new Date(item.fecha_hora_cierre).toLocaleString() : "No cerrado";

                    return (
                      <React.Fragment key={item.id}>
                        <tr className="bg-white border-b hover:bg-gray-50">
                          <td className="py-4 px-6 font-medium text-gray-900">
                            {establecimiento?.nombre || "Desconocido"}
                          </td>
                          <td className="py-4 px-6">
                            {usuario ? `${usuario.nombre} ${usuario.apellido}` : "Desconocido"}
                          </td>
                          <td className="py-4 px-6">{fechaApertura}</td>
                          <td className="py-4 px-6">{fechaCierre}</td>
                          <td className="py-4 px-6">${item.saldo_final_contado}</td>
                          <td className="py-4 px-6">${item.diferencia_caja}</td>
                          <td className="py-4 px-6">
                            <button
                              onClick={() => toggleDetalles(item.id)}
                              className="text-blue-600 hover:underline"
                            >
                              {detallesId === item.id ? "Ocultar" : "Ver"}
                            </button>
                          </td>
                        </tr>
                        {detallesId === item.id && (
                          <tr className="bg-gray-100">
                            <td colSpan={7} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
                                <div>
                                  <p><strong>Total ventas brutas:</strong> ${item.total_ventas_brutas}</p>
                                  <p><strong>Total descuentos:</strong> ${item.total_descuentos}</p>
                                  <p><strong>Total impuestos:</strong> ${item.total_impuestos}</p>
                                  <p><strong>Total propina:</strong> ${item.total_propina}</p>
                                </div>
                                <div>
                                  <p><strong>Total neto ventas:</strong> ${item.total_neto_ventas}</p>
                                  <p><strong>Total pagos efectivo:</strong> ${item.total_pagos_efectivo}</p>
                                  <p><strong>Total pagos tarjeta:</strong> ${item.total_pagos_tarjeta}</p>
                                </div>
                                <div>
                                  <p><strong>Total pagos otros:</strong> ${item.total_pagos_otros}</p>
                                  <p><strong>Total recaudado:</strong> ${item.total_recaudado}</p>
                                </div>
                                <div className="md:col-span-2 lg:col-span-3 mt-2">
                                  <p><strong>Observaciones:</strong> {item.observaciones ?? "Ninguna"}</p>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
                <tfoot className="text-xs text-gray-700 uppercase bg-gray-200">
                  <tr>
                    <th scope="col" colSpan={4} className="py-3 px-6 text-right font-bold">Totales de la vista:</th>
                    <th scope="col" className="py-3 px-6">${totalSaldoFinal.toFixed(2)}</th>
                    <th scope="col" className="py-3 px-6">${totalDiferencia.toFixed(2)}</th>
                    <th scope="col" className="py-3 px-6"></th>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}


// "use client";
// import React, { useState, useEffect } from "react";
// import { FONDO } from "@/styles/colors";
// import { useCajaStore, CajaData } from "@/stores/cierreDeCajaStore";
// import { useEmpleadosStore, Empleado } from "@/stores/empleadosStore";
// import Spinner from "@/components/feedback/Spinner";

// export default function CierreDeCaja() {
//   const { traerCierresDeCaja, cierresDeCaja, traerCajaActiva, cajaActiva, loading: loadingCajas } = useCajaStore();
//   const { traerEmpleados, empleados, loading: loadingEmpleados } = useEmpleadosStore();

//   const [search, setSearch] = useState("");
//   const [detallesId, setDetallesId] = useState<string | null>(null);
//   const [fechaSeleccionada, setFechaSeleccionada] = useState<string>("");

//   useEffect(() => {
//     traerCajaActiva();
//     traerCierresDeCaja();
//     traerEmpleados();
//   }, [traerCajaActiva, traerCierresDeCaja, traerEmpleados]);

//   const usuariosMap = new Map<string, Empleado>();
//   const establecimientosMap = new Map<string, { nombre: string }>();
//   empleados.forEach(emp => {
//     usuariosMap.set(emp.id, emp);
//     if (!establecimientosMap.has(emp.establecimiento.id)) {
//       establecimientosMap.set(emp.establecimiento.id, { nombre: emp.establecimiento.nombre });
//     }
//   });

//   const filteredCaja = cierresDeCaja.filter(
//     (item) => {
//       const establecimiento = establecimientosMap.get(item.establecimiento_id)?.nombre || "";
//       const usuario = usuariosMap.get(item.usuario_cajero_id);
//       const nombreUsuario = usuario ? `${usuario.nombre} ${usuario.apellido}` : "";
//       const fechaApertura = new Date(item.fecha_hora_apertura);

//       const matchesSearch =
//         establecimiento.toLowerCase().includes(search.toLowerCase()) ||
//         nombreUsuario.toLowerCase().includes(search.toLowerCase());

//       const matchesDate = !fechaSeleccionada || fechaApertura.toISOString().slice(0, 10) === fechaSeleccionada;

//       return matchesSearch && matchesDate;
//     }
//   );

//   const toggleDetalles = (id: string) => {
//     setDetallesId(detallesId === id ? null : id);
//   };

//   const isLoading = loadingCajas || loadingEmpleados;

//   // Cálculo de totales
//   // Código corregido para la línea 55
// const totalSaldoFinal = filteredCaja.reduce((sum, item) => sum + Number(item.saldo_final_contado || 0), 0);
// const totalDiferencia = filteredCaja.reduce((sum, item) => sum + Number(item.diferencia_caja || 0), 0);
// const totalVentasNetas = filteredCaja.reduce((sum, item) => sum + Number(item.total_neto_ventas || 0), 0);

//   return (
//     <div className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato" style={{ backgroundColor: FONDO }}>
//       <div className="flex flex-col md:flex-row items-center justify-between py-4 mb-8">
//         <h1 className="text-3xl font-semibold text-gray-900 mb-4 md:mb-0">
//           Estado de caja
//         </h1>
//         <div className="flex gap-4 w-full sm:w-auto">
//           <input
//             type="text"
//             placeholder="Buscar por establecimiento o cajero..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
//           />
//         </div>
//       </div>

//       {isLoading && <Spinner />}

//       {!isLoading && (
//         <div className="mb-8">
//           <h2 className="text-xl font-bold text-gray-800 mb-4">Caja Activa</h2>
//           {cajaActiva ? (
//             <div className="border border-green-400 bg-green-50 rounded-lg p-6 shadow-md">
//               <p className="text-sm text-green-700">
//                 Hay una caja activa en este momento.
//               </p>
//               <p className="mt-2 text-gray-800">
//                 <strong>Establecimiento:</strong>{" "}
//                 {establecimientosMap.get(cajaActiva.establecimiento_id)?.nombre || "Desconocido"}
//               </p>
//               <p className="text-gray-800">
//                 <strong>Cajero:</strong>{" "}
//                 {usuariosMap.get(cajaActiva.usuario_cajero_id) ? 
//                   `${usuariosMap.get(cajaActiva.usuario_cajero_id)?.nombre} ${usuariosMap.get(cajaActiva.usuario_cajero_id)?.apellido}` : "Desconocido"}
//               </p>
//               <p className="text-gray-800">
//                 <strong>Saldo inicial:</strong> ${cajaActiva.saldo_inicial_caja}
//               </p>
//               <p className="text-gray-800">
//                 <strong>Fecha de apertura:</strong>{" "}
//                 {new Date(cajaActiva.fecha_hora_apertura).toLocaleString()}
//               </p>
//             </div>
//           ) : (
//             <div className="border border-gray-300 bg-gray-100 rounded-lg p-6 text-center text-gray-500">
//               No hay una caja activa en este momento.
//             </div>
//           )}
//         </div>
//       )}

//       {/* ------------------------------------------------------------- */}

//       {!isLoading && (
//         <>
//           <h2 className="text-xl font-bold text-gray-800 mb-4">Cierres Anteriores</h2>
          
//           <div className="flex items-center gap-2 mb-6">
//             <label htmlFor="fecha" className="text-gray-700 text-sm">Filtrar por fecha:</label>
//             <input
//               type="date"
//               id="fecha"
//               value={fechaSeleccionada}
//               onChange={(e) => setFechaSeleccionada(e.target.value)}
//               className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700"
//             />
//           </div>

//           {filteredCaja.length === 0 ? (
//             <div className="text-center text-gray-500">
//               No se encontraron cierres de caja para los filtros seleccionados.
//             </div>
//           ) : (
//             <div className="overflow-x-auto shadow-md rounded-lg">
//               <table className="w-full text-sm text-left text-gray-500">
//                 <thead className="text-xs text-gray-700 uppercase bg-gray-200">
//                   <tr>
//                     <th scope="col" className="py-3 px-6">Establecimiento</th>
//                     <th scope="col" className="py-3 px-6">Cajero</th>
//                     <th scope="col" className="py-3 px-6">Apertura</th>
//                     <th scope="col" className="py-3 px-6">Cierre</th>
//                     <th scope="col" className="py-3 px-6">Saldo Final</th>
//                     <th scope="col" className="py-3 px-6">Diferencia</th>
//                     <th scope="col" className="py-3 px-6">Acciones</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredCaja.map((item: CajaData) => {
//                     const usuario = usuariosMap.get(item.usuario_cajero_id);
//                     const establecimiento = establecimientosMap.get(item.establecimiento_id);
//                     const fechaApertura = new Date(item.fecha_hora_apertura).toLocaleString();
//                     const fechaCierre = item.fecha_hora_cierre ? new Date(item.fecha_hora_cierre).toLocaleString() : "No cerrado";

//                     return (
//                       <React.Fragment key={item.id}>
//                         <tr className="bg-white border-b hover:bg-gray-50">
//                           <td className="py-4 px-6 font-medium text-gray-900">
//                             {establecimiento?.nombre || "Desconocido"}
//                           </td>
//                           <td className="py-4 px-6">
//                             {usuario ? `${usuario.nombre} ${usuario.apellido}` : "Desconocido"}
//                           </td>
//                           <td className="py-4 px-6">{fechaApertura}</td>
//                           <td className="py-4 px-6">{fechaCierre}</td>
//                           <td className="py-4 px-6">${item.saldo_final_contado}</td>
//                           <td className="py-4 px-6">${item.diferencia_caja}</td>
//                           <td className="py-4 px-6">
//                             <button
//                               onClick={() => toggleDetalles(item.id)}
//                               className="text-blue-600 hover:underline"
//                             >
//                               {detallesId === item.id ? "Ocultar" : "Ver"}
//                             </button>
//                           </td>
//                         </tr>
//                         {detallesId === item.id && (
//                           <tr className="bg-gray-100">
//                             <td colSpan={7} className="p-4">
//                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-700">
//                                 <div>
//                                   <p><strong>Total ventas brutas:</strong> ${item.total_ventas_brutas}</p>
//                                   <p><strong>Total descuentos:</strong> ${item.total_descuentos}</p>
//                                   <p><strong>Total impuestos:</strong> ${item.total_impuestos}</p>
//                                   <p><strong>Total propina:</strong> ${item.total_propina}</p>
//                                 </div>
//                                 <div>
//                                   <p><strong>Total neto ventas:</strong> ${item.total_neto_ventas}</p>
//                                   <p><strong>Total pagos efectivo:</strong> ${item.total_pagos_efectivo}</p>
//                                   <p><strong>Total pagos tarjeta:</strong> ${item.total_pagos_tarjeta}</p>
//                                 </div>
//                                 <div>
//                                   <p><strong>Total pagos otros:</strong> ${item.total_pagos_otros}</p>
//                                   <p><strong>Total recaudado:</strong> ${item.total_recaudado}</p>
//                                 </div>
//                                 <div className="md:col-span-2 lg:col-span-3 mt-2">
//                                   <p><strong>Observaciones:</strong> {item.observaciones ?? "Ninguna"}</p>
//                                 </div>
//                               </div>
//                             </td>
//                           </tr>
//                         )}
//                       </React.Fragment>
//                     );
//                   })}
//                 </tbody>
//                 {/* Fila de totales */}
//                 <tfoot className="text-xs text-gray-700 uppercase bg-gray-200">
//                   <tr>
//                     <th scope="col" colSpan={4} className="py-3 px-6 text-right font-bold">Totales de la vista:</th>
//                     <th scope="col" className="py-3 px-6">${totalSaldoFinal.toFixed(2)}</th>
//                     <th scope="col" className="py-3 px-6">${totalDiferencia.toFixed(2)}</th>
//                     <th scope="col" className="py-3 px-6"></th>
//                   </tr>
//                 </tfoot>
//               </table>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }




// "use client";
// import React, { useState, useEffect } from "react";
// import { FONDO, ORANGE } from "@/styles/colors";
// import { useCajaStore, CajaData } from "@/stores/cierreDeCajaStore";
// import { useEmpleadosStore, Empleado } from "@/stores/empleadosStore";
// import Spinner from "@/components/feedback/Spinner";

// export default function CierreDeCaja() {
//   const { traerCierresDeCaja, cierresDeCaja, traerCajaActiva, cajaActiva, loading: loadingCajas } = useCajaStore();
//   const { traerEmpleados, empleados, loading: loadingEmpleados } = useEmpleadosStore();

//   const [visibleCount, setVisibleCount] = useState(3);
//   const [search, setSearch] = useState("");
//   const [detallesId, setDetallesId] = useState<string | null>(null);

//   useEffect(() => {
//     traerCajaActiva();
//     traerCierresDeCaja();
//     traerEmpleados();
//   }, [traerCajaActiva, traerCierresDeCaja, traerEmpleados]);
//   const usuariosMap = new Map<string, Empleado>();
//   const establecimientosMap = new Map<string, { nombre: string }>();
//   empleados.forEach(emp => {
//     usuariosMap.set(emp.id, emp);
//     if (!establecimientosMap.has(emp.establecimiento.id)) {
//       establecimientosMap.set(emp.establecimiento.id, { nombre: emp.establecimiento.nombre });
//     }
//   });

//   const filteredCaja = cierresDeCaja.filter(
//     (item) => {
//       const establecimiento = establecimientosMap.get(item.establecimiento_id)?.nombre || "";
//       const usuario = usuariosMap.get(item.usuario_cajero_id);
//       const nombreUsuario = usuario ? `${usuario.nombre} ${usuario.apellido}` : "";

//       return (
//         establecimiento.toLowerCase().includes(search.toLowerCase()) ||
//         nombreUsuario.toLowerCase().includes(search.toLowerCase())
//       );
//     }
//   );

//   const visibleCaja = filteredCaja.slice(0, visibleCount);

//   const toggleDetalles = (id: string) => {
//     setDetallesId(detallesId === id ? null : id);
//   };

//   const isLoading = loadingCajas || loadingEmpleados;

//   return (
//     <div className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] font-lato" style={{ backgroundColor: FONDO }}>
//       <div className="flex flex-col md:flex-row items-center justify-between py-4 mb-8">
//         <h1 className="text-3xl font-semibold text-gray-900 mb-4 md:mb-0">
//           Estado de caja
//         </h1>
//         <div className="flex gap-4 w-full sm:w-auto">
//           <input
//             type="text"
//             placeholder="Buscar por establecimiento o cajero..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
//           />
//         </div>
//       </div>

//       {isLoading && <Spinner />}

//       {!isLoading && (
//         <div className="mb-8">
//           <h2 className="text-xl font-bold text-gray-800 mb-4">Caja Activa</h2>
//           {cajaActiva ? (
//             <div className="border border-green-400 bg-green-50 rounded-lg p-6 shadow-md">
//               <p className="text-sm text-green-700">
//                 Hay una caja activa en este momento.
//               </p>
//               <p className="mt-2 text-gray-800">
//                 <strong>Establecimiento:</strong>{" "}
//                 {establecimientosMap.get(cajaActiva.establecimiento_id)?.nombre || "Desconocido"}
//               </p>
//               <p className="text-gray-800">
//                 <strong>Cajero:</strong>{" "}
//                 {usuariosMap.get(cajaActiva.usuario_cajero_id) ? 
//                   `${usuariosMap.get(cajaActiva.usuario_cajero_id)?.nombre} ${usuariosMap.get(cajaActiva.usuario_cajero_id)?.apellido}` : "Desconocido"}
//               </p>
//               <p className="text-gray-800">
//                 <strong>Saldo inicial:</strong> ${cajaActiva.saldo_inicial_caja}
//               </p>
//               <p className="text-gray-800">
//                 <strong>Fecha de apertura:</strong>{" "}
//                 {new Date(cajaActiva.fecha_hora_apertura).toLocaleString()}
//               </p>
//             </div>
//           ) : (
//             <div className="border border-gray-300 bg-gray-100 rounded-lg p-6 text-center text-gray-500">
//               No hay una caja activa en este momento.
//             </div>
//           )}
//         </div>
//       )}

//       {!isLoading && (
//         <>
//           <h2 className="text-xl font-bold text-gray-800 mb-4">Cierres Anteriores</h2>
//           {visibleCaja.length === 0 ? (
//             <div className="text-center text-gray-500">
//               No se encontraron cierres de caja.
//             </div>
//           ) : (
//             <ul className="space-y-4 text-black">
//               {visibleCaja.map((item: CajaData) => {
//                 const usuario = usuariosMap.get(item.usuario_cajero_id);
//                 const establecimiento = establecimientosMap.get(item.establecimiento_id);
//                 return (
//                   <li
//                     key={item.id}
//                     className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm"
//                   >
//                     <p>
//                       <strong>Establecimiento:</strong>{" "}
//                       {establecimiento?.nombre || "Desconocido"}
//                     </p>
//                     <p>
//                       <strong>Cajero:</strong>{" "}
//                       {usuario ? `${usuario.nombre} ${usuario.apellido}` : "Desconocido"}
//                     </p>
//                     <p>
//                       <strong>Fecha apertura:</strong>{" "}
//                       {new Date(item.fecha_hora_apertura).toLocaleString()}
//                     </p>
//                     <p>
//                       <strong>Saldo inicial:</strong> ${item.saldo_inicial_caja}
//                     </p>
//                     <p>
//                       <strong>Cerrado:</strong> {item.cerrado ? "Sí" : "No"}
//                     </p>

//                     <button
//                       onClick={() => toggleDetalles(item.id)}
//                       className="mt-2  hover:underline"style={{ color: ORANGE }}
//                     >
//                       {detallesId === item.id ? "Ocultar detalles" : "Ver detalles"}
//                     </button>

//                     {detallesId === item.id && (
//                       <div className="mt-4 bg-gray-100 p-3 rounded text-sm space-y-1">
//                         <p>
//                           <strong>Fecha cierre:</strong>{" "}
//                           {item.fecha_hora_cierre
//                             ? new Date(item.fecha_hora_cierre).toLocaleString()
//                             : "No cerrado"}
//                         </p>
//                         <p>
//                           <strong>Saldo final contado:</strong> $
//                           {item.saldo_final_contado}
//                         </p>
//                         <p>
//                           <strong>Total ventas brutas:</strong> $
//                           {item.total_ventas_brutas}
//                         </p>
//                         <p>
//                           <strong>Total descuentos:</strong> ${item.total_descuentos}
//                         </p>
//                         <p>
//                           <strong>Total impuestos:</strong> ${item.total_impuestos}
//                         </p>
//                         <p>
//                           <strong>Total propina:</strong> ${item.total_propina}
//                         </p>
//                         <p>
//                           <strong>Total neto ventas:</strong> $
//                           {item.total_neto_ventas}
//                         </p>
//                         <p>
//                           <strong>Total pagos efectivo:</strong> $
//                           {item.total_pagos_efectivo}
//                         </p>
//                         <p>
//                           <strong>Total pagos tarjeta:</strong> $
//                           {item.total_pagos_tarjeta}
//                         </p>
//                         <p>
//                           <strong>Total pagos otros:</strong> $
//                           {item.total_pagos_otros}
//                         </p>
//                         <p>
//                           <strong>Total recaudado:</strong> ${item.total_recaudado}
//                         </p>
//                         <p>
//                           <strong>Diferencia caja:</strong> ${item.diferencia_caja}
//                         </p>
//                         <p>
//                           <strong>Observaciones:</strong>{" "}
//                           {item.observaciones ?? "Ninguna"}
//                         </p>
//                       </div>
//                     )}
//                   </li>
//                 );
//               })}
//             </ul>
//           )}
          
//           {visibleCount < filteredCaja.length && (
//             <div className="mt-4 text-center">
//               <button
//                 onClick={() => setVisibleCount(visibleCount + 3)}
//                 className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//               >
//                 Ver más
//               </button>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }