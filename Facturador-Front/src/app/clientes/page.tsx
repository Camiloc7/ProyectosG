'use client';

import React, { useState, useEffect } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import { useClientStore } from '@/store/useClientStore';
import Spinner from '@/components/feedback/Spinner';
import { useUserStore } from '@/store/useUser';
import { CircleOff, File, Search, UserRoundPen } from 'lucide-react';
import { InfoClientes } from '@/types/types';
import FormCreacionCliente from '@/features/clientes/formCreacionCliente';
import { useDatosExtraStore } from '@/store/useDatosExtraStore';
import PrivateRoute from '@/helpers/PrivateRoute';
import { showErrorToast } from '@/components/feedback/toast';

const Clientes = () => {
  const {
    listaDeClientes,
    fetchListaDeClientes,
    loading: loadingClientes,
  } = useClientStore();
  const { fetchTiposDeDocumentos, fetchResponsabilidadesFiscales, documentos } =
    useDatosExtraStore();
  const [clientes, setClientes] = useState<InfoClientes[]>([]);
  const { infoDelUsuario } = useUserStore();
  const [id, setId] = useState<string>();
  const [enviarVisible, setEnviarVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [email, setEmail] = useState('');
  const [date, setDate] = useState('');
  const [pedirFecha, setPedirFecha] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [clientePorEditar, setClientePorEditar] = useState<InfoClientes | null>(
    null
  );
  const [editarClienteAbierto, setEditarClienteAbierto] = useState(false);
  const clientesPorPagina = 10;

  useEffect(() => {
    fetchListaDeClientes();
    fetchTiposDeDocumentos();
    fetchResponsabilidadesFiscales();
  }, []);

  const handleFetch = () => {
    fetchTiposDeDocumentos();
    fetchListaDeClientes();
  };

  useEffect(() => {
    if (listaDeClientes) {
      setClientes(listaDeClientes.reverse());
    }
  }, [listaDeClientes]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
    setSearchQuery(event.target.value);
  };

  const filteredClientes = clientes.filter((cliente) => {
    const query = searchQuery.toLowerCase();
    return (
      cliente.cliente.toLowerCase().includes(query) ||
      cliente.correo.toLowerCase().includes(query) ||
      cliente.documento.toLowerCase().includes(query)
    );
  });

  const totalPaginas = Math.ceil(filteredClientes.length / clientesPorPagina);
  const indexInicio = (currentPage - 1) * clientesPorPagina;
  const indexFinal = indexInicio + clientesPorPagina;
  const clientesActuales = filteredClientes.slice(indexInicio, indexFinal);

  const handleEditarCliente = (id: string) => {
    const cliente = listaDeClientes.find((x) => x.id === id) || null;
    setClientePorEditar(cliente);
    setEditarClienteAbierto(true);
  };

  const handleSubmit = (event: any) => {
    event.preventDefault(); // Evita la recarga de la página
    // sendFacturaMail(email, Number(id));
    setEnviarVisible(false);
  };

  const handleEnviar = (id: string) => {
    setId(id);
    setEnviarVisible(true);
  };

  const estilosBoton =
    'h-5 w-14 text-xs font-medium font-inter text-[#00A7E1] border:none bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3]';

  const estilosBotonesDeAccion =
    'bg-white text-[#00A7E1] text-sm font-semibold px-[16px] py-[6px] w-24 h-8 rounded-[20px] hover:bg-[#EDEFF3] transition-all sm:w-32 ';

  const handleEnProduccion = () => {
    showErrorToast('Botón en producción, gracias por su comprensión.');
  };
  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-8 w-full overflow-hidden">
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar cliente"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full border-none outline-none"
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
              </div>
              <h1
                onClick={handleFetch}
                className="text-xl ml-24 mr-auto md:text-2xl lg:text-3xl leading-9 font-bold font-montserrat text-[#6F6F6F] text-center"
              >
                Lista de Clientes
              </h1>
            </div>

            {/* Botones de accion */}
            <div className="flex flex-wrap items-center gap-4 mt-4 justify-center sm:justify-start">
              <button
                onClick={handleEnProduccion}
                className={estilosBotonesDeAccion}
              >
                Copiar
              </button>
              <button
                onClick={handleEnProduccion}
                className={estilosBotonesDeAccion}
              >
                CSV
              </button>
              <button
                onClick={handleEnProduccion}
                className={estilosBotonesDeAccion}
              >
                Excel
              </button>
              <button
                onClick={handleEnProduccion}
                className={estilosBotonesDeAccion}
              >
                PDF
              </button>

              <button
                onClick={handleEnProduccion}
                className={estilosBotonesDeAccion}
              >
                Print
              </button>

              <button
                onClick={handleEnProduccion}
                className={estilosBotonesDeAccion}
              >
                Visibilidad
              </button>
              <button
                onClick={handleEnProduccion}
                className={estilosBotonesDeAccion}
              >
                Importar
              </button>
            </div>

            <div className="rounded-[8px] mt-6 overflow-x-auto">
              <table className="w-full bg-white justify-center rounded-[8px]">
                <thead className="bg-[#FCFCFD] rounded-[8px]">
                  <tr>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      Cliente
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
                      Codigo
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
                      Acciones
                    </th>
                    <th className="px-4 py-2 text-sm font-medium text-[#667085]">
                      Editar
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
                        {cliente.cliente}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.correo}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.telefono}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.documento}
                      </td>

                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.codigo}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.dv}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm ">
                        {cliente.direccion}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {cliente.notificaciones}
                      </td>
                      <td className="flex items-center space-x-2 justify-center  h-10">
                        <CircleOff
                          onClick={() => {
                            setPedirFecha(true);
                          }}
                          className="w-4 h-4 text-red-600"
                        />
                        <UserRoundPen
                          onClick={() => handleEnviar(cliente.id)}
                          className="w-4 h-4 text-green-600"
                        />
                        <File
                          onClick={() => {
                            setPedirFecha(true);
                          }}
                          className="w-4 h-4 text-blue-900"
                        />
                      </td>

                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        <button
                          onClick={() => handleEditarCliente(cliente.id)}
                          className={estilosBoton}
                        >
                          Editar
                        </button>
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
          </div>
        </div>

        {/* Modal de enviar */}
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
              <form onSubmit={handleSubmit}>
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

        {/* Modal Que pide el año */}
        {pedirFecha && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
            onClick={() => {
              setPedirFecha(false);
            }}
          >
            <div
              className="bg-white p-6 rounded-lg shadow-lg w-96 "
              onClick={(e) => e.stopPropagation()} // Evita que el evento cierre el modal al hacer clic dentro de él
            >
              <h2 className="text-lg font-bold text-gray-800 mb-4  ">
                Ingresa la fecha
              </h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="date"
                  name="date"
                  placeholder="date"
                  className={`w-full h-10 px-4 border rounded-[25px] text-[#6F6F6F] text-sm focus:ring-blue-300 border-[#00A7E1] focus:outline-none shadow-sm`}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
                <div className="flex justify-center gap-4 mt-4">
                  <button
                    type="button"
                    className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                    onClick={() => {
                      setPedirFecha(false);
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

        <FormCreacionCliente
          isOpen={editarClienteAbierto}
          onClose={() => setEditarClienteAbierto(false)}
          clienteExistente={clientePorEditar}
        />
        {loadingClientes ? <Spinner /> : null}
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default Clientes;
