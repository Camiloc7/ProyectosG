'use client';

import React, { useState, useMemo } from 'react';
import PrivateRoute from '@/helpers/PrivateRoute';
import { ItemsVenta, ItemsVentaFront } from '@/types/types';
import SimpleSelect from '@/components/ui/SimpleSelect';
import { Package, Search } from 'lucide-react';
import FormItemDeVenta from '@/features/itemsDeVenta/FormItemVenta';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import Spinner from '@/components/feedback/Spinner';
import { confirm } from '@/components/feedback/ConfirmOption';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';
import AdminLayoutRestaurante from '../../AdminLayout';
import FormItemMenu from '@/features/restaurante/FormProductoMenu';

const ITEMS_PER_PAGE = 15;

const ItemsDeVenta: React.FC = () => {
  const { categoriasVentas } = useDatosExtraStore();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [listaDeItems, setListaDeItems] = useState<any>([
    {
      id: '1',
      codigo: 'A101',
      descripcion: 'Coca Cola 500ml',
      cantidad: 50,
      total: 75,
      idCategoria: 1,
      urlImagen: '',
    },
    {
      id: '2',
      codigo: 'A102',
      descripcion: 'Sprite 500ml',
      cantidad: 30,
      total: 60,
      idCategoria: 1,
      urlImagen: '',
    },
    {
      id: '3',
      codigo: 'B201',
      descripcion: 'Hamburguesa Clásica',
      cantidad: 20,
      total: 200,
      idCategoria: 2,
      urlImagen: '',
    },
    {
      id: '4',
      codigo: 'B202',
      descripcion: 'Pizza Margarita',
      cantidad: 10,
      total: 150,
      idCategoria: 2,
      urlImagen: '',
    },
    {
      id: '5',
      codigo: 'C301',
      descripcion: 'Empanadas de Carne',
      cantidad: 25,
      total: 100,
      idCategoria: 3,
      urlImagen: '',
    },
    {
      id: '6',
      codigo: 'D401',
      descripcion: 'Flan con Dulce de Leche',
      cantidad: 12,
      total: 90,
      idCategoria: 4,
      urlImagen: '',
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [id, setId] = useState('');

  // Filtrar items por categoría si se selecciona alguna

  const filteredItems = listaDeItems.filter((item: any) => {
    const query = searchQuery.toLowerCase();

    // Filtro por búsqueda (Código, cantidad, total o descripción)
    const matchesSearch =
      (item.codigo && item.codigo.toString().includes(query)) ||
      (item.cantidad && item.cantidad.toString().includes(query)) ||
      (item.total && item.total.toString().includes(query)) ||
      (item.descripcion && item.descripcion.toLowerCase().includes(query));

    // Filtro por idCategoria
    if (categoriaSeleccionada) {
    }
    const matchesCategoriasSeleccionadas =
      categoriaSeleccionada === 0 || item.idCategoria === categoriaSeleccionada;

    return matchesSearch && matchesCategoriasSeleccionadas;
  });

  // Calcular la paginación
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredItems]);

  const categoriasConTodas = [
    { nombre: 'Categorias', id: '0' },
    ...categoriasVentas.map((categoria) => ({
      ...categoria, // Aquí es donde ocurre el problema
      id: categoria.id.toString(),
    })),
  ];

  const handleOpenCard = async (id: string | undefined) => {
    if (!id) {
      showErrorToast('No hay id disponible');
      return;
    }
    setId(id);
    setIsFormOpen(true);
  };

  const handleCloseItemForm = () => {
    setIsFormOpen(false);
    setId('');
  };

  const handleEliminarItem = async (id: string | undefined) => {
    if (!id) {
      showErrorToast('No hay id disponible');
      return;
    }
    const confirmado = await confirm({
      title: '¿Estás seguro que querés eliminar este item?',
      message: 'Esta accion es permanente',
    });

    if (confirmado) {
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
    setSearchQuery(event.target.value);
  };

  const estilosBotonesDeAccion =
    'bg-white text-[#00A7E1] text-sm font-semibold px-[16px] py-[6px] w-24 h-8 rounded-[20px] hover:bg-[#EDEFF3] transition-all sm:w-32 ';

  return (
    <PrivateRoute>
      <AdminLayoutRestaurante>
        <div className="bg-[#F7F7F7] pt-12 p-6 sm:p-8 w-full">
          <div className="">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Barra de búsqueda */}
              <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar Producto"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full border-none outline-none"
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
              </div>

              {/* H1 Lista de facturas */}
              <h1 className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none">
                Menu
              </h1>
            </div>

            {/* Botones de accion */}
            <div className="flex flex-wrap items-center gap-4 mt-4 justify-center sm:justify-start">
              <button
                onClick={() => {
                  setIsFormOpen(true);
                }}
                className=" ml-auto bg-[#00A7E1] font-bold text-white h-8 px-14 text-xs rounded-full hover:bg-[#008ec1]"
              >
                Crear Item
              </button>

              <div className="w-[20%]">
                <SimpleSelect
                  options={categoriasConTodas}
                  width={'100%'}
                  value={categoriaSeleccionada}
                  onChange={(value) => {
                    setCategoriaSeleccionada(Number(value));
                  }}
                  height="8"
                />
              </div>
            </div>

            {/* Tarjetas de items */}
            <div className="w-[100%] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 justify-items-center mt-10 ">
              {paginatedItems.map((item: any) => (
                <div
                  key={item.codigo}
                  onClick={() => {
                    handleOpenCard(item.id);
                  }}
                  className="w-64 bg-white p-4 rounded-2xl shadow-lg cursor-pointer border border-gray-200 hover:shadow-xl"
                >
                  {item.urlImagen ? (
                    <img
                      src={item.urlImagen}
                      alt={item.descripcion}
                      className="w-full h-40 object-contain rounded-t"
                    />
                  ) : (
                    <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-t">
                      <Package className="w-10 h-10 text-gray-400" />{' '}
                      {/* Lucide ícono de caja */}
                    </div>
                  )}

                  <div
                    className="p-4"
                    onClick={(e) => {
                      e.stopPropagation(); // Evitar que el clic se propague al contenedor
                    }}
                  >
                    <h2 className="text-base text-gray-500 leading-snug truncate">
                      <span className="text-gray-400 select-none">
                        Código:{' '}
                      </span>
                      <span
                        onClick={(e) => {
                          e.stopPropagation(); // Evitar propagación
                          if (item.codigo) {
                            navigator.clipboard
                              .writeText(String(item.codigo))
                              .then(() =>
                                showTemporaryToast('Copiado al portapapeles')
                              )
                              .catch((err) =>
                                console.error(
                                  'Error al copiar al portapapeles:',
                                  err
                                )
                              );
                          }
                        }}
                        className="cursor-pointer hover:underline tooltip"
                        title="Haz clic para copiar"
                      >
                        {item.codigo}
                      </span>
                    </h2>

                    <h1
                      className="text-xl font-semibold text-gray-800 mb-1 leading-snug truncate tooltip"
                      title={item.descripcion}
                    >
                      {item.descripcion}
                    </h1>

                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium text-gray-700">
                        Unidades:{' '}
                      </span>
                      {item.cantidad}
                    </p>

                    <p className="text-sm text-gray-600 mb-3">
                      <span className="font-medium text-gray-700">Total:</span>{' '}
                      ${item.total}
                    </p>

                    <div className="flex justify-between gap-2 mt-2">
                      <button
                        onClick={() => {
                          handleOpenCard(item.id);
                        }}
                        className="h-6 w-full text-xs font-medium font-inter text-[#00A7E1] bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3]"
                      >
                        Ver
                      </button>
                      {/* <button className="h-6 w-full text-xs font-medium font-inter text-[#008F4C] bg-[#E2FCE5] rounded-[16px] hover:bg-[#E6F5E9]">
                      Editar
                    </button> */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          handleEliminarItem(item.id);
                        }}
                        className="h-6 w-full text-xs font-medium font-inter text-[#D7263D] bg-[#FFE3E3] rounded-[16px] hover:bg-[#F8D1D1]"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginación */}
            <div className="mt-8 flex justify-center items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="bg-[#00A7E1] font-bold text-white h-8 px-4 text-xs rounded-full hover:bg-[#008ec1]"
              >
                Anterior
              </button>
              <span className="px-3 py-1">
                Página {currentPage} de {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="bg-[#00A7E1] font-bold text-white h-8 px-4 text-xs rounded-full hover:bg-[#008ec1]"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
        <FormItemMenu
          isOpen={isFormOpen}
          onClose={handleCloseItemForm}
          id={id}
        />
      </AdminLayoutRestaurante>
    </PrivateRoute>
  );
};

export default ItemsDeVenta;
