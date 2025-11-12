'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQualityCheckStore } from '@/store/Inventario/useQualityCheckStore';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import type { QualityCheck } from '@/types/inventory';
import ModalGestionQualityCheck from '@/features/Inventarios/ModalGestionQualityCheck';
interface TableColumn {
  key: keyof QualityCheck | "productionOrder.order_number" | "checkedBy.name" | "actions"; 
  label: string;
  visible: boolean;
}
interface SortConfig {
  key: keyof QualityCheck | 'productionOrder.order_number' | 'checkedBy.name' | null;
  direction: 'asc' | 'desc';
}
export default function QualityChecksPage() {
  const { qualityChecks, fetchQualityChecks, deleteQualityCheck, isLoading, error } = useQualityCheckStore();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [checkToEdit, setCheckToEdit] = useState<QualityCheck | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const columnasQualityChecks: TableColumn[] = useMemo(() => [
    { key: 'productionOrder.order_number', label: 'Nro. Orden Prod.', visible: true },
    { key: 'status', label: 'Estado', visible: true },
    { key: 'checkedBy.name', label: 'Realizado Por', visible: true },
    { key: 'notes', label: 'Notas', visible: true },
    { key: 'created_at', label: 'Fecha Creado', visible: true },
    { key: 'actions', label: 'Acciones', visible: true },
  ], []);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const sortQualityChecks = (key: keyof QualityCheck | 'productionOrder.order_number' | 'checkedBy.name' | 'actions') => {
    if (key === 'actions') {
      return; 
    }
    let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
      setSortConfig({ key, direction });
  };
  const filteredAndSortedQualityChecks: QualityCheck[] = useMemo(() => {
    let currentChecks: QualityCheck[] = [...qualityChecks];
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentChecks = currentChecks.filter(check =>
        (check.productionOrder?.order_number && check.productionOrder.order_number.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (check.status && check.status.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (check.checkedBy?.name && check.checkedBy.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (check.notes && check.notes.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    if (sortConfig.key) {
      currentChecks.sort((a, b) => {
        let aValue: string | number = ''; 
        let bValue: string | number = ''; 
        if (sortConfig.key === 'productionOrder.order_number') {
          aValue = a.productionOrder?.order_number || ''; 
          bValue = b.productionOrder?.order_number || ''; 
        } 
        else if (sortConfig.key === 'checkedBy.name') {
          aValue = a.checkedBy?.name || ''; 
          bValue = b.checkedBy?.name || ''; 
        }
        else {
          const valueA = a[sortConfig.key as keyof QualityCheck];
          const valueB = b[sortConfig.key as keyof QualityCheck];
          if (typeof valueA === 'string' || typeof valueA === 'number') {
            aValue = valueA; 
          } else {
            aValue = '';  
          }
          if (typeof valueB === 'string' || typeof valueB === 'number') {
            bValue = valueB; 
          } else {
            bValue = ''; 
          }
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
    return currentChecks;
  }, [qualityChecks, searchTerm, sortConfig]);
  const totalPages: number = Math.ceil(filteredAndSortedQualityChecks.length / itemsPerPage);
  const indexOfLastItem: number = currentPage * itemsPerPage;
  const indexOfFirstItem: number = indexOfLastItem - itemsPerPage;
  const currentItems: QualityCheck[] = filteredAndSortedQualityChecks.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  useEffect(() => {
    fetchQualityChecks();
  }, [fetchQualityChecks]);
  const estilosTitulos: string = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const handleOpenCreateModal = () => {
    setCheckToEdit(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (check: QualityCheck) => {
    setCheckToEdit(check);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCheckToEdit(null);
  };
  const handleDeleteCheck = async (id: string, orderNumber: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar el Control de Calidad de la Orden "${orderNumber}"? Esta acción no se puede deshacer.`)) {
      await deleteQualityCheck(id);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'passed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'rework': return 'bg-orange-100 text-orange-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  let content;
  if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center p-6 text-gray-700 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-b-[#00A7E1] border-gray-200 mb-4"></div>
        <p className="text-lg font-semibold">Cargando Controles de Calidad...</p>
        <p className="text-sm text-gray-500 mt-1">Estamos obteniendo la información de tus registros de calidad.</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg shadow-md">
        <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p className="text-lg font-semibold mb-2">¡Ups! Hubo un problema al cargar los Controles de Calidad.</p>
        <p className="text-sm text-gray-600 text-center">
          {error}. Por favor, verifica tu conexión o inténtalo de nuevo más tarde.
          <br />
          Si el problema persiste, contacta al soporte técnico.
        </p>
        <button
          onClick={() => fetchQualityChecks()}
          className="mt-4 bg-[#00A7E1] hover:bg-[#008ec1] text-white px-5 py-2 rounded-3xl text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  } else if (filteredAndSortedQualityChecks.length === 0 && searchTerm === '') {
    content = (
      <div className="flex flex-col items-center justify-center p-6 text-gray-700 bg-white rounded-lg shadow-md">
        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
        </svg>
        <p className="text-lg font-semibold mb-2">¡Aún no tienes Controles de Calidad registrados!</p>
        <p className="text-sm text-gray-600 text-center">
          Registra controles de calidad para tus órdenes de producción para asegurar la calidad de tus productos.
        </p>
        <button
          onClick={handleOpenCreateModal}
          className="mt-4 bg-[#00A7E1] hover:bg-[#008ec1] text-white px-5 py-2 rounded-3xl text-sm"
        >
          Crear Nuevo Control de Calidad
        </button>
      </div>
    );
  } else if (filteredAndSortedQualityChecks.length === 0 && searchTerm !== '') {
    content = (
      <div className="flex flex-col items-center justify-center p-6 text-gray-700 bg-white rounded-lg shadow-md">
        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p className="text-lg font-semibold mb-2">No se encontraron Controles de Calidad.</p>
        <p className="text-sm text-gray-600 text-center">
          Tu búsqueda para "{searchTerm}" no arrojó resultados.
          <br />
          Intenta con otro término o borra la búsqueda para ver todos los controles.
        </p>
        <button
          onClick={() => setSearchTerm('')}
          className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-3xl text-sm"
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
              {columnasQualityChecks
                .filter((col) => col.visible)
                .map((col) => (

                  <th
                  key={col.key}
                  onClick={col.key !== 'actions' ? () => sortQualityChecks(col.key) : undefined}
                  className={`${estilosTitulos} ${col.key === 'productionOrder.order_number' ? 'rounded-tl-[8px]' : ''} ${col.key === 'actions' ? 'rounded-tr-[8px]' : ''}`}
                  role={col.key !== 'actions' ? 'button' : 'columnheader'}
                >
                  {col.label}{' '}
                  {col.key !== 'actions' && sortConfig.key === col.key
                    ? sortConfig.direction === 'asc'
                      ? '↑'
                      : '↓'
                    : col.key !== 'actions' ? '↑' : ''}
                </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {currentItems.map((check: QualityCheck) => (
              <tr key={check.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{check.productionOrder?.order_number ?? 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(check.status)}`}>
                        {check.status}
                    </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{check.checkedBy?.name ?? 'N/A'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{check.notes || 'Sin notas'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(check.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleOpenEditModal(check)}
                    className="text-[#00A7E1] hover:text-[#008ec1] font-medium mr-2"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteCheck(check.id, check.productionOrder?.order_number ?? 'N/A')}
                    className="text-red-600 hover:text-red-800 font-medium"
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Controles de Calidad</h1>
            {!isLoading && !error && (
              <button
                onClick={handleOpenCreateModal}
                className="bg-[#00A7E1] hover:bg-[#008ec1] text-white px-5 py-2 rounded-3xl text-sm"
              >
                + Nuevo Control
              </button>
            )}
          </div>
          {(filteredAndSortedQualityChecks.length > 0 || searchTerm !== '') && !isLoading && !error && (
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por orden, estado, inspector, notas..."
                className="p-2 border border-gray-300 rounded-md w-full md:w-1/3 focus:outline-none focus:ring-2 focus:ring-[#00A7E1]"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
          {content}
          {totalPages > 1 && filteredAndSortedQualityChecks.length > 0 && !isLoading && !error && (
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
                    className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}
          <ModalGestionQualityCheck
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            checkToEdit={checkToEdit}
          />
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
}