'use client';
import { useEffect, useState, useMemo } from 'react';
import { useBomStore } from '@/store/Inventario/useBomStore';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import ModalGestionBom from '@/features/Inventarios/ModalGestionBom';
import type { BillOfMaterial } from '@/types/inventory';
import { Search } from 'lucide-react'; 
interface TableColumn {
    key: string;
    label: string;
    visible: boolean;
}
interface SortConfig {
    key: keyof BillOfMaterial | 'product.name' | null;
    direction: 'asc' | 'desc';
}
export default function BomsPage() {
    const { boms, fetchBoms, deleteBom, isLoading, error } = useBomStore();
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [bomToEdit, setBomToEdit] = useState<BillOfMaterial | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [itemsPerPage, setItemsPerPage] = useState<number>(10);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const columnasBoms: TableColumn[] = useMemo(() => [
        { key: 'name', label: 'Nombre BOM', visible: true },
        { key: 'product.name', label: 'Producto Final', visible: true },
        { key: 'quantity_produced', label: 'Cant. Producida', visible: true },
        { key: 'description', label: 'Descripción', visible: true },
        { key: 'itemsCount', label: 'Componentes', visible: true },
        { key: 'actions', label: 'Acciones', visible: true },
    ], []);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
    const sortBoms = (key: keyof BillOfMaterial | 'product.name') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };
    const filteredAndSortedBoms: BillOfMaterial[] = useMemo(() => {
        let currentBoms: BillOfMaterial[] = [...boms];
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            const searchTermsArray = lowerCaseSearchTerm.split(' ').filter(term => term.length > 0); // Dividir y limpiar términos
            currentBoms = currentBoms.filter(bom =>
                searchTermsArray.every(term =>
                    bom.name.toLowerCase().includes(term) ||
                    (bom.description && bom.description.toLowerCase().includes(term)) ||
                    (bom.product?.name && bom.product.name.toLowerCase().includes(term)) ||
                    (bom.product?.sku && bom.product.sku.toLowerCase().includes(term)) ||
                    bom.items.some(item =>
                        (item.componentProduct?.name && item.componentProduct.name.toLowerCase().includes(term)) ||
                        (item.componentProduct?.sku && item.componentProduct.sku.toLowerCase().includes(term))
                    )
                )
            );
        }
        if (sortConfig.key) {
            currentBoms.sort((a, b) => {
                let aValue: string | number | undefined;
                let bValue: string | number | undefined;
                if (sortConfig.key === 'product.name') {
                    aValue = a.product?.name || '';
                    bValue = b.product?.name || '';
                } else {
                    aValue = a[sortConfig.key as keyof BillOfMaterial] as string | number | undefined || '';
                    bValue = b[sortConfig.key as keyof BillOfMaterial] as string | number | undefined || '';
                }

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
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
        return currentBoms;
    }, [boms, searchTerm, sortConfig]);

    const totalPages: number = Math.ceil(filteredAndSortedBoms.length / itemsPerPage);
    const indexOfLastItem: number = currentPage * itemsPerPage;
    const indexOfFirstItem: number = indexOfLastItem - itemsPerPage;
    const currentItems: BillOfMaterial[] = filteredAndSortedBoms.slice(indexOfFirstItem, indexOfLastItem);
    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
    const pageNumbers: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }
    useEffect(() => {
        fetchBoms();
    }, [fetchBoms]);
    const estilosTitulos: string = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider font-inter'; // Añadido font-inter
    const handleOpenCreateModal = () => {
        setBomToEdit(null);
        setIsModalOpen(true);
    };
    const handleOpenEditModal = (bom: BillOfMaterial) => {
        setBomToEdit(bom);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setBomToEdit(null);
    };
    const handleDeleteBom = async (id: string, name: string) => {
        if (confirm(`¿Estás seguro de que quieres eliminar la BOM "${name}"? Esta acción no se puede deshacer.`)) {
            await deleteBom(id);
        }
    };
    let content;
    if (isLoading) {
        content = (
            <div className="flex flex-col items-center justify-center p-6 text-gray-700 bg-white rounded-lg shadow-md">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-b-[#00A7E1] border-gray-200 mb-4"></div>
                <p className="text-lg font-semibold font-inter">Cargando Listado de BOMs...</p>
                <p className="text-sm text-gray-500 mt-1 font-inter">Estamos obteniendo la información más reciente de tus BOMs.</p>
            </div>
        );
    } else if (error) {
        content = (
            <div className="flex flex-col items-center justify-center p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg shadow-md">
                <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-lg font-semibold mb-2 font-inter">¡Ups! Hubo un problema al cargar las BOMs.</p>
                <p className="text-sm text-gray-600 text-center font-inter">
                    {error}. Por favor, verifica tu conexión o inténtalo de nuevo más tarde.
                    <br />
                    Si el problema persiste, contacta al soporte técnico.
                </p>
                <button
                    onClick={() => fetchBoms()}
                    className="mt-4 bg-[#00A7E1] hover:bg-[#008ec1] text-white px-5 py-2 rounded-3xl text-sm font-inter"
                >
                    Reintentar
                </button>
            </div>
        );
    } else if (filteredAndSortedBoms.length === 0 && searchTerm === '') {
        content = (
            <div className="flex flex-col items-center justify-center p-6 text-gray-700 bg-white rounded-lg shadow-md">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <p className="text-lg font-semibold mb-2 font-inter">¡Aún no tienes BOMs registradas!</p>
                <p className="text-sm text-gray-600 text-center font-inter">
                    Parece que no hay ninguna lista de materiales configurada.
                    <br />
                    Para empezar, haz clic en el botón **"Crear Nueva BOM"** para definir la composición de tus productos.
                </p>
                <button
                    onClick={handleOpenCreateModal}
                    className="mt-4 bg-[#00A7E1] hover:bg-[#008ec1] text-white px-5 py-2 rounded-3xl text-sm font-inter"
                >
                    Crear mi primera BOM
                </button>
            </div>
        );
    } else if (filteredAndSortedBoms.length === 0 && searchTerm !== '') {
        content = (
            <div className="flex flex-col items-center justify-center p-6 text-gray-700 bg-white rounded-lg shadow-md">
                <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p className="text-lg font-semibold mb-2 font-inter">No se encontraron BOMs.</p>
                <p className="text-sm text-gray-600 text-center font-inter">
                    Tu búsqueda para "{searchTerm}" no arrojó resultados.
                    <br />
                    Intenta con otro término o borra la búsqueda para ver todas las BOMs.
                </p>
                <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-3xl text-sm font-inter"
                >
                    Limpiar búsqueda
                </button>
            </div>
        );
    } else {
        content = (
            <div className="hidden sm:block rounded-[8px] mt-6 overflow-x-auto">
                <table className="min-w-full bg-white rounded-[8px]">
                    <thead className="bg-[#FCFCFD] rounded-[8px]">
                        <tr>
                            {columnasBoms
                                .filter((col) => col.visible)
                                .map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={col.key !== 'actions' && col.key !== 'itemsCount' ? () => sortBoms(col.key as keyof BillOfMaterial | 'product.name') : undefined}
                                        className={`${estilosTitulos} ${col.key === 'name' ? 'rounded-tl-[8px]' : ''} ${col.key === 'actions' ? 'rounded-tr-[8px]' : ''}`}
                                        role={col.key !== 'actions' && col.key !== 'itemsCount' ? 'button' : 'columnheader'}
                                    >
                                        {col.label}{' '}
                                        {col.key !== 'actions' && col.key !== 'itemsCount' && sortConfig.key === col.key
                                            ? sortConfig.direction === 'asc'
                                                ? '↑'
                                                : '↓'
                                            : col.key !== 'actions' && col.key !== 'itemsCount' ? '↑' : ''}
                                    </th>
                                ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((bom: BillOfMaterial) => (
                            <tr key={bom.id} className="border-t border-gray-200 hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 font-inter">{bom.name}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">{bom.product?.name ?? 'N/A'} (SKU: {bom.product?.sku ?? 'N/A'})</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">{bom.quantity_produced}</td>
                                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate font-inter">{bom.description || 'Sin descripción'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">{bom.items.length}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => handleOpenEditModal(bom)}
                                        className="text-[#00A7E1] hover:text-[#008ec1] font-medium mr-2 font-inter"
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleDeleteBom(bom.id, bom.name)}
                                        className="text-red-600 hover:text-red-800 font-medium font-inter"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    return (
        <PrivateRoute>
            <LayoutAdmi>
                <div className="p-6 max-w-full mx-auto">
                    <div className="w-full mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                            {(filteredAndSortedBoms.length > 0 || searchTerm !== '') && !isLoading && !error && (
                                <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                                    <input
                                        type="text"
                                        placeholder="Buscar BOM"
                                        value={searchTerm}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full border-none outline-none font-inter"
                                    />
                                    <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px] cursor-pointer" />
                                </div>
                            )}
                            <h1 className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none">
                                Listado de BOMs
                            </h1>
                            {!isLoading && !error && (
                                <button
                                    onClick={handleOpenCreateModal}
                                    className="bg-[#00A7E1] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-auto"
                                >
                                    + Crear Nueva BOM
                                </button>
                            )}
                        </div>
                    </div>
                    {content} 
                    {totalPages > 1 && filteredAndSortedBoms.length > 0 && !isLoading && !error && (
                        <nav className="flex justify-center mt-6">
                            <ul className="flex items-center -space-x-px h-10 text-base">
                                <li>
                                    <button
                                        onClick={() => paginate(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="flex items-center justify-center px-4 h-10 ms-0 leading-tight text-gray-500 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                                    >
                                        Anterior
                                    </button>
                                </li>
                                {pageNumbers.map((number: number) => (
                                    <li key={number}>
                                        <button
                                            onClick={() => paginate(number)}
                                            className={`flex items-center justify-center px-4 h-10 leading-tight border border-gray-300 hover:bg-gray-100 hover:text-gray-700 font-inter ${
                                                currentPage === number ? 'text-white bg-[#00A7E1] hover:bg-[#008ec1]' : 'text-gray-500 bg-white'
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
                                        className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                                    >
                                        Siguiente
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                    <ModalGestionBom
                        isOpen={isModalOpen}
                        onClose={handleCloseModal}
                        bomToEdit={bomToEdit}
                    />
                </div>
            </LayoutAdmi>
        </PrivateRoute>
    );
}