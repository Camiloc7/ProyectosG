'use client';
import { useEffect, useState, useMemo } from 'react';
import { useProductionOrderStore } from '@/store/Inventario/useProductionOrderStore';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import ModalGestionProductionOrder from '@/features/Inventarios/ModalGestionProductionOrder';
import { ProductionOrder } from '@/types/inventory';
import ModalRegistrarProductionInput from '@/features/Inventarios/ModalRegistrarProductionInput';
import ModalRegistrarProductionOutput from '@/features/Inventarios/ModalRegistrarProductionOutput';
import { Search } from 'lucide-react';
import { showErrorToast, showTemporaryToast } from '@/components/feedback/toast';
interface TableColumn {
  key:
  | "order_number"
  | "status"
  | "checkedBy.name"
  | "notes"
  | "created_at"
  | "actions"
  | "product.name"
  | "billOfMaterial.name"
  | "productionLocation.name"
  | "quantity_to_produce"
  | "quantity_produced"
  | "start_date"
  | "end_date"
  | "register";
  label: string;
  visible: boolean;
}
interface SortConfig {
  key:
  | "order_number"
  | "status"
  | "checkedBy.name"
  | "notes"
  | "created_at"
  | "product.name"
  | "billOfMaterial.name"
  | "productionLocation.name"
  | "quantity_to_produce"
  | "quantity_produced"
  | "start_date"
  | "end_date"
  | null;
  direction: 'asc' | 'desc';
}
export default function ProductionOrdersPage() {
  const { orders, fetchOrders, deleteOrder, isLoading, error } = useProductionOrderStore();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [orderToEdit, setOrderToEdit] = useState<ProductionOrder | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false);
  const [isOutputModalOpen, setIsOutputModalOpen] = useState<boolean>(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderData, setSelectedOrderData] = useState<ProductionOrder | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const columnasOrders: TableColumn[] = useMemo(() => [
    { key: 'order_number', label: 'Nro. Orden', visible: true },
    { key: 'product.name', label: 'Producto a Producir', visible: true },
    { key: 'billOfMaterial.name', label: 'BOM Asociada', visible: true },
    { key: 'quantity_to_produce', label: 'Cant. Requerida', visible: true },
    { key: 'quantity_produced', label: 'Cant. Producida', visible: true },
    { key: 'status', label: 'Estado', visible: true },
    { key: 'productionLocation.name', label: 'Ubicación Producción', visible: true },
    { key: 'start_date', label: 'Fecha Inicio', visible: true },
    { key: 'end_date', label: 'Fecha Fin', visible: true },
    { key: 'register', label: 'Registros', visible: true },
    { key: 'actions', label: 'Acciones', visible: true },
  ], []);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const sortOrders = (key: SortConfig['key']) => {
    if (key === null) return;
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  const filteredAndSortedOrders: ProductionOrder[] = useMemo(() => {
    let currentOrders: ProductionOrder[] = [...orders];
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentOrders = currentOrders.filter(order =>
        order.order_number.toLowerCase().includes(lowerCaseSearchTerm) ||
        (order.product?.name && order.product.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (order.product?.sku && order.product.sku.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (order.billOfMaterial?.name && order.billOfMaterial.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (order.status && order.status.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (order.productionLocation?.name && order.productionLocation.name.toLowerCase().includes(lowerCaseSearchTerm)) ||
        (order.notes && order.notes.toLowerCase().includes(lowerCaseSearchTerm))
      );
    }
    if (sortConfig.key) {
      currentOrders.sort((a, b) => {
        let aValue: string | number | undefined;
        let bValue: string | number | undefined;

        if (sortConfig.key === 'product.name') {
          aValue = a.product?.name || '';
          bValue = b.product?.name || '';
        } else if (sortConfig.key === 'billOfMaterial.name') {
          aValue = a.billOfMaterial?.name || '';
          bValue = b.billOfMaterial?.name || '';
        } else if (sortConfig.key === 'productionLocation.name') {
          aValue = a.productionLocation?.name || '';
          bValue = b.productionLocation?.name || '';
        } else {
          aValue = a[sortConfig.key as keyof ProductionOrder] as string | number | undefined || '';
          bValue = b[sortConfig.key as keyof ProductionOrder] as string | number | undefined || '';
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
    return currentOrders;
  }, [orders, searchTerm, sortConfig]);
  const totalPages: number = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
  const indexOfLastItem: number = currentPage * itemsPerPage;
  const indexOfFirstItem: number = indexOfLastItem - itemsPerPage;
  const currentItems: ProductionOrder[] = filteredAndSortedOrders.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  const estilosTitulos: string = 'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const handleOpenInputModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsInputModalOpen(true);
  };
  const handleCloseInputModal = () => {
    setIsInputModalOpen(false);
    setSelectedOrderId(null);
    fetchOrders();
  };
  const handleOpenOutputModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    const order = orders.find(o => o.id === orderId);
    setSelectedOrderData(order || null);
    setIsOutputModalOpen(true);
  };
  const handleCloseOutputModal = () => {
    setIsOutputModalOpen(false);
    setSelectedOrderId(null);
    fetchOrders();
  };
  const handleOpenCreateModal = () => {
    setOrderToEdit(null);
    setIsModalOpen(true);
  };
  const handleOpenEditModal = (order: ProductionOrder) => {
    setOrderToEdit(order);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setOrderToEdit(null);
  };
  const handleDeleteOrder = async (id: string, orderNumber: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar la Orden de Producción "${orderNumber}"? Esta acción no se puede deshacer.`)) {
      await deleteOrder(id);
    }
  };
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  let content;
  if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center p-6 text-gray-700 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-b-[#00A7E1] border-gray-200 mb-4"></div>
        <p className="text-lg font-semibold">Cargando Órdenes de Producción...</p>
        <p className="text-sm text-gray-500 mt-1">Estamos obteniendo la información más reciente de tus órdenes.</p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg shadow-md">
        <svg className="w-12 h-12 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p className="text-lg font-semibold mb-2">¡Ups! Hubo un problema al cargar las Órdenes de Producción.</p>
        <p className="text-sm text-gray-600 text-center">
          {error}. Por favor, verifica tu conexión o inténtalo de nuevo más tarde.
          <br />
          Si el problema persiste, contacta al soporte técnico.
        </p>
        <button
          onClick={() => fetchOrders()}
          className="mt-4 bg-[#00A7E1] hover:bg-[#008ec1] text-white px-5 py-2 rounded-3xl text-sm"
        >
          Reintentar
        </button>
      </div>
    );
  } else if (filteredAndSortedOrders.length === 0 && searchTerm === '') {
    content = (
      <div className="flex flex-col items-center justify-center p-6 text-gray-700 bg-white rounded-lg shadow-md">
        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2H10a2 2 0 01-2-2v-4m0 0l-4 4m4-4l4 4"></path>
        </svg>
        <p className="text-lg font-semibold mb-2">¡Aún no tienes Órdenes de Producción registradas!</p>
        <p className="text-sm text-gray-600 text-center">
          Para iniciar el proceso de fabricación, crea tu primera orden.
          <br />
          Necesitarás tener **productos** y, opcionalmente, **BOMs** configuradas.
        </p>
        <button
          onClick={handleOpenCreateModal}
          className="mt-4 bg-[#00A7E1] hover:bg-[#008ec1] text-white px-5 py-2 rounded-3xl text-sm"
        >
          Crear mi primera Orden de Producción
        </button>
      </div>
    );
  } else if (filteredAndSortedOrders.length === 0 && searchTerm !== '') {
    content = (
      <div className="flex flex-col items-center justify-center p-6 text-gray-700 bg-white rounded-lg shadow-md">
        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p className="text-lg font-semibold mb-2">No se encontraron Órdenes de Producción.</p>
        <p className="text-sm text-gray-600 text-center">
          Tu búsqueda para "{searchTerm}" no arrojó resultados.
          <br />
          Intenta con otro término o borra la búsqueda para ver todas las órdenes.
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
              {columnasOrders
                .filter((col) => col.visible)
                .map((col) => (
                  <th
                    key={col.key}
                    onClick={col.key !== 'actions' && col.key ? () => sortOrders(col.key as SortConfig['key']) : undefined}
                    className={`${estilosTitulos} ${col.key === 'order_number' ? 'rounded-tl-[8px]' : ''} ${col.key === 'actions' ? 'rounded-tr-[8px]' : ''}`}
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
            {currentItems.map((order: ProductionOrder) => (
              <tr key={order.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{order.order_number}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {order.product?.name ?? 'N/A'} (SKU: {order.product?.sku ?? 'N/A'})
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.billOfMaterial?.name ?? 'No BOM Asignada'}</td>


                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{Math.floor(order.quantity_to_produce)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{Math.floor(order.quantity_produced)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{order.productionLocation?.name ?? 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">{order.start_date ? new Date(order.start_date).toLocaleDateString() : 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-inter">{order.end_date ? new Date(order.end_date).toLocaleDateString() : 'N/A'}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {order.status !== 'cancelled' && order.status !== 'completed' && (
                    <button
                      onClick={() => handleOpenInputModal(order.id)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium mr-2">
                      Registrar Materiales
                    </button>
                  )}
                  {order.status !== 'cancelled' && (
                    <button
                      onClick={() => handleOpenOutputModal(order.id)}
                      className="text-green-600 hover:text-green-900 font-medium mr-2">
                      Registrar Producción
                    </button>
                  )}
                  </td>
                <td>
                  <button
                    onClick={() => handleOpenEditModal(order)}
                    className="text-[#00A7E1] hover:text-[#008ec1] font-medium mr-2">
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteOrder(order.id, order.order_number)}
                    className="text-red-600 hover:text-red-800 font-medium">
                    Cancelar Orden
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
        <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-8  w-full overflow-hidden ">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
              <input
                type="text"
                placeholder="Buscar usuario por nombre o rol"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}

                className="w-full border-none outline-none"
              />
              <Search
                className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px] cursor-pointer ml-2"
                onClick={() => {
                  setCurrentPage(1);
                }}
              />
            </div>
            <h1 className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none">
              Listado de Órdenes de Producción</h1>
            {!isLoading && !error && (
              <button
                onClick={handleOpenCreateModal}
                className="bg-[#00A7E1] hover:bg-[#008ec1] text-white px-5 py-2 rounded-3xl text-sm"
              >
                + Crear Nueva Orden
              </button>
            )}
          </div>
          {content}
          {totalPages > 1 && filteredAndSortedOrders.length > 0 && !isLoading && !error && (
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
                    className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    Siguiente
                  </button>
                </li>
              </ul>
            </nav>
          )}
          <ModalGestionProductionOrder
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            orderToEdit={orderToEdit}
          />
          {isInputModalOpen && (
            <ModalRegistrarProductionInput
              isOpen={isInputModalOpen}
              onClose={handleCloseInputModal}
              productionOrderId={selectedOrderId}
            />
          )}
          {isOutputModalOpen && selectedOrderData && (
            <ModalRegistrarProductionOutput
              isOpen={isOutputModalOpen}
              onClose={handleCloseOutputModal}
              productionOrderId={selectedOrderData.id}
              orderNumber={selectedOrderData.order_number}
              productName={selectedOrderData.product?.name || 'N/A'}
              productId={selectedOrderData.product_id}
            />
          )}
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
}