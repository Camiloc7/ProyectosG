'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSuppliersStore } from '@/store/Inventario/useSuppliersStore';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import ModalCrearProveedor from '@/features/Inventarios/CrearProveedor';
import { Supplier } from '@/types/inventory';
import { Search } from 'lucide-react';
interface TableColumn {
  key: keyof Supplier | 'category';
  label: string;
  visible: boolean;
}
interface SortConfig {
  key: keyof Supplier | 'category' | null;
  direction: 'asc' | 'desc';
}
export default function ProveedoresPage() {
  const { suppliers, fetchSuppliers } = useSuppliersStore();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const columnasProveedores: TableColumn[] = useMemo(() => [
    { key: 'name', label: 'Nombre', visible: true },
    { key: 'nit', label: 'NIT', visible: true },
    { key: 'email', label: 'Email', visible: true },
    { key: 'phone', label: 'Teléfono', visible: true },
    { key: 'address', label: 'Dirección', visible: true },
    { key: 'category', label: 'Categoría', visible: true },
  ], []);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const sortProveedores = (key: keyof Supplier | 'category') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  const filteredAndSortedSuppliers: Supplier[] = useMemo(() => {
    let currentSuppliers: Supplier[] = [...suppliers];

    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentSuppliers = currentSuppliers.filter(sup => {
        const nameMatch = sup.name.toLowerCase().includes(lowerCaseSearchTerm);
        const nitMatch = sup.nit.toLowerCase().includes(lowerCaseSearchTerm);
        const emailMatch = sup.email && sup.email.toLowerCase().includes(lowerCaseSearchTerm);
        const phoneMatch = sup.phone && sup.phone.toLowerCase().includes(lowerCaseSearchTerm);
        const addressMatch = sup.address && sup.address.toLowerCase().includes(lowerCaseSearchTerm);
        const categoryMatch = sup.category?.name && sup.category.name.toLowerCase().includes(lowerCaseSearchTerm);
        return nameMatch || nitMatch || emailMatch || phoneMatch || addressMatch || categoryMatch;
      });
    }
    if (sortConfig.key) {
      currentSuppliers.sort((a, b) => {
        let aValue: string | number | undefined;
        let bValue: string | number | undefined;
        const sortKey = sortConfig.key;
        if (sortKey === 'category') {
          aValue = a.category?.name || '';
          bValue = b.category?.name || '';
        } else {
          const valA = a[sortKey as keyof Supplier];
          const valB = b[sortKey as keyof Supplier];
          aValue = (typeof valA === 'string' || typeof valA === 'number') ? valA : '';
          bValue = (typeof valB === 'string' || typeof valB === 'number') ? valB : '';
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        const numAValue = typeof aValue === 'number' ? aValue : (aValue === '' ? -Infinity : 0); 
        const numBValue = typeof bValue === 'number' ? bValue : (bValue === '' ? -Infinity : 0);

        if (numAValue < numBValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (numAValue > numBValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return currentSuppliers;
  }, [suppliers, searchTerm, sortConfig]);

  const totalPages: number = Math.ceil(filteredAndSortedSuppliers.length / itemsPerPage);
  const indexOfLastItem: number = currentPage * itemsPerPage;
  const indexOfFirstItem: number = indexOfLastItem - itemsPerPage;
  const currentItems: Supplier[] = filteredAndSortedSuppliers.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const estilosTitulos: string = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="p-6 max-w-full mx-auto">
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar proveedor"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full border-none outline-none"
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
              </div>
              <h1
                className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none"
              >
              Proveedores
              </h1>
            </div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setIsOpen(true)}
                className=" ml-auto bg-[#00A7E1] font-bold text-white h-8 px-14 text-xs rounded-full hover:bg-[#008ec1]"
              >
                + Agregar proveedor
              </button>
            </div>
          </div>
          {filteredAndSortedSuppliers.length === 0 && (
            <p className="text-gray-600">No hay proveedores registrados que coincidan con la búsqueda.</p>
          )}

          <div className="hidden sm:block rounded-[8px] mt-6 overflow-x-auto">
            <table className="min-w-full bg-white rounded-[8px]">
              <thead className="bg-[#FCFCFD] rounded-[8px]">
                <tr>
                  {columnasProveedores
                    .filter((col) => col.visible)
                    .map((col) => (
                      <th
                        key={col.key}
                        onClick={() => sortProveedores(col.key)}
                        className={`${estilosTitulos} ${col.key === 'name' ? 'rounded-tl-[8px]' : ''
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
              <tbody>
                {currentItems.map((sup: Supplier) => (
                  <tr key={sup.id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{sup.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{sup.nit}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{sup.email ?? ''}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{sup.phone ?? ''}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{sup.address ?? ''}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{sup.category?.name ?? 'Sin categoría'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                      className={`flex items-center justify-center px-4 h-10 leading-tight border border-gray-300 hover:bg-gray-100 hover:text-gray-700 ${currentPage === number ? 'text-white bg-[#00A7E1] hover:bg-[#008ec1]' : 'text-gray-500 bg-white'
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
          <ModalCrearProveedor isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
}