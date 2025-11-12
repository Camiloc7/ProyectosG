'use client';

import React, { useState, useEffect } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import Spinner from '@/components/feedback/Spinner';
import { useUserStore } from '@/store/useUser';
import { InfoProveedor } from '@/types/types';
import { useProveedorStore } from '@/store/useProveedorStore';
import PrivateRoute from '@/helpers/PrivateRoute';
import FormCrearProveedor from '@/features/proveedores/formCrearProveedor';
import { CircleOff, File, Search, UserRoundPen } from 'lucide-react';
import { confirm } from '@/components/feedback/ConfirmOption';
import DosFechasModalInput from '@/components/ui/TwoYearsInputModal';

const Proveedores = () => {
  const {
    fetchListaDeProveedores,
    fetchProveedor,
    deleteProveedor,
    proveedor,
    listaDeProveedores,
    retencionesProveedor,
    saldosProveedor,
  } = useProveedorStore();
  const [reteicaOpen, setReteicaOpen] = useState<boolean>(false);
  const [reterentaOpen, setReterentaOpen] = useState<boolean>(false);
  const [proveedores, setProveedores] = useState<InfoProveedor[]>([]);
  const { infoDelUsuario } = useUserStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openCreateForm, setOpenCreateForm] = useState<boolean>(false);
  const [proveedorPorEditar, setProveedorPorEditar] =
    useState<InfoProveedor | null>(null);
  const [retenciones, setRetenciones] = useState<boolean>(false);
  const [saldos, setSaldos] = useState<boolean>(false);
  const [id, setId] = useState<string>();
  const [enviarVisible, setEnviarVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const clientesPorPagina = 10;

  useEffect(() => {
    fetchListaDeProveedores();
  }, []);

  useEffect(() => {
    if (listaDeProveedores) {
      setProveedores(listaDeProveedores.reverse());
    }
  }, [listaDeProveedores]);

  useEffect(() => {
    // Deshabilitar scroll cuando el formulario esté abierto
    if (openCreateForm) {
      document.body.style.overflow = 'hidden'; // Deshabilitar scroll
    } else {
      document.body.style.overflow = 'auto'; // Restaurar el scroll de manera explícita
    }

    // Cleanup: Restaurar el scroll al desmontar o cambiar el estado
    return () => {
      document.body.style.overflow = 'auto'; // Asegurarse de que siempre se restaure
    };
  }, [openCreateForm]);

  const handleEnviar = (id: string) => {
    setId(id);
    setEnviarVisible(true);
  };

  const handleSubmitRetenciones = async (event: any) => {
    event.preventDefault(); // Evita la recarga de la página
    retencionesProveedor(id, date, email);

    setId('');
    setDate('');
    setEmail('');
    setRetenciones(false);
  };

  const handleSubmitSaldos = async (event: any) => {
    event.preventDefault(); // Evita la recarga de la página
    saldosProveedor(id, date, email);

    setId('');
    setDate('');
    setEmail('');
    setSaldos(false);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
    setSearchQuery(event.target.value);
  };

  const filteredClientes = proveedores.filter((proveedor) => {
    const query = searchQuery.toLowerCase();
    return (
      proveedor.nombre.toLowerCase().includes(query) ||
      proveedor.correo.toLowerCase().includes(query) ||
      proveedor.nit.toLowerCase().includes(query)
    );
  });

  const totalPaginas = Math.ceil(filteredClientes.length / clientesPorPagina);
  const indexInicio = (currentPage - 1) * clientesPorPagina;
  const indexFinal = indexInicio + clientesPorPagina;
  const clientesActuales = filteredClientes.slice(indexInicio, indexFinal);

  const handleEliminarProveedor = async (nit: string) => {
    const confirmado = await confirm({
      title: '¿Estás seguro de que deseas eliminar este proveedor?',
    });
    if (confirmado) {
      await deleteProveedor(nit);
    }
  };

  const handleEditarProveedor = async (nit: string) => {
    await fetchProveedor(nit);
    setOpenCreateForm(true);
  };

  useEffect(() => {
    if (proveedor) {
      setProveedorPorEditar(proveedor);
    } else {
      setProveedorPorEditar(null);
    }
  }, [proveedor]);

  const estilosBoton =
    'h-5 w-14 text-xs font-medium font-inter text-[#00A7E1] border:none bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3]';

  const estilosBotonEliminar =
    'h-5 w-14 text-xs font-medium font-inter text-[#FFFFFF] bg-[#ffb2b2] rounded-[16px] hover:bg-[#FAD4D4]';
  const estilosBotonesDeAccion =
    'bg-white text-[#00A7E1] text-sm font-semibold px-[16px] py-[6px] w-24 h-8 rounded-[20px] hover:bg-[#EDEFF3] transition-all sm:w-32 ';

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
                Lista de Proveedores
              </h1>
              <h2 className="text-base font-montserrat font-normal text-[#6F6F6F] text-right">
                {infoDelUsuario?.nombre ?? 'Nombre del usuario'}
              </h2>
            </div>

            {/* Botones de accion */}
            <div className="flex flex-wrap items-center gap-4 mt-4 justify-center sm:justify-start">
              <button
                className={estilosBotonesDeAccion}
                onClick={() => setReterentaOpen(true)}
              >
                Reterenta
              </button>
              <DosFechasModalInput
                isOpen={reterentaOpen}
                onClose={() => setReterentaOpen(false)}
                title="Informe Reterenta"
                onSubmitData={(data) => {
                  // resumenDeCompras(data);
                  setReterentaOpen(false);
                }}
              />
              <button
                className={estilosBotonesDeAccion}
                onClick={() => setReteicaOpen(true)}
              >
                Reteica
              </button>
              <DosFechasModalInput
                isOpen={reteicaOpen}
                onClose={() => setReteicaOpen(false)}
                title="Informe Reteica"
                onSubmitData={(data) => {
                  // resumenDeCompras(data);
                  setReteicaOpen(false);
                }}
              />
            </div>

            <div className="rounded-[8px] mt-6 overflow-x-auto">
              <table className="w-full bg-white justify-center rounded-[8px]">
                <thead className="bg-[#FCFCFD] rounded-[8px]">
                  <tr>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      Proveedor
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      Correo
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      Teléfono
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      NIT
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      Cuenta
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      DV
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      Direccion
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      Notificaciones
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      Editar
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      Eliminar
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {clientesActuales.map((cliente) => (
                    <tr
                      key={cliente.id}
                      className="border-b text-center border-[#EAECF0]"
                    >
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.nombre}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.correo}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.telefono}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.nit}
                      </td>

                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.numeroc}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.dv}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.direccion}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.notificacion}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            await handleEditarProveedor(cliente.nit);
                            setOpenCreateForm(true);
                          }}
                          className={estilosBoton}
                        >
                          Editar
                        </button>
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        <button
                          onClick={async (e) => {
                            e.preventDefault();
                            await handleEliminarProveedor(cliente.nit);
                          }}
                          className={estilosBotonEliminar}
                        >
                          Eliminar
                        </button>
                      </td>

                      {/* ----------------------------------------------------------------------------------- */}
                      <td className="flex items-center space-x-2 justify-center  h-10">
                        <CircleOff
                          onClick={() => {
                            setId(cliente.id);
                            setRetenciones(true);
                          }}
                          className="w-4 h-4 text-red-600"
                        />
                        <UserRoundPen
                          onClick={() => handleEnviar(cliente.id)}
                          className="w-4 h-4 text-green-600"
                        />
                        <File
                          onClick={() => {
                            setId(cliente.id);
                            setSaldos(true);
                          }}
                          className="w-4 h-4 text-blue-900"
                        />
                      </td>
                    </tr>
                  ))}
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
                className="px-4 py-2 text-sm font-medium rounded-[25px] border border-[#00A7E1] text-[#00A7E1] hover:bg-[#EDEFF3]"
              >
                Siguiente
              </button>
            </div>
            {/* Botón para agregar proveedor */}
            <button
              onClick={(e) => {
                e.preventDefault(); // Evita la recarga de la página
                setProveedorPorEditar(null);
                setOpenCreateForm(true);
              }}
              className="mt-[50px] bg-[#00A7E1] font-bold text-white h-8 px-14 text-xs rounded-full hover:bg-[#008ec1]"
            >
              Nuevo Proveedor
            </button>

            {/* Modal 1er boton */}
            {retenciones && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
                onClick={() => {
                  setRetenciones(false);
                }}
              >
                <div
                  className="bg-white p-6 rounded-lg shadow-lg w-96 "
                  onClick={(e) => e.stopPropagation()} // Evita que el evento cierre el modal al hacer clic dentro de él
                >
                  <form onSubmit={handleSubmitRetenciones}>
                    <h2 className="text-lg font-bold text-gray-800 mb-4">
                      Ingresa la fecha
                    </h2>
                    <input
                      type="date"
                      name="date"
                      placeholder="date"
                      className={`w-full h-10 px-4 border rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 border-[#00A7E1] focus:outline-none shadow-sm`}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                    <h2 className="text-lg font-bold text-gray-800 mt-4">
                      Ingresa email
                    </h2>
                    <input
                      type="email"
                      name="email"
                      placeholder="E-mail"
                      className={`w-full h-10 px-4 border rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 border-[#00A7E1] focus:outline-none shadow-sm mt-4`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <div className="flex justify-center gap-4 mt-4">
                      <button
                        type="button"
                        className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                        onClick={() => {
                          setRetenciones(false);
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-blueQ text-white h-11  hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]"
                      >
                        Continuar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal 2do boton */}
            {enviarVisible && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
                onClick={() => {
                  setEnviarVisible(false);
                }}
              >
                <div
                  className="bg-white p-6 rounded-lg shadow-lg w-96 "
                  onClick={(e) => e.stopPropagation()} // Evita que el evento cierre el modal al hacer clic dentro de él
                >
                  <h2 className="text-lg font-bold text-gray-800 mb-4  ">
                    Ingresa el correo electrónico
                  </h2>
                  <form onSubmit={handleSubmitRetenciones}>
                    <input
                      type="email"
                      name="email"
                      placeholder="E-mail"
                      className={`w-full h-10 px-4 border rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 border-[#00A7E1] focus:outline-none shadow-sm`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <div className="flex justify-center gap-4 mt-4">
                      <button
                        type="button"
                        className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                        onClick={() => {
                          setEnviarVisible(false);
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-blueQ text-white h-11  hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]"
                      >
                        Continuar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal 3er boton */}
            {saldos && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
                onClick={() => {
                  setSaldos(false);
                }}
              >
                <div
                  className="bg-white p-6 rounded-lg shadow-lg w-96 "
                  onClick={(e) => e.stopPropagation()} // Evita que el evento cierre el modal al hacer clic dentro de él
                >
                  <form onSubmit={handleSubmitSaldos}>
                    <h2 className="text-lg font-bold text-gray-800 mb-4  ">
                      Ingresa el correo electrónico
                    </h2>
                    <input
                      type="date"
                      name="date"
                      placeholder="date"
                      className={`w-full h-10 px-4 border rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 border-[#00A7E1] focus:outline-none shadow-sm`}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                    <h2 className="text-lg font-bold text-gray-800 mt-4">
                      Ingresa email
                    </h2>
                    <input
                      type="email"
                      name="email"
                      placeholder="E-mail"
                      className={`w-full h-10 px-4 border rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 border-[#00A7E1] focus:outline-none shadow-sm mt-4`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    <div className="flex justify-center gap-4 mt-4">
                      <button
                        type="button"
                        className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                        onClick={() => {
                          setSaldos(false);
                        }}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="bg-blueQ text-white h-11  hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]"
                      >
                        Continuar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <FormCrearProveedor
              isOpen={openCreateForm}
              onClose={() => setOpenCreateForm(false)}
              // proveedorExistente={proveedorPorEditar}
            />
          </div>
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default Proveedores;
