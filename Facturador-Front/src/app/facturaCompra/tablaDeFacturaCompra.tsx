import React, { useState } from 'react';

interface Item {
  descripcion: string;
  referencia: string;
  valor: number;
  unidadDeMedida: string;
  cargos: number;
  descuentos: number;
  iva: number;
  retefuente: number;
  retelca: number;
}

interface SortOrder {
  field: keyof Item;
  direction: 'asc' | 'desc';
}

interface TablaDeItemsProps {
  items: Item[];
  onItemsChange: (items: Item[]) => void;
  allowEdit?: boolean;
}

const TablaDeItems: React.FC<TablaDeItemsProps> = ({
  items,
  onItemsChange,
  allowEdit = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>({
    field: 'descripcion',
    direction: 'asc',
  });

  const handleSort = (field: keyof Item) => {
    const newDirection =
      sortOrder.field === field && sortOrder.direction === 'asc'
        ? 'desc'
        : 'asc';

    const sortedItems = [...items].sort((a, b) => {
      const valueA = a[field];
      const valueB = b[field];

      if (['descripcion', 'referencia', 'unidadDeMedida'].includes(field)) {
        // Comparar alfabéticamente si es un campo de texto
        return newDirection === 'asc'
          ? (valueA as string).localeCompare(valueB as string)
          : (valueB as string).localeCompare(valueA as string);
      } else if (!isNaN(Number(valueA)) && !isNaN(Number(valueB))) {
        // Comparar numéricamente si ambos valores son numéricos
        return newDirection === 'asc'
          ? Number(valueA) - Number(valueB)
          : Number(valueB) - Number(valueA);
      }
      return 0;
    });

    setSortOrder({ field, direction: newDirection });
    onItemsChange(sortedItems);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
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

  const filteredItems = items.filter((item) =>
    item.descripcion.toLowerCase().includes(searchQuery)
  );

  return (
    <div className="mt-12">
      <input
        type="text"
        placeholder="Buscar por descripción..."        
        className="sm:w-[48%] w-full h-10 px-4 border border-[#00A7E1] rounded-[25px] text-[#00A7E1] text-sm focus:ring-blue-300 focus:outline-none shadow-sm"
        value={searchQuery}
        onChange={handleSearch}
      />

      <div className="border w-auto border-[#00A7E1] rounded-[25px] mt-4 overflow-x-auto">
        <table className="border-collapse w-full rounded-lg overflow-hidden">
          <thead className="border-b border-[#00A7E1] text-sm text-[#565656] font-medium md:text-sm lg:text-xs xl:text-xs 2xl:text-xs">
            <tr>
              <th className="text-center w-[12%] m-0 p-1 pt-2 pb-2">
                Descripción
                <button
                  onClick={() => handleSort("descripcion")}
                  className="ml-1"
                >
                  {sortOrder.field === 'descripcion' &&
                  sortOrder.direction === 'asc'
                    ? '↑'
                    : '↓'}
                </button>
              </th>
              <th className="text-center w-[12%] m-0 p-1 pt-2 pb-2">
                Referencia
                <button
                  onClick={() => handleSort("referencia")}
                  className="ml-1"
                >
                  {sortOrder.field === 'referencia' &&
                  sortOrder.direction === 'asc'
                    ? '↑'
                    : '↓'}
                </button>
              </th>
              <th className="text-center w-[8%] m-0 p-1 pt-2 pb-2">
                Valor
                <button onClick={() => handleSort("valor")} className="ml-1">
                  {sortOrder.field === "valor" && sortOrder.direction === "asc"
                    ? "↑"
                    : "↓"}
                </button>
              </th>
              <th className="text-center w-[16%] m-0 p-1 pt-2 pb-2">
                Unidad de medida
                <button
                  onClick={() => handleSort("unidadDeMedida")}
                  className="ml-1"
                >
                  {sortOrder.field === 'unidadDeMedida' &&
                  sortOrder.direction === 'asc'
                    ? '↑'
                    : '↓'}
                </button>
              </th>
              <th className="text-center w-[9%] m-0 p-1 pt-2 pb-2">
                Cargos
                <button onClick={() => handleSort("cargos")} className="ml-1">
                  {sortOrder.field === "cargos" && sortOrder.direction === "asc"
                    ? "↑"
                    : "↓"}
                </button>
              </th>
              <th className="text-center w-[11%] m-0 p-1 pt-2 pb-2">
                Descuentos
                <button
                  onClick={() => handleSort("descuentos")}
                  className="ml-1"
                >
                  {sortOrder.field === 'descuentos' &&
                  sortOrder.direction === 'asc'
                    ? '↑'
                    : '↓'}
                </button>
              </th>
              <th className="text-center w-[6%] m-0 p-1 pt-2 pb-2">
                IVA
                <button onClick={() => handleSort("iva")} className="ml-1">
                  {sortOrder.field === "iva" && sortOrder.direction === "asc"
                    ? "↑"
                    : "↓"}
                </button>
              </th>
              <th className="text-center w-[11%] m-0 p-1 pt-2 pb-2">
                Retefuente
                <button
                  onClick={() => handleSort("retefuente")}
                  className="ml-1"
                >
                  {sortOrder.field === 'retefuente' &&
                  sortOrder.direction === 'asc'
                    ? '↑'
                    : '↓'}
                </button>
              </th>
              <th className="text-center w-[9%] m-0 p-1 pt-2 pb-2">
                Retelca
                <button onClick={() => handleSort("retelca")} className="ml-1">
                  {sortOrder.field === "retelca" &&
                  sortOrder.direction === "asc"
                    ? "↑"
                    : "↓"}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <tr key={index} className="border-b border-[#00A7E1]">
                  <td className="p-2 text-center">
                    <input
                      type="text"
                      value={item.descripcion}
                      className="w-full p-1 text-[#6F6F6F] text-center text-base focus:outline-none"
                      onChange={(e) =>
                        handleEdit(index, "descripcion", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="text"
                      value={item.referencia}
                      className="w-full p-1 text-[#6F6F6F] text-center focus:outline-none"
                      onChange={(e) =>
                        handleEdit(index, "referencia", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="number"
                      value={item.valor}
                      className="w-full p-1 text-[#6F6F6F] text-center focus:outline-none"
                      onChange={(e) =>
                        handleEdit(index, "valor", parseFloat(e.target.value))
                      }
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="text"
                      value={item.unidadDeMedida}
                      className="w-full p-1 text-[#6F6F6F] text-center focus:outline-none"
                      onChange={(e) =>
                        handleEdit(index, "unidadDeMedida", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="text"
                      value={item.cargos}
                      className="w-full p-1 text-[#6F6F6F] text-center focus:outline-none"
                      onChange={(e) =>
                        handleEdit(index, "cargos", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="text"
                      value={item.descuentos}
                      className="w-full p-1 text-[#6F6F6F] text-center focus:outline-none"
                      onChange={(e) =>
                        handleEdit(index, "descuentos", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="text"
                      value={item.iva}
                      className="w-full p-1 text-[#6F6F6F] text-center focus:outline-none"
                      onChange={(e) => handleEdit(index, "iva", e.target.value)}
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="text"
                      value={item.retefuente}
                      className="w-full p-1 text-[#6F6F6F] text-center focus:outline-none"
                      onChange={(e) =>
                        handleEdit(index, "retefuente", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2 text-center">
                    <input
                      type="text"
                      value={item.retelca}
                      className="w-full p-1 text-[#6F6F6F] text-center focus:outline-none"
                      onChange={(e) =>
                        handleEdit(index, "retelca", e.target.value)
                      }
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="text-center text-gray-500 p-10">
                  No hay datos disponibles
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaDeItems;
