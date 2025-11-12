'use client';
import { useEffect, useState, useMemo } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import PrivateRoute from '@/helpers/PrivateRoute';
import { format } from 'date-fns';
import { useInvoicesStore } from '@/store/Inventario/useInvoicesStore';
import { Invoice } from '@/types/inventory';
import ModalCrearUsuario from '@/features/Inventarios/ModalCrearUsuario';
import ModalGestionItemsFactura from '@/features/Inventarios/ModalGestionItemsFactura';
import { Search, FileText, FileCode2 } from 'lucide-react';
interface ClassifiedInvoice extends Invoice {
  documentType?:
    | 'Factura de venta'
    | 'Factura de compra'
    | 'Documento de terceros';
}
interface TableColumn {
  key: keyof ClassifiedInvoice | 'actions' | 'xml_link' | 'pdf_link';
  label: string;
  visible: boolean;
}
interface SortConfig {
  key: keyof ClassifiedInvoice | null;
  direction: 'asc' | 'desc';
}
export default function InvoicesPage() {
  const {
    invoices,
    fetchInvoices,
    fetchClassifiedInvoices,
    isLoading,
    error,
    fetchInvoiceById,
    fetchPdfById,
    fetchXmlById,
  } = useInvoicesStore();
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] =
    useState<boolean>(false);
  const [isGestionItemsModalOpen, setIsGestionItemsModalOpen] =
    useState<boolean>(false);
  const [selectedInvoice, setSelectedInvoice] =
    useState<ClassifiedInvoice | null>(null);
  const [isModalLoading, setIsModalLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sourceType, setSourceType] = useState<
    'Factura de venta' | 'Factura de compra' | 'Documento de terceros'
  >('Factura de venta');
  const columnasFacturas: TableColumn[] = useMemo(
    () => [
      { key: 'numero_factura', label: 'Número Factura', visible: true },
      { key: 'nombre_proveedor', label: 'Proveedor', visible: true },
      { key: 'nit_proveedor', label: 'NIT Proveedor', visible: true },
      { key: 'nombre_cliente', label: 'Cliente', visible: true },
      { key: 'fecha_emision', label: 'Fecha Emisión', visible: true },
      { key: 'monto_total', label: 'Monto Total', visible: true },
      { key: 'moneda', label: 'Moneda', visible: true },
      { key: 'metodo_pago', label: 'Método de Pago', visible: true },
      { key: 'documentType', label: 'Tipo de Documento', visible: true },
      { key: 'revisada_manualmente', label: 'Revisada', visible: true },
      { key: 'xml_link', label: 'XML', visible: true },
      { key: 'pdf_link', label: 'PDF', visible: true },
      { key: 'actions', label: 'Acciones', visible: true },
    ],
    []
  );
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: 'asc',
  });
  const sortInvoices = (key: keyof ClassifiedInvoice) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  const handleOpenGestionItemsModal = async (invoiceId: number) => {
    setIsModalLoading(true);
    setSelectedInvoice(null);
    try {
      const fullInvoice = await fetchInvoiceById(invoiceId);
      if (fullInvoice) {
        setSelectedInvoice(fullInvoice);
        setIsGestionItemsModalOpen(true);
      } else {
        console.error('No se encontró la factura con el ID proporcionado.');
      }
    } catch (err) {
      console.error('Error al obtener la factura completa:', err);
    } finally {
      setIsModalLoading(false);
    }
  };
  const handleCloseGestionItemsModal = () => {
    setIsGestionItemsModalOpen(false);
    setSelectedInvoice(null);
    fetchClassifiedInvoices();
  };
  const handleViewPDF = async (invoiceId: number) => {
    try {
      const pdfUrl = await fetchPdfById(invoiceId);
      if (pdfUrl) {
        window.open(pdfUrl, '_blank');
      } else {
        console.error('No se pudo obtener la URL del PDF.');
        alert('No se pudo cargar el PDF. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error('Error al obtener el PDF:', err);
      alert('Hubo un error al intentar ver el PDF.');
    }
  };
  const handleViewXml = async (invoiceId: number) => {
    try {
      const xmlText = await fetchXmlById(invoiceId);
      if (!xmlText) {
        alert('No se pudo descargar el XML.');
        return;
      }
      const blob = new Blob([xmlText], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${invoiceId}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error al descargar el XML:', err);
      alert('Hubo un error al intentar descargar el XML.');
    }
  };
  const filteredAndSortedInvoices: ClassifiedInvoice[] = useMemo(() => {
    let currentInvoices: ClassifiedInvoice[] = [...invoices];
    currentInvoices = currentInvoices.filter(
      (inv) => inv.documentType === sourceType
    );
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      currentInvoices = currentInvoices.filter((inv) => {
        const numFacturaMatch = inv.numero_factura
          .toLowerCase()
          .includes(lowerCaseSearchTerm);
        const proveedorMatch =
          inv.nombre_proveedor?.toLowerCase().includes(lowerCaseSearchTerm) ||
          false;
        const nitProveedorMatch =
          inv.nit_proveedor?.toLowerCase().includes(lowerCaseSearchTerm) ||
          false;
        const clienteMatch =
          inv.nombre_cliente?.toLowerCase().includes(lowerCaseSearchTerm) ||
          false;
        const metodoPagoMatch =
          inv.metodo_pago?.toLowerCase().includes(lowerCaseSearchTerm) || false;
        const cufeMatch =
          inv.cufe?.toLowerCase().includes(lowerCaseSearchTerm) || false;
        const monedaMatch =
          inv.moneda?.toLowerCase().includes(lowerCaseSearchTerm) || false;
        const documentTypeMatch =
          inv.documentType?.toLowerCase().includes(lowerCaseSearchTerm) ||
          false;
        return (
          numFacturaMatch ||
          proveedorMatch ||
          nitProveedorMatch ||
          clienteMatch ||
          metodoPagoMatch ||
          cufeMatch ||
          monedaMatch ||
          documentTypeMatch
        );
      });
    }
    if (sortConfig.key) {
      currentInvoices.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof ClassifiedInvoice];
        const bValue = b[sortConfig.key as keyof ClassifiedInvoice];
        if (aValue === null || aValue === undefined)
          return sortConfig.direction === 'asc' ? 1 : -1;
        if (bValue === null || bValue === undefined)
          return sortConfig.direction === 'asc' ? -1 : 1;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        }
        return 0;
      });
    }
    return currentInvoices;
  }, [invoices, searchTerm, sortConfig, sourceType]);
  const totalPages: number = Math.ceil(
    filteredAndSortedInvoices.length / itemsPerPage
  );
  const indexOfLastItem: number = currentPage * itemsPerPage;
  const indexOfFirstItem: number = indexOfLastItem - itemsPerPage;
  const currentItems: ClassifiedInvoice[] = filteredAndSortedInvoices.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }
  useEffect(() => {
    fetchClassifiedInvoices();
    setCurrentPage(1);
  }, [fetchClassifiedInvoices, sourceType]);
  const estilosTitulos: string =
    'px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
  const handleOpenCreateUserModal = () => {
    setIsCreateUserModalOpen(true);
  };
  const handleCloseCreateUserModal = () => {
    setIsCreateUserModalOpen(false);
    fetchClassifiedInvoices();
  };
  const handleUserCreated = (userId: number, userEmail: string) => {
    console.error(
      `Usuario con ID: ${userId} y Correo: ${userEmail} registrado con éxito. El backend iniciará la automatización.`
    );
  };
  let content;
  if (isLoading) {
    content = (
      <div className="flex flex-col items-center justify-center p-6 text-gray-700 bg-white rounded-lg shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-b-[#00A7E1] border-gray-200 mb-4"></div>
        <p className="text-lg font-semibold font-inter">
          Cargando Listado de Facturas...
        </p>
        <p className="text-sm text-gray-500 mt-1 font-inter">
          Estamos obteniendo la información más reciente de tus facturas.
        </p>
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex flex-col items-center justify-center p-6 text-red-700 bg-red-50 border border-red-200 rounded-lg shadow-md">
        <svg
          className="w-12 h-12 text-red-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <p className="text-lg font-semibold mb-2 font-inter">
          ¡Ups! Hubo un problema al cargar las facturas.
        </p>
        <p className="text-sm text-gray-600 text-center font-inter">
          {error}. Por favor, verifica tu conexión o inténtalo de nuevo más
          tarde.
          <br />
          Si el problema persiste, contacta al soporte técnico.
        </p>
        <button
          onClick={() => {
            fetchClassifiedInvoices();
          }}
          className="mt-4 bg-[#00A7E1] hover:bg-[#008ec1] text-white px-5 py-2 rounded-3xl text-sm font-inter"
        >
          Reintentar
        </button>
      </div>
    );
  } else if (filteredAndSortedInvoices.length === 0 && searchTerm === '') {
    content = (
      <div className="flex flex-col items-center justify-center p-6 text-gray-700 bg-white rounded-lg shadow-md">
        <svg
          className="w-12 h-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          ></path>
        </svg>
        <p className="text-lg font-semibold mb-2 font-inter">
          ¡Aún no se han encontrado facturas!
        </p>
        <p className="text-sm text-gray-600 text-center font-inter">
          Esto puede deberse a que no hay usuarios registrados para este
          servicio o la automatización aún no ha traído sus facturas.
          <br />
          Para añadir un nuevo usuario y que sus facturas sean procesadas, haz
          clic en el botón **"Registrar Correo de Usuario"**.
        </p>
        <button
          onClick={handleOpenCreateUserModal}
          className="mt-4 bg-[#00A7E1] hover:bg-[#008ec1] text-white px-5 py-2 rounded-3xl text-sm font-inter"
        >
          Registrar Correo de Usuario
        </button>
      </div>
    );
  } else if (filteredAndSortedInvoices.length === 0 && searchTerm !== '') {
    content = (
      <div className="flex flex-col items-center justify-center p-6 text-gray-700 bg-white rounded-lg shadow-md">
        <svg
          className="w-12 h-12 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <p className="text-lg font-semibold mb-2 font-inter">
          No se encontraron facturas.
        </p>
        <p className="text-sm text-gray-600 text-center font-inter">
          Tu búsqueda para "{searchTerm}" no arrojó resultados.
          <br />
          Intenta con otro término o borra la búsqueda para ver todas las
          facturas.
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
              {columnasFacturas
                .filter((col) => col.visible)
                .map((col) => (
                  <th
                    key={col.key}
                    onClick={() =>
                      col.key !== 'actions' &&
                      col.key !== 'xml_link' &&
                      col.key !== 'pdf_link' &&
                      sortInvoices(col.key as keyof ClassifiedInvoice)
                    }
                    className={`${estilosTitulos} ${
                      col.key === 'numero_factura' ? 'rounded-tl-[8px]' : ''
                    }`}
                    role="button"
                  >
                    {col.label}{' '}
                    {sortConfig.key === col.key
                      ? sortConfig.direction === 'asc'
                        ? '↑'
                        : '↓'
                      : col.key !== 'actions' &&
                        col.key !== 'xml_link' &&
                        col.key !== 'pdf_link'
                      ? '↑'
                      : ''}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {currentItems.map((inv: ClassifiedInvoice) => (
              <tr
                key={inv.id}
                className="border-t border-gray-200 hover:bg-gray-50"
              >
                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                  {inv.numero_factura}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {inv.nombre_proveedor}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {inv.nit_proveedor}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {inv.nombre_cliente}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {inv.fecha_emision
                    ? format(new Date(inv.fecha_emision), 'dd/MM/yyyy')
                    : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {inv.monto_total !== null &&
                  typeof inv.monto_total === 'number'
                    ? inv.monto_total
                    : 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {inv.moneda}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {inv.metodo_pago}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {inv.documentType || 'N/A'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {inv.revisada_manualmente ? 'Sí' : 'No'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleViewXml(inv.id)}
                    className="text-[#00A7E1] hover:text-[#008ec1] mx-2"
                    title="Ver XML"
                  >
                    <FileCode2 className="w-5 h-5" />
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleViewPDF(inv.id)}
                    className="text-[#00A7E1] hover:text-[#008ec1] mx-2"
                    title="Ver PDF"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleOpenGestionItemsModal(inv.id)}
                    disabled={isModalLoading}
                    className="bg-[#00A7E1] hover:bg-[#008ec1] text-white px-3 py-1 rounded-md text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Gestionar materiales/productos"
                  >
                    {isModalLoading ? 'Cargando...' : 'Productos'}
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
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar factura"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full border-none outline-none"
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
              </div>
              <h1 className="mr-auto text-xl md::text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none">
                Buzon de Facturas
              </h1>
              {!isLoading && !error && (
                <button
                  onClick={handleOpenCreateUserModal}
                  className="bg-[#00A7E1] text-white h-8 px-4 py-2 flex items-center justify-center font-bold font-montserrat rounded-3xl leading-[14.63px] text-[12px] hover:bg-[#008ec1] w-full sm:w-auto"
                >
                  + Registrar Correo de Usuario
                </button>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-start mt-4 gap-2">
              <button
                onClick={() => setSourceType('Factura de venta')}
                className={`px-4 py-2 rounded-full font-inter transition-colors ${
                  sourceType === 'Factura de venta'
                    ? 'bg-[#00A7E1] text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                Facturas de Venta
              </button>
              <button
                onClick={() => setSourceType('Factura de compra')}
                className={`px-4 py-2 rounded-full font-inter transition-colors ${
                  sourceType === 'Factura de compra'
                    ? 'bg-[#00A7E1] text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                Facturas de Compra
              </button>
              <button
                onClick={() => setSourceType('Documento de terceros')}
                className={`px-4 py-2 rounded-full font-inter transition-colors ${
                  sourceType === 'Documento de terceros'
                    ? 'bg-[#00A7E1] text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                Documentos de Terceros
              </button>
            </div>
          </div>
          {content}
          {totalPages > 1 &&
            filteredAndSortedInvoices.length > 0 &&
            !isLoading &&
            !error && (
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
                      className="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
            )}
        </div>
        <ModalCrearUsuario
          isOpen={isCreateUserModalOpen}
          onClose={handleCloseCreateUserModal}
          onUserCreated={handleUserCreated}
        />
        <ModalGestionItemsFactura
          isOpen={isGestionItemsModalOpen}
          onClose={handleCloseGestionItemsModal}
          invoice={selectedInvoice}
        />
      </LayoutAdmi>
    </PrivateRoute>
  );
}
