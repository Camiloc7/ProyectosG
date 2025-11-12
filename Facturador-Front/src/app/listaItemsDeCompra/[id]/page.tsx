'use client';
import React, { useState, useEffect } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import Spinner from '@/components/feedback/Spinner';
import { Check, Loader2, Search, Send } from 'lucide-react';
import PrivateRoute from '@/helpers/PrivateRoute';
import FormCrearProveedor from '@/features/proveedores/formCrearProveedor';
import { confirm } from '@/components/feedback/ConfirmOption';
import { useParams, useRouter } from 'next/navigation';
import { Supplier } from '@/types/inventory';
import { showErrorToast, showTemporaryToast } from '@/components/feedback/toast';
import { useSupplierCategoriesStore } from '@/store/Inventario/useSupplierCategories';
import { useSuppliersStore } from '@/store/Inventario/useSuppliersStore';
import ModalCrearProveedor from '@/features/Inventarios/CrearProveedor';
const CategoriaDetalleProveedores = () => {
  const params = useParams();
  const categoryId = typeof params.id === 'string' ? params.id : null;
  const router = useRouter();

  const {
    fetchCategoryById,
    selectedCategory,
    loading: categoryLoading,
    error: categoryError,
  } = useSupplierCategoriesStore();
  const {
    fetchOneSupplier,
    deleteSupplier,
    selectedSupplier,
    isLoading: proveedorLoading,
    error: proveedorError,
  } = useSuppliersStore();

  const [proveedoresDeCategoria, setProveedoresDeCategoria] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openCreateForm, setOpenCreateForm] = useState<boolean>(false);
  const [proveedorPorEditar, setProveedorPorEditar] = useState<Supplier | null>(null);
  const clientesPorPagina = 10;
  useEffect(() => {
    if (categoryId) {
      fetchCategoryById(categoryId);
    }
  }, [categoryId, fetchCategoryById]);
  useEffect(() => {
    if (selectedCategory && selectedCategory.suppliers) {
      setProveedoresDeCategoria(selectedCategory.suppliers);
    } else {
      setProveedoresDeCategoria([]);
    }
  }, [selectedCategory]);
  useEffect(() => {
    if (openCreateForm) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [openCreateForm]);
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
    setSearchQuery(event.target.value);
  };
  const filteredProveedores = proveedoresDeCategoria.filter((proveedor) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = proveedor.name.toLowerCase().includes(query);
    const nitMatch = proveedor.nit.toLowerCase().includes(query);
    const emailMatch = proveedor.email ? proveedor.email.toLowerCase().includes(query) : false;
    const phoneMatch = proveedor.phone ? proveedor.phone.toLowerCase().includes(query) : false;
    return nameMatch || emailMatch || nitMatch || phoneMatch;
  });
  const totalPaginas = Math.ceil(filteredProveedores.length / clientesPorPagina);
  const indexInicio = (currentPage - 1) * clientesPorPagina;
  const indexFinal = indexInicio + clientesPorPagina;
  const proveedoresActuales = filteredProveedores.slice(indexInicio, indexFinal);
  const handleEliminarProveedor = async (id: string) => {
    const confirmado = await confirm({
      title: '¿Estás seguro de que deseas eliminar este proveedor?',
    });
    if (confirmado) {
      try {
        await deleteSupplier(id);
        showTemporaryToast('Proveedor eliminado exitosamente!');
        if (categoryId) {
          fetchCategoryById(categoryId);
        }
      } catch (error) {
        showErrorToast('Error al eliminar el proveedor.');
        console.error('Error al eliminar proveedor:', error);
      }
    }
  };
  const handleEditarProveedor = async (id: string) => {
    try {
      await fetchOneSupplier(id);
      setOpenCreateForm(true);
    } catch (error) {
      showTemporaryToast('Error al cargar datos del proveedor para editar.');
      console.error('Error al cargar proveedor para editar:', error);
    }
  };
  useEffect(() => {
    if (selectedSupplier) {
      setProveedorPorEditar(selectedSupplier);
    } else {
      setProveedorPorEditar(null);
    }
  }, [selectedSupplier]); // Dependencia actualizada a selectedSupplier

  const estilosBoton = 'h-5 w-14 text-xs font-medium font-inter text-[#00A7E1] border:none bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3]';
  const estilosBotonEliminar = 'h-5 w-14 text-xs font-medium font-inter text-[#FFFFFF] bg-[#ffb2b2] rounded-[16px] hover:bg-[#FAD4D4]';

  const StatusBadge = ({ status }: { status: string }) => {
    const commonClasses = 'flex items-center justify-center w-6 h-6 rounded-full';
    switch (status) {
      case 'enviando':
        return (
          <span
            className={`${commonClasses} bg-[#E2F5FF] text-[#00A7E1]`}
            aria-label="Enviando"
            title="Enviando"
          >
            <Send size={14} />
          </span>
        );
      case 'procesado':
        return (
          <span
            className={`${commonClasses} bg-yellow-100 text-yellow-600 animate-spin`}
            aria-label="Procesado"
            title="Procesado"
          >
            <Loader2 size={14} />
          </span>
        );
      case 'completado':
        return (
          <span
            className={`${commonClasses} bg-green-100 text-green-600`}
            aria-label="Completado"
            title="Completado"
          >
            <Check size={14} />
          </span>
        );
      default:
        return <span className="text-sm">{status}</span>;
    }
  };

  if (categoryLoading || proveedorLoading) {
    return (
      <PrivateRoute>
        <LayoutAdmi>
          <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-8 w-full text-center text-gray-600">
            Cargando...
            <Spinner />
          </div>
        </LayoutAdmi>
      </PrivateRoute>
    );
  }

  if (categoryError) {
    return (
      <PrivateRoute>
        <LayoutAdmi>
          <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-8 w-full text-center text-red-500">
            Error al cargar la categoría: {categoryError}
          </div>
        </LayoutAdmi>
      </PrivateRoute>
    );
  }

  if (!selectedCategory) {
    return (
      <PrivateRoute>
        <LayoutAdmi>
          <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-8 w-full text-center text-gray-600">
            Categoría no encontrada o ID inválido.
          </div>
        </LayoutAdmi>
      </PrivateRoute>
    );
  }

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-8 w-full overflow-hidden">
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar proveedor"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full border-none outline-none"
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
              </div>
              <h1 className="text-xl md:text-2xl lg:text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F] text-center">
                Proveedores de {selectedCategory.name || 'Categoría'}
              </h1>
            </div>

            <div className="rounded-[8px] mt-6 overflow-x-auto">
              <table className="w-full bg-white justify-center rounded-[8px]">
                <thead className="bg-[#FCFCFD] rounded-[8px]">
                  <tr>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">Proveedor</th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">NIT</th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">Correo</th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">Teléfono</th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">Subtotal</th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">IVA</th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">Total</th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">Acciones</th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">Editar</th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">Eliminar</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedoresActuales.length > 0 ? (
                    proveedoresActuales.map((prov) => (
                      <tr
                        key={prov.id}
                        className="border-b text-center border-[#EAECF0] cursor-pointer hover:bg-gray-50"
                        onClick={() => router.push(`/facturas-proveedor/${prov.id}`)}
                      >
                        <td className="px-4 py-2 text-[#6F6F6F] text-sm">{prov.name}</td>
                        <td className="px-4 py-2 text-[#6F6F6F] text-sm">{prov.nit}</td>
                        <td className="px-4 py-2 text-[#6F6F6F] text-sm">{prov.email || 'N/A'}</td>
                        <td className="px-4 py-2 text-[#6F6F6F] text-sm">{prov.phone || 'N/A'}</td>
                        <td className="px-4 py-2 text-[#6F6F6F] text-sm">N/A</td>
                        <td className="px-4 py-2 text-[#6F6F6F] text-sm">N/A</td>
                        <td className="px-4 py-2 text-[#6F6F6F] text-sm">N/A</td>
                        <td className="px-4 py-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/facturas-proveedor/${prov.id}`);
                            }}
                            className={estilosBoton}
                          >
                            Ver Facturas
                          </button>
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleEditarProveedor(prov.id);
                            }}
                            className={estilosBoton}
                          >
                            Editar
                          </button>
                        </td>
                        <td className="px-4 py-2">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              await handleEliminarProveedor(prov.id);
                            }}
                            className={estilosBotonEliminar}
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="px-4 py-4 text-center text-gray-500">
                        No hay proveedores asociados a esta categoría.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4 w-full">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 text-sm font-medium rounded-[25px] border border-[#00A7E1] text-[#00A7E1] hover:bg-[#EDEFF3]"
              >
                Anterior
              </button>
              <span className="text-[#6F6F6F] font-medium text-center">
                Página {currentPage} de {totalPaginas}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPaginas))
                }
                className="px-4 py-2 text-sm font-medium rounded-[25px] border border-[#00A7E1] text-[#00A7E1] hover:bg-[#008ec1]"
              >
                Siguiente
              </button>
            </div>

            <button
              onClick={() => {
                setProveedorPorEditar(null);
                setOpenCreateForm(true);
              }}
              className="mt-[50px] bg-[#00A7E1] font-bold text-white h-8 px-14 text-xs rounded-full hover:bg-[#008ec1]"
            >
              Nuevo Proveedor
            </button>


            <FormCrearProveedor
              isOpen={openCreateForm}
              onClose={() => {
                setOpenCreateForm(false);
                setProveedorPorEditar(null);
                if (categoryId) {
                  fetchCategoryById(categoryId);
                }
              }}
              proveedorExistente={proveedorPorEditar}
              defaultCategoryId={categoryId || undefined}
            />


          </div>
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default CategoriaDetalleProveedores;