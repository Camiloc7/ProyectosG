'use client';
import React, { useState } from 'react';
import LayoutDashboard from '@/components/layout/LayoutDashboard';
import initialNotas from '@/app/debito/lista/listaFalsa';
import { Search } from 'lucide-react';
import BotonAnular from '@/components/ui/page';
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

const DebitoListaAdmin = () => {
  const [notas, setNotas] = useState<Nota[]>(initialNotas);
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
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
  const handleAnular = (id: string) => {
    const updatedNotas = notas.filter((nota) => nota.id !== id);
    setNotas(updatedNotas);
  };

  // Funciones para botones
  const handleVer = (id: string) => console.warn(`Ver nota: ${id}`);
  const handleEnviar = (id: string) => console.warn(`Enviar nota: ${id}`);

  // Ordenar notas según la configuración
  const sortedNotas = [...notas].sort((a, b) => {
    if (sortConfig.key === 'prefijo') {
      return sortConfig.direction === 'asc'
        ? a.prefijo.localeCompare(b.prefijo)
        : b.prefijo.localeCompare(a.prefijo);
    }
    if (sortConfig.key === 'fecha') {
      return sortConfig.direction === 'asc'
        ? new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
        : new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
    }
    if (sortConfig.key === 'consecutivo') {
      return sortConfig.direction === 'asc'
        ? a.consecutivo - b.consecutivo
        : b.consecutivo - a.consecutivo;
    }
    return 0;
  });

  const estilosTitulos =
    'cursor-pointer px-4 py-2 font-medium font-Inter text-[#667085] text-sm ';
  const estilosContenido =
    'px-4 py-2 text-[#6F6F6F] text-sm font-medium font-Inter';
  const estilosBoton =
    'px-2 py-1 text-sm font-medium font-Inter text-[#00A7E1] border:none bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3]';

  return (
    <LayoutDashboard>
      <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-12 w-full overflow-hidden ">
        <div className="max-w-[1300px] w-full">
          <h1 className="font-montserrat font-bold text-[#6F6F6F] text-2xl sm:text-xl md:text-lg text-center md:text-left lg:text-[24px] lg:leading-[29.26px]">
            Lista de Notas de Debito del Administrador - QUALITY SOFT SERVICE
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
                  <th className={`${estilosTitulos} min-w-[100px]`}>Anular</th>
                  <th className={`${estilosTitulos} min-w-[100px]`}>XML</th>
                  <th
                    className={`${estilosTitulos} min-w-[100px] rounded-tr-[8px]`}
                  >
                    Enviar
                  </th>
                  <th className={`${estilosTitulos} rounded-tr-[8px]`}>Nit</th>
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
                      <BotonAnular id={nota.id} />
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
                  ...Array(Math.max(0, notasPorPagina - notasActuales.length)),
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
                  <p className="text-[#6F6F6F] font-medium">Nit: {nota.nit}</p>
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
                  <BotonAnular id={nota.id} />
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
  );
};

export default DebitoListaAdmin;
