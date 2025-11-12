'use client';
import { useEffect, useState, useMemo } from 'react';
import { useMovementStore } from '@/store/Inventario/useMovementStore';
import { useProductStore } from '@/store/Inventario/useProductStore';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import ModalCrearMovimiento from '@/features/Inventarios/CrearMovimiento';
import type { Movement } from '@/types/inventory';
import { useLocationStore } from '@/store/Inventario/useLocationsStore';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { Search } from 'lucide-react';
interface TableColumn {
  key:
    | keyof Movement
    | 'product_name'
    | 'from_location_name'
    | 'to_location_name'
    | 'formatted_date'
    | 'quantity_display'; // Añadido quantity_display
  label: string;
  visible: boolean;
}
interface SortConfig {
  key:
    | keyof Movement
    | 'product_name'
    | 'from_location_name'
    | 'to_location_name'
    | 'formatted_date'
    | 'quantity_display'
    | null;
  direction: 'asc' | 'desc';
}
export default function MovimientosPage() {
  const { movements, fetchMovements, isLoading, error } = useMovementStore();
  const {
    products,
    fetchProducts,
    isLoading: isLoadingProducts,
  } = useProductStore();
  const {
    locations,
    fetchLocations,
    isLoading: isLoadingLocations,
  } = useLocationStore();
  const [isCreateMovementModalOpen, setIsCreateMovementModalOpen] =
    useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMovementType, setFilterMovementType] = useState<string>('');
  const [filterProductId, setFilterProductId] = useState<string>('');
  const [filterLocationId, setFilterLocationId] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'formatted_date',
    direction: 'desc',
  });
  useEffect(() => {
    fetchMovements();
    fetchProducts();
    fetchLocations();
  }, [fetchMovements, fetchProducts, fetchLocations]);
  const productOptions = useMemo(() => {
    const options = products.map((prod) => ({
      value: prod.id,
      label: `${prod.name} (${prod.sku})`,
    }));
    return [{ value: '', label: 'Todos los Productos' }, ...options];
  }, [products]);

  const locationOptions = useMemo(() => {
    const options = locations.map((loc) => ({
      value: loc.id,
      label: loc.name,
    }));
    return [{ value: '', label: 'Todas las Ubicaciones' }, ...options];
  }, [locations]);
  const movementTypeOptions = useMemo(
    () => [
      { value: '', label: 'Todos los Tipos' },
      { value: 'reception', label: 'Recepción' },
      { value: 'dispatch', label: 'Despacho' },
      { value: 'transfer', label: 'Transferencia' },
      { value: 'adjustment_positive', label: 'Ajuste Positivo' },
      { value: 'adjustment_negative', label: 'Ajuste Negativo' },
    ],
    []
  );
  const columnasMovimientos: TableColumn[] = useMemo(
    () => [
      { key: 'movement_type', label: 'Tipo', visible: true },
      { key: 'product_name', label: 'Producto', visible: true },
      { key: 'quantity_display', label: 'Cantidad', visible: true },
      { key: 'from_location_name', label: 'Origen', visible: true },
      { key: 'to_location_name', label: 'Destino', visible: true },
      { key: 'formatted_date', label: 'Fecha', visible: true },
      { key: 'notes', label: 'Notas', visible: true },
    ],
    []
  );
  const sortMovements = (key: SortConfig['key']) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  const filteredAndSortedMovements: (Movement & {
    product_name?: string;
    from_location_name?: string;
    to_location_name?: string;
    formatted_date?: string;
    quantity_display?: string;
  })[] = useMemo(() => {
    let currentMovements: (Movement & {
      product_name?: string;
      from_location_name?: string;
      to_location_name?: string;
      formatted_date?: string;
      quantity_display?: string;
    })[] = movements.map((mov) => ({
      ...mov,
      product_name: mov.product?.name || 'N/A',
      from_location_name: mov.fromLocation?.name || 'N/A',
      to_location_name: mov.toLocation?.name || 'N/A',
      formatted_date: mov.movement_date
        ? new Date(mov.movement_date).toLocaleDateString()
        : 'N/A',
      quantity_display: Number(mov.quantity).toFixed(0),
    }));
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const searchTermsArray = lowerCaseSearchTerm
        .split(' ')
        .filter((term) => term.length > 0);

      currentMovements = currentMovements.filter((mov) => {
        return searchTermsArray.every(
          (term) =>
            (mov.notes?.toLowerCase() || '').includes(term) ||
            mov.movement_type.toLowerCase().includes(term) ||
            (mov.product_name?.toLowerCase() || '').includes(term) ||
            (mov.product?.sku?.toLowerCase() || '').includes(term) ||
            (mov.from_location_name?.toLowerCase() || '').includes(term) ||
            (mov.to_location_name?.toLowerCase() || '').includes(term)
        );
      });
    }
    if (filterMovementType) {
      currentMovements = currentMovements.filter(
        (mov) => mov.movement_type === filterMovementType
      );
    }
    if (filterProductId) {
      currentMovements = currentMovements.filter(
        (mov) => mov.product_id === filterProductId
      );
    }
    if (filterLocationId) {
      currentMovements = currentMovements.filter(
        (mov) =>
          mov.from_location_id === filterLocationId ||
          mov.to_location_id === filterLocationId
      );
    }
    if (sortConfig.key) {
      currentMovements.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        const sortKey = sortConfig.key;
        if (sortKey === 'product_name') {
          aValue = a.product_name;
          bValue = b.product_name;
        } else if (sortKey === 'from_location_name') {
          aValue = a.from_location_name;
          bValue = b.from_location_name;
        } else if (sortKey === 'to_location_name') {
          aValue = a.to_location_name;
          bValue = b.to_location_name;
        } else if (sortKey === 'formatted_date') {
          aValue = new Date(a.movement_date).getTime();
          bValue = new Date(b.movement_date).getTime();
        } else if (sortKey === 'quantity_display') {
          aValue = a.quantity;
          bValue = b.quantity;
        } else {
          aValue = a[sortKey as keyof Movement];
          bValue = b[sortKey as keyof Movement];
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return currentMovements;
  }, [
    movements,
    searchTerm,
    filterMovementType,
    filterProductId,
    filterLocationId,
    sortConfig,
  ]);

  const totalPages: number = Math.ceil(
    filteredAndSortedMovements.length / itemsPerPage
  );
  const indexOfLastItem: number = currentPage * itemsPerPage;
  const indexOfFirstItem: number = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAndSortedMovements.slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handleMovementCreated = (newMovement: Movement) => {
    setCurrentPage(1);
    setSearchTerm('');
    setFilterMovementType('');
    setFilterProductId('');
    setFilterLocationId('');
  };

  const estilosTitulos: string =
    'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter';

  if (isLoading)
    return (
      <LayoutAdmi>
        <div className="p-6 text-center">Cargando movimientos...</div>
      </LayoutAdmi>
    );
  if (error)
    return (
      <LayoutAdmi>
        <div className="p-6 text-center text-red-600">Error: {error}</div>
      </LayoutAdmi>
    );

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="p-6 max-w-full mx-auto min-h-screen">
          <div className="w-full mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar por notas, tipo, producto..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full border-none outline-none font-inter"
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
              </div>
              <h1 className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none">
                Movimientos de Inventario
              </h1>
              <button
                onClick={() => setIsCreateMovementModalOpen(true)}
                className=" ml-auto bg-[#00A7E1] font-bold text-white h-8 px-14 text-xs rounded-full hover:bg-[#008ec1]"
              >
                + Registrar Movimiento
              </button>
            </div>
          </div>
          <div className="mb-6 flex flex-wrap gap-6 items-center justify-center lg:justify-start">
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] relative">
              <label className="text-gray-700 font-inter font-medium block mb-2">
                Filtrar por Tipo
              </label>
              <div>
                <SimpleSelect
                  options={movementTypeOptions}
                  width={'100%'}
                  value={filterMovementType}
                  onChange={(value) => {
                    setFilterMovementType(value);
                    setCurrentPage(1);
                  }}
                  placeholder="Seleccione un Tipo de Movimiento"
                />
              </div>
            </div>
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] relative">
              <label className="text-gray-700 font-inter font-medium block mb-2">
                Filtrar por Producto
              </label>
              <div>
                {isLoadingProducts ? (
                  <div className="text-gray-500 font-inter py-2">
                    Cargando productos...
                  </div>
                ) : (
                  <SimpleSelect
                    options={productOptions}
                    width={'100%'}
                    value={filterProductId}
                    onChange={(value) => {
                      setFilterProductId(value);
                      setCurrentPage(1);
                    }}
                    placeholder="Seleccione un Producto"
                  />
                )}
              </div>
            </div>
            <div className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)] relative">
              <label className="text-gray-700 font-inter font-medium block mb-2">
                Filtrar por Ubicación
              </label>
              <div>
                {isLoadingLocations ? (
                  <div className="text-gray-500 font-inter py-2">
                    Cargando ubicaciones...
                  </div>
                ) : (
                  <SimpleSelect
                    options={locationOptions}
                    width={'100%'}
                    value={filterLocationId}
                    onChange={(value) => {
                      setFilterLocationId(value);
                      setCurrentPage(1);
                    }}
                    placeholder="Seleccione una Ubicación"
                  />
                )}
              </div>
            </div>
          </div>
          {filteredAndSortedMovements.length === 0 ? (
            <p className="text-center text-gray-400 font-inter mt-8">
              {searchTerm ||
              filterMovementType ||
              filterProductId ||
              filterLocationId
                ? 'No se encontraron movimientos con los filtros aplicados.'
                : 'No hay movimientos registrados.'}
            </p>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200 mt-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#FCFCFD]">
                    <tr>
                      {columnasMovimientos
                        .filter((col) => col.visible)
                        .map((col) => (
                          <th
                            key={col.key}
                            onClick={() => sortMovements(col.key)}
                            className={`${estilosTitulos} ${
                              col.key === 'movement_type' ? 'rounded-tl-xl' : ''
                            } ${
                              col.key ===
                              columnasMovimientos[
                                columnasMovimientos.length - 1
                              ].key
                                ? 'rounded-tr-xl'
                                : ''
                            }`}
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
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((mov: any) => (
                      <tr key={mov.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 font-inter">
                          {mov.movement_type}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">
                          {mov.product_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">
                          {mov.quantity_display}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">
                          {mov.from_location_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">
                          {mov.to_location_name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">
                          {mov.formatted_date}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate font-inter">
                          {mov.notes || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {totalPages > 1 && (
            <nav className="flex justify-center mt-6">
              <ul className="flex items-center -space-x-px h-10 text-base">
                <li>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex items-center justify-center px-4 h-10 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                </li>
                {pageNumbers.map((number: number) => (
                  <li key={number}>
                    <button
                      onClick={() => paginate(number)}
                      className={`flex items-center justify-center px-4 h-10 leading-tight border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${
                        currentPage === number
                          ? 'text-white bg-[#00A7E1] hover:bg-[#008ec1]'
                          : 'text-gray-500 bg-white'
                      }`}
                    >
                      {number}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}
          <ModalCrearMovimiento
            isOpen={isCreateMovementModalOpen}
            onClose={() => setIsCreateMovementModalOpen(false)}
            onMovementCreated={handleMovementCreated}
          />
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
}
