'use client';

import PrivateRoute from '@/helpers/PrivateRoute';
import React, { useState } from 'react';
import LayoutDashboard from '@/components/layout/LayoutDashboard';
import initialNotas from '@/app/debito/lista/listaFalsa';
import { Search } from 'lucide-react';
import { saveAs } from 'file-saver'; // Librería para la descarga de archivos
import * as XLSX from 'xlsx'; // Librería para Excel
import { jsPDF } from 'jspdf';
import 'jspdf-autotable'; // Esta importación debe ser después de "jspdf"

declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

interface Nota {
  id: string;
  prefijo: string;
  consecutivo: number;
  fecha: string;
  ver: string;
  anular: string;
  xml: string;
  enviar: string;
  nit: string;
}

const CreditoListaAdmin = () => {
  const [notas, setNotas] = useState<Nota[]>(initialNotas);
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null); // ID de la nota seleccionada
  const [email, setEmail] = useState('');
  const [enviarVisible, setEnviarVisible] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: '',
    direction: 'asc',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const notasPorPagina = 10;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
    setSearchQuery(event.target.value);
  };

  const filteredNotas = notas.filter((nota) => {
    const query = searchQuery.toLowerCase();
    return (
      nota.prefijo.toLowerCase().includes(query) ||
      nota.consecutivo.toString().includes(query) ||
      nota.nit.toString().includes(query) ||
      nota.fecha.toLowerCase().includes(query)
    );
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
      if (
        key === 'prefijo' ||
        key === 'fecha' ||
        key === 'xml' ||
        key === 'enviar'
      ) {
        if (a[key as keyof Nota] < b[key as keyof Nota])
          return direction === 'asc' ? -1 : 1;
        if (a[key as keyof Nota] > b[key as keyof Nota])
          return direction === 'asc' ? 1 : -1;
      } else if (key === 'consecutivo') {
        const aValue = a[key as keyof Nota] as number;
        const bValue = b[key as keyof Nota] as number;
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
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

  // Función para eliminar una nota
  // const handleAnular = (id: string) => {
  //   const updatedNotas = notas.filter((nota) => nota.id !== id);
  //   setNotas(updatedNotas);
  // };

  const handleAnular = (id: string) => {
    setSelectedId(id);
    setModalVisible(true);
  };

  // Funciones para botones
  const handleVer = (id: string) => console.warn(`Ver nota: ${id}`);

  const handleCopiar = (): void => {
    const datosCopiar =
      `Prefijo    Consecutivo    Fecha        Nit\n` +
      filteredNotas
        .map(
          (nota) =>
            `${padString(nota.prefijo, 12)}${padString(
              nota.consecutivo.toString(),
              12
            )}${padString(nota.fecha, 14)}${padString(nota.nit.toString(), 12)}`
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
    setCopied(true);
  };

  // Función para asegurarse de que las cadenas tengan un tamaño fijo (rellena con espacios)
  const padString = (str: string, length: number): string => {
    return str.padEnd(length, ' '); // Rellena con espacios al final para asegurar el tamaño
  };

  // Función para descargar el archivo CSV
  const handleCSV = () => {
    const csvContent =
      `Prefijo,Consecutivo,Fecha,Nit\n` +
      filteredNotas
        .map(
          (nota) =>
            `${nota.prefijo},${nota.consecutivo},${nota.fecha},${nota.nit}`
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
      head: [['Prefijo', 'Consecutivo', 'Fecha', 'Nit']],
      body: filteredNotas.map((nota) => [
        nota.prefijo,
        nota.consecutivo,
        nota.fecha,
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
      head: [['Prefijo', 'Consecutivo', 'Fecha', 'Nit']],
      body: filteredNotas.map((nota) => [
        nota.prefijo,
        nota.consecutivo,
        nota.fecha,
        nota.nit,
      ]),
    });

    // Abre la ventana de impresión
    doc.autoPrint();
    doc.output('dataurlnewwindow');
  };

  const handleEnviar = (id: string) => {
    setEnviarVisible(true);
  };

  const handleCancelEnviar = () => {
    setEnviarVisible(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Evita que el formulario se recargue
    setEnviarVisible(false);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setSelectedId(null);
  };

  const handleConfirm = () => {
    const updatedNotas = notas.filter((nota) => nota.id !== selectedId);
    setNotas(updatedNotas);
    setModalVisible(false);
    setSelectedId(null);
  };

  const estilosBotonAnular =
    'h-5 w-14 text-xs font-medium font-inter text-[#FFFFFF] bg-[#ffb2b2] rounded-[16px] hover:bg-[#FAD4D4]';
  const estilosTitulos =
    'cursor-pointer px-4 py-2 font-medium font-Inter text-[#667085] text-sm ';
  const estilosContenido =
    'px-4 py-2 text-[#6F6F6F] text-sm font-medium font-Inter';
  const estilosBoton =
    'px-2 py-1 text-sm font-medium font-Inter text-[#00A7E1] border:none bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3]';
  const estilosBotonesDeAccion =
    'bg-white text-[#00A7E1] text-sm font-semibold px-[16px] py-[6px] w-24 h-8 rounded-[20px] hover:bg-[#EDEFF3] transition-all sm:w-32 ';

  return (
    <PrivateRoute>
      <LayoutDashboard>
        <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-12 w-full overflow-hidden ">
          <div className="max-w-[1300px] w-full">
            <h1 className="font-montserrat font-bold text-[#6F6F6F] text-2xl sm:text-xl md:text-lg text-center md:text-left lg:text-[24px] lg:leading-[29.26px]">
              Lista de Notas Credito del Administrador - QUALITY SOFT SERVICE
              SAS
            </h1>

            {/* Barra de busqueda */}
            <div className="max-w-[468px] h-[50px] border mt-5 border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px] ">
              <input
                type="text"
                placeholder="Búscar factura"
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full border-none outline-none"
              />
              <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
            </div>

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
            </div>

            {/* Cartelito de "copiado" */}
            {copied && (
              <div className="absolute top-8 right-4  bg-[#E2F5FF] text-sm font-medium font-Inter text-[#00A7E1] px-4 py-2 rounded-lg shadow-md ">
                ¡Datos copiados al portapapeles!
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

            {/* Tabla normal */}
            <div className="hidden sm:block rounded-[8px] mt-6 overflow-x-auto">
              <table className="w-full bg-white justify-center rounded-[8px]">
                <thead className="bg-[#FCFCFD] rounded-[8px]">
                  <tr>
                    <th
                      onClick={() => sortNotas('prefijo')}
                      className={`${estilosTitulos} min-w-[120px] rounded-tl-[8px]`}
                      role="button"
                    >
                      Prefijo{' '}
                      {sortConfig.key === 'prefijo'
                        ? sortConfig.direction === 'asc'
                          ? '↑'
                          : '↓'
                        : '↑'}
                    </th>
                    <th
                      onClick={() => sortNotas('consecutivo')}
                      className={`${estilosTitulos} min-w-[120px]`}
                      role="button"
                    >
                      Consecutivo{' '}
                      {sortConfig.key === 'consecutivo'
                        ? sortConfig.direction === 'asc'
                          ? '↑'
                          : '↓'
                        : '↑'}
                    </th>
                    <th
                      onClick={() => sortNotas('fecha')}
                      className={`${estilosTitulos} min-w-[120px]`}
                    >
                      Fecha{' '}
                      {sortConfig.key === 'fecha'
                        ? sortConfig.direction === 'asc'
                          ? '↑'
                          : '↓'
                        : '↑'}
                    </th>
                    <th className={`${estilosTitulos} min-w-[100px]`}>Ver</th>
                    <th className={`${estilosTitulos} min-w-[100px]`}>
                      Anular
                    </th>
                    <th className={`${estilosTitulos} min-w-[100px]`}>XML</th>
                    <th
                      className={`${estilosTitulos} min-w-[100px] rounded-tr-[8px]`}
                    >
                      Enviar
                    </th>
                    <th className={`${estilosTitulos} rounded-tr-[8px]`}>
                      Nit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notasActuales.map((nota) => (
                    <tr
                      key={nota.id}
                      className="border-b text-center border-[#EAECF0]"
                    >
                      <td className={estilosContenido}>{nota.prefijo}</td>
                      <td className={estilosContenido}>{nota.consecutivo}</td>
                      <td className={estilosContenido}>{nota.fecha}</td>
                      <td>
                        <button
                          onClick={() => handleVer(nota.id)}
                          className={estilosBoton}
                        >
                          Ver
                        </button>
                      </td>
                      <td className="px-4 py-2 text-red-500 cursor-pointer">
                        <button
                          onClick={() => handleAnular(nota.id)}
                          className={estilosBotonAnular}
                        >
                          Anular
                        </button>
                      </td>
                      <td className={estilosContenido}>{nota.xml}</td>
                      <td>
                        <button
                          onClick={() => handleEnviar(nota.id)}
                          className={estilosBoton}
                        >
                          Enviar
                        </button>
                      </td>
                      <td className={estilosContenido}>{nota.nit}</td>
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
                      <td colSpan={7} className="bg-white"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Slider para pantallas pequeñas */}
            <div className="block sm:hidden mt-8 justify-items-center">
              <div className="whitespace-nowrap flex flex-col gap-4">
                {notasActuales.map((nota) => (
                  <div
                    key={nota.id}
                    className="bg-white rounded-lg shadow-sm border border-[#EAECF0] p-4 min-w-[300px]"
                  >
                    <p className="text-[#6F6F6F] font-medium">
                      Prefijo: {nota.prefijo}
                    </p>
                    <p className="text-[#6F6F6F] font-medium">
                      Consecutivo: {nota.consecutivo}
                    </p>
                    <p className="text-[#6F6F6F] font-medium">
                      Fecha: {nota.fecha}
                    </p>
                    <p className="text-[#6F6F6F] font-medium">
                      Nit: {nota.nit}
                    </p>
                    <div className="flex justify-between mt-4">
                      <button
                        onClick={() => handleVer(nota.id)}
                        className={estilosBoton}
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleEnviar(nota.id)}
                        className={estilosBoton}
                      >
                        Enviar
                      </button>
                    </div>
                    <button
                      onClick={() => handleAnular(nota.id)}
                      className="mt-4 text-red-500 font-medium"
                    >
                      Anular
                    </button>
                  </div>
                ))}
              </div>
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
    </PrivateRoute>
  );
};

export default CreditoListaAdmin;
