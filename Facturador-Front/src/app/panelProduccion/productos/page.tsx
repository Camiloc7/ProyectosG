'use client';
import { useEffect, useState, useMemo } from 'react';
import { useProductStore } from '@/store/Inventario/useProductStore';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import ModalCrearProducto from '@/features/Inventarios/CreateProduct';
import { Search } from 'lucide-react'; 
import { Product } from '@/types/inventory';

interface TableColumn {
  key: keyof Product | 'category' | 'actions';
  label: string;
  visible: boolean;
}
interface SortConfig {
  key: keyof Product | 'category' | null;
  direction: 'asc' | 'desc';
}
const ProductsPage = () => {
  const { products, fetchProducts, isLoading, error } = useProductStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10); 
  const columnasProductos: TableColumn[] = useMemo(() => [
    { key: 'name', label: 'Nombre', visible: true },
    { key: 'sku', label: 'SKU', visible: true },
    { key: 'barcode', label: 'Código de Barras', visible: true },
    { key: 'category', label: 'Categoría', visible: true },
    { key: 'actions', label: 'Acciones', visible: true }, 
  ], []);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => {
    setIsModalOpen(false);
    fetchProducts(); 
  };
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  const sortProducts = (key: keyof Product | 'category') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  const filteredAndSortedProducts: Product[] = useMemo(() => {
    let currentProducts: Product[] = [...products];
    const productsWithCategory = currentProducts.map(product => ({
      ...product,
    }));
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentProducts = currentProducts.filter(prod => {
        const nameMatch = prod.name.toLowerCase().includes(lowerCaseSearchTerm);
        const skuMatch = prod.sku.toLowerCase().includes(lowerCaseSearchTerm);
        const barcodeMatch = prod.barcode && prod.barcode.toLowerCase().includes(lowerCaseSearchTerm);
        const categoryMatch = prod.category?.name && prod.category.name.toLowerCase().includes(lowerCaseSearchTerm);
        return nameMatch || skuMatch || barcodeMatch || categoryMatch;
      });
    }
    if (sortConfig.key) {
      currentProducts.sort((a, b) => {
        let aValue: string | number | undefined;
        let bValue: string | number | undefined;
        const sortKey = sortConfig.key;

        if (sortKey === 'category') {
          aValue = a.category?.name || '';
          bValue = b.category?.name || '';
        } else {
          const valA = a[sortKey as keyof Product];
          const valB = b[sortKey as keyof Product];
          aValue = (typeof valA === 'string' || typeof valA === 'number') ? valA : '';
          bValue = (typeof valB === 'string' || typeof valB === 'number') ? valB : '';
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }
        return 0;
      });
    }
    return currentProducts;
  }, [products, searchTerm, sortConfig]);
  const totalPages: number = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const indexOfLastItem: number = currentPage * itemsPerPage;
  const indexOfFirstItem: number = indexOfLastItem - itemsPerPage;
  const currentItems: Product[] = filteredAndSortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  const pageNumbers: number[] = useMemo(() => {
    const pages: number[] = [];
    const maxPagesToShow = 5; 
    let startPage: number, endPage: number;
    if (totalPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalPages;
    } else {
      if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        startPage = currentPage - Math.floor(maxPagesToShow / 2);
        endPage = currentPage + Math.floor(maxPagesToShow / 2);
      }
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages, currentPage]);
  const estilosTitulos: string = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="p-6 max-w-full mx-auto">
          <div className="w-full mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar producto"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1); 
                  }}
                  className="w-full border-none outline-none"
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px] cursor-pointer" />
              </div>
              <h1 className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none">
                Productos
              </h1>
              <button
                onClick={handleOpenModal}
                className="ml-auto bg-[#00A7E1] font-bold text-white h-8 px-14 text-xs rounded-full hover:bg-[#008ec1] w-full sm:w-auto"
              >
                + Agregar producto
              </button>
            </div>
          </div>
          {isLoading ? (
            <p className="text-center text-gray-500">Cargando productos...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : filteredAndSortedProducts.length === 0 ? (
            <p className="text-gray-600">No hay productos registrados que coincidan con la búsqueda.</p>
          ) : (
            <div className="hidden sm:block rounded-[8px] mt-6 overflow-x-auto">
              <table className="min-w-full bg-white rounded-[8px]">
                <thead className="bg-[#FCFCFD] rounded-[8px]">
                  <tr>
                    {columnasProductos
                      .filter((col) => col.visible)
                      .map((col) => (
                        <th
                          key={col.key}
                          onClick={col.key !== 'actions' ? () => sortProducts(col.key as keyof Product | 'category') : undefined}
                          className={`${estilosTitulos} ${col.key === 'name' ? 'rounded-tl-[8px]' : ''
                            } ${col.key !== 'actions' ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                          role={col.key !== 'actions' ? 'button' : undefined}
                        >
                          {col.label}{' '}
                          {(sortConfig.key === col.key)
                            ? (sortConfig.direction === 'asc' ? '↑' : '↓')
                            : (col.key !== 'actions' ? '↑' : '')}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((product: Product) => (
                    <tr key={product.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{product.sku}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{product.barcode ?? ''}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{product.category?.name ?? 'Sin categoría'}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs transition-colors mr-2">Editar</button>
                        <button className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs transition-colors">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                  {filteredAndSortedProducts.length === 0 && (
                    <tr>
                      <td colSpan={columnasProductos.filter(c => c.visible).length} className="px-4 py-3 text-sm text-gray-600 text-center">No hay productos para mostrar.</td>
                    </tr>
                  )}
                </tbody>
              </table>
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
          <ModalCrearProducto isOpen={isModalOpen} onClose={handleCloseModal} onProductCreated={fetchProducts} />
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default ProductsPage;