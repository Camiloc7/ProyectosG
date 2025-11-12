'use client';
import Spinner from '@/components/feedback/Spinner';
import React, { useState, useEffect } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import 'jspdf-autotable';
import PrivateRoute from '@/helpers/PrivateRoute';
import FormResoluciones from '@/features/resoluciones/formResoluciones';
import { IResolucion, useResolucionesStore } from '@/store/ResolucionesStore';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import ReactDOM from 'react-dom';
import { Search } from 'lucide-react';
import CheckboxUI from '@/components/ui/CheckBoxUI';

const columnasIniciales = [
  { key: 'NOMBRE', label: 'Nombre', visible: true },
  { key: 'NIT', label: 'NIT', visible: true },
  { key: 'NUMERO', label: 'Número Resolución', visible: true },
  { key: 'LLAVE', label: 'Llave', visible: true },
  { key: 'ADJUNTO', label: 'Adjunto', visible: true },
  { key: 'CONTEO', label: 'Conteo', visible: true },
  { key: 'FECHA', label: 'Fecha', visible: true },
  { key: 'FECHA_INICIO', label: 'Fecha Inicio', visible: true },
  { key: 'FECHA_FIN', label: 'Fecha Fin', visible: true },
  { key: 'PREFIJO', label: 'Prefijo', visible: true },
  { key: 'DESDE', label: 'Desde', visible: true },
  { key: 'HASTA', label: 'Hasta', visible: true },
  { key: 'TIPO', label: 'Tipo', visible: true },
  { key: 'API', label: 'API', visible: true },
  { key: 'ACTIVO', label: 'Activo', visible: true },
  { key: 'establecimiento_id', label: 'Establecimiento', visible: true },
];

const TooltipPortal: React.FC<{ text: string; x: number; y: number }> = ({
  text,
  x,
  y,
}) => {
  return ReactDOM.createPortal(
    <div
      className="bg-gray-800 text-white text-xs rounded py-1 px-2 shadow-lg"
      style={{
        position: 'fixed',
        top: y,
        left: x,
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      {text}
    </div>,
    document.body
  );
};

const Resoluciones = () => {
  const { fetchTodasLasResoluciones, resoluciones, loading } =
    useResolucionesStore();

  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [tooltipText, setTooltipText] = useState<string>('');
  const [notas, setNotas] = useState<IResolucion[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditarOpen, setIsEditarOpen] = useState(false);
  const [columnas, setColumnas] = useState(columnasIniciales);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: '',
    direction: 'asc',
  });
  const [searchQuery, setSearchQuery] = useState('');

  const notasPorPagina = 10;

  useEffect(() => {
    handleFetch();
  }, []);

  useEffect(() => {
    if (resoluciones) {
      const formatted = resoluciones.map((r) => ({
        ...r,
        FECHA: formatFecha(r.FECHA),
        FECHA_INICIO: formatFecha(r.FECHA_INICIO),
        FECHA_FIN: formatFecha(r.FECHA_FIN),
      }));
      setNotas(formatted);
    }
  }, [resoluciones]);

  const handleFetch = async () => {
    await fetchTodasLasResoluciones();
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return '';
    const partes = fecha.includes('/') ? fecha.split('/') : fecha.split('-');
    if (partes.length !== 3) return fecha;
    let [a, b, c] = partes;
    if (a.length === 4)
      return `${c.padStart(2, '0')}/${b.padStart(2, '0')}/${a}`;
    return `${a.padStart(2, '0')}/${b.padStart(2, '0')}/${c}`;
  };

  // Filtrado por búsqueda
  const filteredNotas = notas.filter((nota) =>
    Object.values(nota).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Ordenamiento
  const sortNotas = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc')
      direction = 'desc';

    setSortConfig({ key, direction });

    const sorted = [...notas].sort((a, b) => {
      const aVal = String(a[key as keyof IResolucion] || '');
      const bVal = String(b[key as keyof IResolucion] || '');
      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setNotas(sorted);
  };

  // Paginación
  const totalPaginas = Math.ceil(filteredNotas.length / notasPorPagina);
  const indexInicio = (currentPage - 1) * notasPorPagina;
  const notasActuales = filteredNotas.slice(
    indexInicio,
    indexInicio + notasPorPagina
  );

  const handleNextPage = () =>
    setCurrentPage((prev) => Math.min(prev + 1, totalPaginas));

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-8 w-full overflow-hidden">
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Barra de búsqueda */}
              <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar resolución"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} // <-- Aquí actualizamos el estado
                  className="w-full border-none outline-none"
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
              </div>
              {/* H1 Lista de facturas */}
              <h1
                onClick={handleFetch}
                className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none"
              >
                Resoluciones
              </h1>
            </div>

            {/* TABLA */}
            <div className="overflow-x-auto relative mt-6">
              <table className="min-w-full border-collapse bg-white rounded-lg overflow-hidden">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {columnas
                      .filter((col) => col.visible)
                      .map((col) => (
                        <th
                          key={col.key}
                          onClick={() => sortNotas(col.key)}
                          className="px-4 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer select-none"
                        >
                          <div className="flex items-center space-x-1">
                            <span>{col.label}</span>
                            {sortConfig.key === col.key && (
                              <span>
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {notasActuales.map((nota) => (
                    <tr
                      key={nota.ID}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      {columnas
                        .filter((col) => col.visible)
                        .map((col) => {
                          const esCopiable =
                            col.key === 'LLAVE' || col.key === 'NOMBRE';

                          // Columnas con checkbox
                          if (col.key === 'API' || col.key === 'ACTIVO') {
                            const checked =
                              nota[col.key as keyof IResolucion] === '1';
                            return (
                              <td
                                key={col.key}
                                className="px-4 py-2 text-center items-center"
                              >
                                <CheckboxUI
                                  checked={checked}
                                  onChange={() =>
                                    showTemporaryToast('Boton en desarrollo')
                                  }
                                />
                              </td>
                            );
                          }

                          let valor = nota[col.key as keyof IResolucion];
                          // Conversión para otras columnas binarios
                          if (col.key === 'ADJUNTO' || col.key === 'ACTIVO') {
                            valor = valor === '1' ? 'Sí' : 'No';
                          }

                          return (
                            <td
                              key={col.key}
                              className={`px-4 py-2 text-sm text-gray-700 max-w-[150px] truncate relative ${
                                esCopiable ? 'cursor-pointer' : ''
                              }`}
                              onClick={
                                esCopiable
                                  ? () => {
                                      navigator.clipboard.writeText(
                                        String(valor)
                                      );
                                      showTemporaryToast(
                                        `${col.label} copiado al portapapeles`
                                      );
                                    }
                                  : undefined
                              }
                              onMouseEnter={(e) => {
                                if (!esCopiable) return;
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                setTooltipPos({
                                  x: rect.left + rect.width / 2,
                                  y: rect.top - 30,
                                });
                                setTooltipText(String(valor));
                              }}
                              onMouseLeave={() => setTooltipPos(null)}
                            >
                              {valor}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAGINACION */}
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

            <FormResoluciones
              isOpen={isEditarOpen}
              onClose={() => setIsEditarOpen(false)}
            />
          </div>

          {loading && <Spinner />}

          {/* TOOLTIP PORTAL */}
          {tooltipPos && (
            <TooltipPortal
              text={tooltipText}
              x={tooltipPos.x}
              y={tooltipPos.y}
            />
          )}
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default Resoluciones;
