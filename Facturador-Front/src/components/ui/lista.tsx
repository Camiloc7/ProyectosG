import React, { useState } from 'react';
import { Search } from 'lucide-react';

type Column<T> = Readonly<{
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}>;

type TableProps<T> = {
  columns: readonly Column<T>[]; // Cambiar a readonly
  data: T[];
  rowsPerPage: number;
};

const Lista = <T,>({ data, columns, rowsPerPage }: TableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
    setSearchQuery(event.target.value);
  };

  // Filtrar los datos según el término de búsqueda
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return data; // Si no hay término de búsqueda, devuelves los datos sin filtrar
    return data.filter((item) => {
      return columns.some((column) => {
        const value = item[column.key];
        return (
          value &&
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    });
  }, [data, searchQuery, columns]);

  // Ordenar los datos
  const sortedData = React.useMemo(() => {
    if (!sortConfig) return filteredData;
    const { key, direction } = sortConfig;
    return [...filteredData].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Calcular la paginación
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Función para eliminar una nota
  // const handleAnular = (id: string) => {
  //   const updatedNotas = data.filter((data) => data.key !== id);
  //   setNotas(updatedNotas);
  // };

  const estilosTitulos =
    'cursor-pointer px-4 py-2 font-medium font-Inter text-[#667085] text-sm ';
  const estilosContenido =
    'px-4 py-2 text-[#6F6F6F] text-sm font-medium font-Inter';

  return (
    <div>
      {/* Barra de búsqueda */}
      <div className="max-w-[468px] h-[50px] mt-4 border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px] ">
        <input
          type="text"
          placeholder="Búscar factura"
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full border-none outline-none"
        />
        <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
      </div>

      {/* Tabla */}
      <table className="w-full bg-white justify-center rounded-[8px] mt-4">
        <thead className="bg-[#FCFCFD] rounded-[8px]">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                onClick={
                  column.sortable ? () => handleSort(column.key) : undefined
                }
                className={`${estilosTitulos} ${
                  column.sortable ? 'cursor-pointer' : ''
                }`}
                style={{ width: `${100 / columns.length}%` }} // Ajuste de ancho de cada columna basado en el número total de columnas
              >
                {column.label}{' '}
                {column.sortable && (
                  <span className="ml-1">
                    {sortConfig?.key === column.key
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : '↑'}{' '}
                    {/* Mostramos la flecha por defecto cuando no está ordenada */}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((item, idx) => (
            <tr key={idx} className="border-b text-center border-[#EAECF0]">
              {columns.map((column) => (
                <td key={String(column.key)} className={estilosContenido}>
                  {column.render
                    ? column.render(item[column.key], item)
                    : String(item[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      <div className="flex justify-between items-center mt-4 w-full">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          className="px-4 py-2 text-sm font-medium rounded-[25px] border border-[#00A7E1] text-[#00A7E1] hover:bg-[#EDEFF3]"
        >
          Anterior
        </button>
        <span className="text-[#6F6F6F] font-medium">
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          className="px-4 py-2 text-sm font-medium rounded-[25px] border border-[#00A7E1] text-[#00A7E1] hover:bg-[#EDEFF3]"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default Lista;
