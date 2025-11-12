'use client';

import OnlyAdminRoute from '@/helpers/OnlyAdminRoute';
import React, { useState } from 'react';
import LayoutDashboard from '@/components/layout/LayoutDashboard';
import initialNotas from '@/app/facturas/facturasFalsas';
import { Search } from 'lucide-react';
import { saveAs } from 'file-saver'; // Librería para la descarga de archivos
import * as XLSX from 'xlsx'; // Librería para Excel
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Esta importación debe ser después de "jspdf"
import SimpleSelect from '@/components/ui/SimpleSelect';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

const tiposDeFactura = [
  'Todos los tipos de facturas',
  'Facturas',
  'Facturas electronicas',
  'Electronica de contingencia',
  'Facturas anuladas',
  'Electronicas de Habilitacion',
];

interface Nota {
  id: string;
  prefijo: string;
  consecutivo: number;
  contrato: string;
  pagada: string;
  factura: string;
  estado: string;
  xml: string;
  enviar: string;
  opciones: string;
  dian: string;
  tipoDeFactura: string;
  nit: string;
}

const columnasIniciales = [
  { key: 'nit', label: 'Nit', visible: true },
  { key: 'prefijo', label: 'Prefijo', visible: true },
  { key: 'consecutivo', label: 'Consecutivo', visible: true },
  { key: 'contrato', label: 'Contrato', visible: true },
  { key: 'pagada', label: 'Pagada', visible: true },
  { key: 'factura', label: 'Factura', visible: true },
  { key: 'estado', label: 'Estado', visible: true },
  { key: 'xml', label: 'XML', visible: true },
  { key: 'enviar', label: 'Enviar', visible: true },
  { key: 'opciones', label: 'Opciones', visible: true },
  { key: 'dian', label: 'DIAN', visible: true },
];

const Facturas = () => {
  const [notas, setNotas] = useState<Nota[]>(
    [...initialNotas].sort((a, b) => b.consecutivo - a.consecutivo) // Ordenar de reciente a antiguo
  );
  const [email, setEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDeVisibiidadVisible, setModalDeVisibiidadVisible] =
    useState(false);
  const [enviarVisible, setEnviarVisible] = useState(false);
  const [subirXmlVisible, setSubirXmlVisible] = useState(false);
  const [tipoDeFacturaFilter, setTipoDeFacturaFilter] = useState<string>(
    tiposDeFactura[0]
  );
  const [columnas, setColumnas] = useState(columnasIniciales);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: '',
    direction: 'asc',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null); // ID de la nota seleccionada

  const notasPorPagina = 10;
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
    setSearchQuery(event.target.value);
  };

  const filteredNotas = notas.filter((nota) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      nota.prefijo.toLowerCase().includes(query) ||
      nota.contrato.toLowerCase().includes(query) ||
      nota.consecutivo.toString().includes(query) ||
      nota.nit.toString().includes(query);

    const matchesTipoDeFactura =
      tipoDeFacturaFilter === 'Todos los tipos de facturas' ||
      nota.tipoDeFactura === tipoDeFacturaFilter;

    return matchesSearch && matchesTipoDeFactura;
  });

  const totalPaginas = Math.ceil(filteredNotas.length / notasPorPagina);
  const indexInicio = (currentPage - 1) * notasPorPagina;
  const indexFinal = indexInicio + notasPorPagina;
  const notasActuales = filteredNotas.slice(indexInicio, indexFinal);

  // Función para ordenar las columnas
  const sortNotas = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sortedNotas = [...notas].sort((a, b) => {
      if (key === 'prefijo' || key === 'consecutivo' || key === 'contrato') {
        if (a[key as keyof Nota] < b[key as keyof Nota])
          return direction === 'asc' ? -1 : 1;
        if (a[key as keyof Nota] > b[key as keyof Nota])
          return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    setNotas(sortedNotas);
    setSortConfig({ key, direction });
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPaginas));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnular = (id: string) => {
    setSelectedId(id);
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setSelectedId(null);
  };

  const handleConfirm = () => {
    setModalVisible(false);
    setSelectedId(null);
  };

  const handleEnviar = (id: string) => {
    setEnviarVisible(true);
  };

  const handleCancelEnviar = () => {
    setEnviarVisible(false);
  };

  const handleAbrirFactura = (id: string) => {};

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Evita que el formulario se recargue
  };

  const handleSubirXml = (id: string) => {
    setSubirXmlVisible(true);
  };

  const handleCopiar = (): void => {
    const datosCopiar =
      `Prefijo    Consecutivo    Contrato    Pagada    Factura    Estado      XML    Enviar    Opciones    DIAN     Nit\n` +
      filteredNotas
        .map(
          (nota) =>
            `${padString(nota.prefijo, 12)}${padString(
              nota.consecutivo.toString(),
              12
            )}${padString(nota.contrato, 16)}${padString(
              nota.pagada,
              8
            )}${padString(nota.factura, 10)}${padString(
              nota.estado,
              12
            )}${padString(nota.xml, 8)}${padString(nota.enviar, 12)}${padString(
              nota.opciones,
              8
            )}${padString(nota.dian, 10)}${padString(nota.nit, 10)}`
        )
        .join('\n');

    navigator.clipboard
      .writeText(datosCopiar)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Error al copiar al portapapeles: ', err);
      });
  };

  // Función para asegurarse de que las cadenas tengan un tamaño fijo (rellena con espacios)
  const padString = (str: string, length: number): string => {
    return str.padEnd(length, ' '); // Rellena con espacios al final para asegurar el tamaño
  };

  // Función para descargar el archivo CSV
  const handleCSV = () => {
    const csvContent =
      `Prefijo,Consecutivo,Contrato,Pagada,Factura,Estado,XML,Enviar,Opciones,DIAN,Nit\n` +
      filteredNotas
        .map(
          (nota) =>
            `${nota.prefijo},${nota.consecutivo},${nota.contrato},${nota.pagada},${nota.factura},${nota.estado},${nota.xml},${nota.enviar},${nota.opciones},${nota.dian},${nota.nit}`
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'Quality Bill Service - Lista de Facturas.csv');
  };

  // Función para descargar el archivo Excel
  const handleExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredNotas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Facturas');
    XLSX.writeFile(wb, 'Quality Bill Service - Lista de Facturas.xlsx');
  };

  // Función para generar el archivo PDF
  const handlePDF = () => {
    const doc = new jsPDF();

    doc.text('Quality Bill Service - Lista de Facturas', 10, 10);
    doc.autoTable({
      head: [
        [
          'Prefijo',
          'Consecutivo',
          'Contrato',
          'Pagada',
          'Factura',
          'Estado',
          'XML',
          'Enviar',
          'Opciones',
          'DIAN',
          'Nit',
        ],
      ],
      body: filteredNotas.map((nota) => [
        nota.prefijo,
        nota.consecutivo,
        nota.contrato,
        nota.pagada,
        nota.factura,
        nota.estado,
        nota.xml,
        nota.enviar,
        nota.opciones,
        nota.dian,
        nota.nit,
      ]),
    });

    doc.save('Quality Bill Service - Lista de Facturas.pdf');
  };

  // Función para abrir la pantalla de impresión
  const handlePrint = () => {
    const doc = new jsPDF();

    doc.text('Quality Bill Service - Lista de Facturas', 10, 10);
    doc.autoTable({
      head: [
        [
          'Prefijo',
          'Consecutivo',
          'Contrato',
          'Pagada',
          'Factura',
          'Estado',
          'XML',
          'Enviar',
          'Opciones',
          'DIAN',
          'Nit',
        ],
      ],
      body: filteredNotas.map((nota) => [
        nota.prefijo,
        nota.consecutivo,
        nota.contrato,
        nota.pagada,
        nota.factura,
        nota.estado,
        nota.xml,
        nota.enviar,
        nota.opciones,
        nota.dian,
        nota.nit,
      ]),
    });

    // Abre la ventana de impresión
    doc.autoPrint();
    doc.output('dataurlnewwindow');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      console.error('No se seleccionó un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
  };

  const toggleColumna = (key: string) => {
    setColumnas((prevColumnas) =>
      prevColumnas.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const estilosTitulos =
    'cursor-pointer px-4 py-2 font-medium font-Inter text-[#667085] text-sm ';
  const estilosContenido =
    'px-4 py-2 text-[#6F6F6F] text-sm font-medium font-Inter';

  const estilosBoton =
    'h-5 w-14 text-xs font-medium font-inter text-[#00A7E1] border:none bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3]';

  const estilosBotonAnular =
    'h-5 w-14 text-xs font-medium font-inter text-[#FFFFFF] bg-[#ffb2b2] rounded-[16px] hover:bg-[#FAD4D4]';

  const estilosBotonesDeAccion =
    'bg-white text-[#00A7E1] text-sm font-semibold px-[16px] py-[6px] w-24 h-8 rounded-[20px] hover:bg-[#EDEFF3] transition-all sm:w-32 ';

  return (
    <OnlyAdminRoute>
      <LayoutDashboard>
        <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-8  w-full overflow-hidden ">
          <div className="max-w-[1300px] w-full">
            {/* Barra de busqueda */}
            <div className="max-w-[468px] h-[50px] border  border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px] ">
              <input
                type="text"
                placeholder="Búscar factura"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full border-none outline-none"
              />
              <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
            </div>

            {/* Tipo de factura */}
            <div className="filter-section w-full sm:w-[60%] md:w-[32.5%]">
              <SimpleSelect
                options={tiposDeFactura}
                width={'100%'}
                value={tipoDeFacturaFilter}
                onChange={(value) => {
                  setTipoDeFacturaFilter(() => value);
                }}
              />
            </div>

            {/* Cartelito de "copiado" */}
            {copied && (
              <div className="absolute top-8 right-4  bg-[#E2F5FF] text-sm font-medium font-Inter text-[#00A7E1] px-4 py-2 rounded-lg shadow-md ">
                ¡Datos copiados al portapapeles!
              </div>
            )}

            {/* Modal de confirmacion de ANULAR*/}
            {modalVisible && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center "
                onClick={handleCancel}
              >
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    ¿Estás seguro de anular esta factura?
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Esta acción no se puede deshacer.
                  </p>
                  <div className="flex justify-end gap-4">
                    <button
                      className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                      onClick={handleCancel}
                    >
                      Cancelar
                    </button>
                    <button
                      className="bg-blueQ text-white h-11  hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]"
                      onClick={handleConfirm}
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de enviar */}
            {enviarVisible && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
                onClick={handleCancelEnviar}
              >
                <div
                  className="bg-white p-6 rounded-lg shadow-lg w-96 "
                  onClick={(e) => e.stopPropagation()} // Evita que el evento cierre el modal al hacer clic dentro de él
                >
                  <h2 className="text-lg font-bold text-gray-800 mb-4  ">
                    Ingresa el correo electrónico
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <input
                      type="email"
                      name="email"
                      placeholder="E-mail"
                      className={`w-full h-10 px-4 border rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 border-[#00A7E1] focus:outline-none shadow-sm`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <div className="flex justify-center gap-4 mt-4">
                      <button
                        type="button"
                        className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                        onClick={handleCancelEnviar}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-blueQ text-white h-11  hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]"
                      >
                        Continuar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal xml */}
            {subirXmlVisible && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
                onClick={() => setSubirXmlVisible(false)}
              >
                <div
                  className="bg-white p-6 rounded-lg shadow-lg w-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    Subir Archivo
                  </h2>
                  <form>
                    <input type="file" onChange={handleFileChange} />

                    <div className="flex justify-center gap-4 mt-4">
                      <button
                        type="button"
                        className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                        onClick={() => setSubirXmlVisible(false)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-blueQ text-white h-11  hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]"
                      >
                        Continuar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {modalDeVisibiidadVisible && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
                onClick={() => setModalDeVisibiidadVisible(false)}
              >
                <div
                  className="bg-white p-6 rounded-lg shadow-lg w-96"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-lg font-bold mb-4">
                    Configurar Visibilidad
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {columnas.map((col) => (
                      <button
                        key={col.key}
                        onClick={() => toggleColumna(col.key)}
                        className={`px-4 py-2 text-sm font-normal rounded-[25px] ${
                          col.visible
                            ? 'bg-blueQ text-white h-11  hover:bg-[#008ec1] '
                            : 'bg-white border border-[#787878] text-[#787878] hover:bg-gray-300'
                        }`}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                      onClick={() => setModalDeVisibiidadVisible(false)}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Botones de accion */}
            <div className="flex flex-wrap items-center gap-4 mt-4 justify-center sm:justify-start">
              <button onClick={handleCopiar} className={estilosBotonesDeAccion}>
                Copiar
              </button>
              <button onClick={handleCSV} className={estilosBotonesDeAccion}>
                CSV
              </button>
              <button onClick={handleExcel} className={estilosBotonesDeAccion}>
                Excel
              </button>
              <button onClick={handlePDF} className={estilosBotonesDeAccion}>
                PDF
              </button>
              <button onClick={handlePrint} className={estilosBotonesDeAccion}>
                Print
              </button>
              <button
                onClick={() => setModalDeVisibiidadVisible(true)}
                className={`${estilosBotonesDeAccion} sm:flex items-center justify-center hidden`}
              >
                Visibilidad
              </button>
            </div>

            {/* Tabla normal */}
            <div className="hidden sm:block rounded-[8px] mt-6 overflow-x-auto">
              <table className="w-full bg-white justify-center rounded-[8px]">
                <thead className="bg-[#FCFCFD] rounded-[8px]">
                  <tr>
                    {columnas
                      .filter((col) => col.visible)
                      .map((col, index) => (
                        <th
                          key={col.key}
                          onClick={() => sortNotas(col.key)}
                          className={`${estilosTitulos} ${
                            col.key === 'prefijo' ? 'rounded-tl-[8px]' : ''
                          } ${index === 0 ? 'pl-10' : ''}`} // Extra padding for the first column
                          role="button"
                        >
                          {col.label}{' '}
                          {sortConfig.key === col.key
                            ? sortConfig.direction === 'asc'
                              ? '↑'
                              : '↓'
                            : '↑'}
                        </th>
                      ))}
                  </tr>
                </thead>

                <tbody>
                  {notasActuales.map((nota) => (
                    <tr
                      key={nota.id}
                      className="border-b text-center border-[#EAECF0]"
                    >
                      {columnas
                        .filter((col) => col.visible)
                        .map((col) => (
                          <td key={col.key} className={estilosContenido}>
                            {col.key === 'factura' ? (
                              <button
                                onClick={() => handleAbrirFactura(nota.id)}
                                className={estilosBoton}
                              >
                                Factura
                              </button>
                            ) : col.key === 'xml' ? (
                              <button
                                onClick={() => handleSubirXml(nota.id)}
                                className={estilosBoton}
                              >
                                Subir
                              </button>
                            ) : col.key === 'enviar' ? (
                              <button
                                onClick={() => handleEnviar(nota.id)}
                                className={estilosBoton}
                              >
                                Enviar
                              </button>
                            ) : col.key === 'opciones' ? (
                              <button
                                onClick={() => handleAnular(nota.id)}
                                className={estilosBotonAnular}
                              >
                                Anular
                              </button>
                            ) : (
                              nota[col.key as keyof Nota]
                            )}
                          </td>
                        ))}
                    </tr>
                  ))}

                  {/* Filas vacías para completar 10 elementos */}
                  {[
                    ...Array(
                      Math.max(0, notasPorPagina - notasActuales.length)
                    ),
                  ].map((_, index) => (
                    <tr
                      key={`empty-${index}`}
                      className="border-b border-[#EAECF0] h-[40px]"
                    >
                      <td
                        colSpan={columnas.filter((col) => col.visible).length}
                        className="bg-white"
                      ></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Slider para pantallas pequeñas */}
            <div className="block sm:hidden mt-8">
              {notasActuales.map((nota) => (
                <div
                  key={nota.id}
                  className="bg-white rounded-lg shadow-sm border p-4 mb-4"
                >
                  <p className="text-sm font-medium">
                    <strong>Prefijo:</strong> {nota.prefijo}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Consecutivo:</strong> {nota.consecutivo}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Contrato:</strong> {nota.contrato}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Pagada:</strong> {nota.pagada}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Estado:</strong> {nota.estado}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>DIAN:</strong> {nota.dian}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Nit:</strong> {nota.nit}
                  </p>
                </div>
              ))}
            </div>

            {/* Controles de paginación */}
            <div className="flex justify-between items-center mt-4 w-full">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 text-sm font-medium rounded-[25px] border border-[#00A7E1] text-[#00A7E1] hover:bg-[#EDEFF3] sm:w-auto w-full mb-2 sm:mb-0 mr-2"
              >
                Anterior
              </button>
              <span className="text-[#6F6F6F] font-medium sm:w-auto w-full text-center mb-2 sm:mb-0">
                Página {currentPage} de {totalPaginas}
              </span>
              <button
                onClick={handleNextPage}
                className="px-4 py-2 text-sm font-medium rounded-[25px] border border-[#00A7E1] text-[#00A7E1] hover:bg-[#EDEFF3] sm:w-auto w-full mb-2 sm:mb-0 ml-2"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </LayoutDashboard>
    </OnlyAdminRoute>
  );
};

export default Facturas;
