import React, { useState } from 'react';

interface Item {
  descripcion: string;
  cantidad: number;
  valorUnitario: number;
  porcentajeIva: number;
}

interface SortOrder {
  field: keyof Item;
  direction: 'asc' | 'desc';
}

interface TablaDeOrdenamientoProps {
  items: Item[];
  onItemsChange: (items: Item[]) => void;
  onAddItem?: () => void;
  allowEdit?: boolean;
}

const ITEMS_PER_PAGE = 8;

const TablaDeOrdenamiento: React.FC<TablaDeOrdenamientoProps> = ({
  items,
  onItemsChange,
  onAddItem,
  allowEdit = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    field: 'descripcion',
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const handleSort = (field: keyof Item) => {
    const newDirection =
      sortOrder.field === field && sortOrder.direction === 'asc'
        ? 'desc'
        : 'asc';

    const sortedItems = [...items].sort((a, b) => {
      if (field === 'descripcion') {
        return newDirection === 'asc'
          ? a.descripcion.localeCompare(b.descripcion)
          : b.descripcion.localeCompare(a.descripcion);
      } else {
        return newDirection === 'asc'
          ? a[field] - b[field]
          : b[field] - a[field];
      }
    });

    setSortOrder({ field, direction: newDirection });
    onItemsChange(sortedItems);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
    setCurrentPage(1); // Reset to first page on search
  };

  const handleEdit = (
    index: number,
    field: keyof Item,
    value: string | number
  ) => {
    const updatedItems = items.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    onItemsChange(updatedItems);
  };

  const handleRemove = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    onItemsChange(updatedItems);
  };

  const filteredItems = items.filter((item) =>
    (item.descripcion ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="mt-8">
      {/* Search Bar */}
      <input
        type="text"
        placeholder="Buscar por descripción..."
        className="w-full md:w-[40%] h-10 px-4 border border-[#00A7E1] rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 focus:outline-none shadow-sm"
        value={searchQuery}
        onChange={handleSearch}
      />

      {/* Tabla */}
      <div className="border border-[#00A7E1] rounded-[25px] mt-6 overflow-x-auto">
        <table className="border-collapse w-full rounded-lg overflow-hidden">
          <thead className="border-b border-[#00A7E1]">
            <tr>
              <th className="p-3 text-center text-xs md:text-base">
                Descripción
              </th>
              <th className="p-3 text-center text-xs md:text-base">Cantidad</th>
              <th className="p-3 text-center text-xs md:text-base">
                Valor Unitario
              </th>
              <th className="p-3 text-center text-xs md:text-base"></th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length > 0 ? (
              paginatedItems.map((item, index) => (
                <tr key={index}>
                  <td className="p-3 text-center text-xs md:text-base">
                    {item.descripcion}
                  </td>
                  <td className="p-3 text-center text-xs md:text-base">
                    {item.cantidad}
                  </td>
                  <td className="p-3 text-center text-xs md:text-base">
                    {item.valorUnitario}
                  </td>
                  <td className="text-center">
                    <button
                      className="text-red-500 text-sm md:text-base px-2 py-1 rounded"
                      onClick={() => handleRemove(index)}
                    >
                      X
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="text-center p-6 text-xs md:text-base text-[#565656]"
                >
                  No hay datos disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 px-4 sm:px-0">
        <span className="text-xs sm:text-sm">
          Página {currentPage} de {totalPages}
        </span>
        <div className="flex space-x-2 mt-2 sm:mt-0 justify-center sm:justify-end">
          <button
            className="bg-[#00A7E1] font-bold text-white h-8 px-4 text-xs rounded-full hover:bg-[#008ec1]"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <button
            className="bg-[#00A7E1] font-bold text-white h-8 px-4 text-xs rounded-full hover:bg-[#008ec1]"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default TablaDeOrdenamiento;
