'use client';

import Spinner from '@/components/feedback/Spinner';
import React, { useState, useEffect, useMemo } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import { Search } from 'lucide-react';
import { usePagosStore } from '@/store/usePagosStore'; // Asegúrate de tener un store para los pagos
import { useUserStore } from '@/store/useUser';
import { InfoListaPagos } from '@/types/types';
import FormPagos from '@/features/pagos/formPagos';
import FormCuenta from '@/features/pagos/formCuenta';
import SimpleSelect from '@/components/ui/SimpleSelect';
import PrivateRoute from '@/helpers/PrivateRoute';
import {
  showErrorToast,
  showTemporaryToast,
} from '@/components/feedback/toast';
import BotonQuality from '@/components/ui/BotonQuality';
import { useCausativoStore } from '@/store/useCausativoStore';

const Pagos = () => {
  const {
    listaDePagos,
    listaDeCuentas,
    fetchListaDePagos,
    loadingListaPagos,
    fetchCuentas,
    generarCausativo,
    actualizarDatosLista,
    loading,
  } = usePagosStore();
  const { traerCausativo } = useCausativoStore();
  const [pagos, setPagos] = useState<InfoListaPagos[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [idDeLaFactura, setIdDeLaFactura] = useState('');
  const [formClienteAbierto, setFormClienteAbierto] = useState(false);
  const [formBancoAbierto, setFormBancoAbierto] = useState(false);
  const [modalSubirArchivo, setModalSubirArchivo] = useState(false);
  const [loadingCausativos, setLoadingCausativos] = useState(false);
  const [progresoCausativos, setProgresoCausativos] = useState({
    actual: 0,
    total: 0,
  });

  const listaDeCuentasConCrear = useMemo(() => {
    return [...listaDeCuentas, { id: 'crear', nombre: 'Crear cuenta' }];
  }, [listaDeCuentas]);
  const [cuentasSeleccionadas, setCuentasSeleccionadas] = useState<{
    [key: string]: string;
  }>({});
  const [editablePagos, setEditablePagos] = useState<InfoListaPagos[]>([]);
  const pagosPorPagina = 10;

  useEffect(() => {
    if (listaDePagos) {
      const cuentasIniciales = listaDePagos.reduce((acc, pago) => {
        acc[pago.numeroDefactura] = pago.idDeCuenta || '';
        return acc;
      }, {} as { [key: string]: string });
      setCuentasSeleccionadas(cuentasIniciales);
      setPagos(listaDePagos);
      setEditablePagos(
        listaDePagos.map((pago) => ({
          ...pago,
          valor1305: pago.valor1305,
          valor1110: pago.valor1110,
          diferencia: pago.diferencia,
        }))
      );
    }
  }, [listaDePagos]);

  useEffect(() => {
    fetchCuentas();
    fetchListaDePagos();
  }, []);

  useEffect(() => {
    const isAnyModalOpen =
      formClienteAbierto || formBancoAbierto || modalSubirArchivo;

    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden'; // Deshabilitar scroll
    } else {
      document.body.style.overflow = ''; // Habilitar scroll
    }

    // Limpieza para evitar problemas
    return () => {
      document.body.style.overflow = '';
    };
  }, [formClienteAbierto, formBancoAbierto, modalSubirArchivo]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
    setSearchQuery(event.target.value);
  };

  const filteredPagos = pagos.filter((pago) => {
    const query = searchQuery.toLowerCase();
    return (
      (pago.prefijo?.toLowerCase() || '').includes(query) ||
      (pago.fecha?.toLowerCase() || '').includes(query) ||
      (pago.contrato?.toLowerCase() || '').includes(query) ||
      (pago.consecutivo?.toString() || '').includes(query)
    );
  });

  const totalPaginas = Math.ceil(filteredPagos.length / pagosPorPagina);
  const indexInicio = (currentPage - 1) * pagosPorPagina;
  const indexFinal = indexInicio + pagosPorPagina;
  const pagosActuales = filteredPagos.slice(indexInicio, indexFinal);

  //Este es la funcion que ocurre cuando se presiona el titulo de lapagina
  const handleFetch = () => {
    fetchListaDePagos();
    fetchCuentas();
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPaginas));
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleAbrirFactura = (url: string) => {
    window.open(url, '_blank');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      console.error('No se seleccionó un archivo.');
      return;
    }
    setModalSubirArchivo(false);
  };

  const handleFormPagada = (id: string) => {
    setIdDeLaFactura(id);
    setFormClienteAbierto(true);
  };

  const handleCuentaChange = (numeroDefactura: string, value: string) => {
    setCuentasSeleccionadas((prev) => ({
      ...prev,
      [numeroDefactura]: value,
    }));

    if (value === 'crear') {
      setFormBancoAbierto(true);
    }
  };

  const handleAbrirCausativo = (id: string) => {
    // if (url === '---') {
    if (!cuentasSeleccionadas || !id) {
      console.error('Error: cuentasSeleccionadas o id no están definidos');
      return;
    }

    const cuentaSeleccionada = cuentasSeleccionadas[id];

    if (!cuentaSeleccionada || cuentaSeleccionada === '---') {
      showErrorToast('Debe seleccionar una cuenta');
      return;
    }

    if (!cuentaSeleccionada) {
      console.error('No se encontro el nombre de la cuenta');
      return;
    }
    generarCausativo(cuentaSeleccionada, id);
    // } else {
    //   window.open(url, '_blank');
    // }
  };

  const handleActualizarDatos = async (numeroDefactura: string) => {
    const pagoActualizado = editablePagos.find(
      (p) => p.numeroDefactura === numeroDefactura
    );
    if (pagoActualizado) {
      await actualizarDatosLista(
        pagoActualizado.valor1305,
        pagoActualizado.clave1305
      );
      await actualizarDatosLista(
        pagoActualizado.valor1110,
        pagoActualizado.clave1110
      );
      fetchListaDePagos();
      showTemporaryToast('Datos actualizados correctamente');
    }
  };

  const handleInputChange = (
    numeroDefactura: string,
    field: string,
    value: string
  ) => {
    setEditablePagos((prev) =>
      prev.map((pago) =>
        pago.numeroDefactura === numeroDefactura
          ? { ...pago, [field]: value }
          : pago
      )
    );
  };

  const handleCausativos = async () => {
    try {
      setLoadingCausativos(true);

      // Filtrar solo los pagos de esta página que necesitan causativo
      const pagosPendientes = pagosActuales.filter(
        (pago) =>
          !editablePagos
            .find((ep) => ep.numeroDefactura === pago.numeroDefactura)
            ?.valor1305?.trim()
      );

      if (pagosPendientes.length === 0) {
        showErrorToast('No datos faltantes en esta pagina');
        setLoadingCausativos(false);
        return;
      }

      setProgresoCausativos({ actual: 0, total: pagosPendientes.length });

      let contador = 0;
      for (const pago of pagosPendientes) {
        if (!pago.numeroDefactura) {
          console.warn(`El pago no tiene número de factura válido`, pago);
          contador++;
          setProgresoCausativos({
            actual: contador,
            total: pagosPendientes.length,
          });
          continue;
        }

        await traerCausativo(pago.numeroDefactura);

        contador++;
        setProgresoCausativos({
          actual: contador,
          total: pagosPendientes.length,
        });
      }
      setLoadingCausativos(false);
      await fetchListaDePagos();
      showTemporaryToast('Causativos procesados correctamente');
    } catch (error) {
      console.error('Error al generar causativos:', error);
      showErrorToast('Ocurrió un error al generar los causativos');
    } finally {
      setLoadingCausativos(false);
      setProgresoCausativos({ actual: 0, total: 0 });
    }
  };

  const estilosBoton =
    'h-5 w-14 text-xs font-medium font-inter text-[#00A7E1] border:none bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3]';

  const estilosBotonVerde =
    'h-5 w-14 text-xs font-medium font-inter text-[#34D399] border-[#A7F3D0]  rounded-[16px] hover:bg-[#EDEFF3]';

  return (
    <PrivateRoute>
      <LayoutAdmi>
        {loadingCausativos && (
          <div className="fixed inset-0 flex flex-col justify-center items-center bg-white bg-opacity-50 z-50 space-y-4">
            <div className="w-12 h-12 border-4 border-t-4 border-gray-200 border-t-blueQ rounded-full animate-spin"></div>
            <h1 className="text-lg font-semibold text-gray-700">
              {progresoCausativos.actual} de {progresoCausativos.total}{' '}
              completados
            </h1>
          </div>
        )}

        <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-8 w-full overflow-hidden">
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar pago"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full border-none outline-none"
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
              </div>
              <h1
                onClick={handleFetch}
                className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none"
              >
                Lista de Pagos de Venta
              </h1>
              <BotonQuality
                label="Generar datos de la cuenta 130505"
                onClick={handleCausativos}
              />
            </div>

            {/* Tabla de pagos */}
            <div className="rounded-[8px] mt-6 overflow-x-auto">
              <table className="w-full bg-white justify-center rounded-[8px]">
                <thead className="bg-[#FCFCFD] rounded-[8px]">
                  <tr>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      Prefijo
                    </th>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      Consecutivo
                    </th>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      Contrato
                    </th>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      Vencimiento
                    </th>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      N.Cuenta
                    </th>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      Pagada
                    </th>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      Cuenta 130505
                    </th>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      Bancos 112005
                    </th>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      Diferencia
                    </th>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      Accion
                    </th>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      Anulado
                    </th>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      Recibo
                    </th>
                    <th className="px-4 py-2 font-medium text-[#667085] text-sm">
                      Causativo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagosActuales.map((pago) => (
                    <tr
                      key={pago.numeroDefactura}
                      className="border-b text-center border-[#EAECF0]"
                    >
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {pago.prefijo}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {pago.consecutivo}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {pago.contrato}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {pago.fecha}
                      </td>

                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        <SimpleSelect
                          options={listaDeCuentasConCrear}
                          placeholder=""
                          width={'80%'}
                          value={
                            cuentasSeleccionadas[pago.numeroDefactura] || ''
                          }
                          onChange={(value) =>
                            handleCuentaChange(pago.numeroDefactura, value)
                          }
                        />
                      </td>

                      {/* Pagada */}
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        <button
                          onClick={() => handleFormPagada(pago.numeroDefactura)}
                          className={estilosBoton}
                        >
                          Form
                        </button>
                      </td>

                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        <input
                          type="text"
                          value={
                            editablePagos.find(
                              (p) => p.numeroDefactura === pago.numeroDefactura
                            )?.valor1305 || ''
                          }
                          onChange={(e) =>
                            handleInputChange(
                              pago.numeroDefactura,
                              'valor1305',
                              e.target.value
                            )
                          }
                          className="border rounded p-1 max-w-[100px]"
                        />
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        <input
                          type="text"
                          value={
                            editablePagos.find(
                              (p) => p.numeroDefactura === pago.numeroDefactura
                            )?.valor1110 || ''
                          }
                          onChange={(e) =>
                            handleInputChange(
                              pago.numeroDefactura,
                              'valor1110',
                              e.target.value
                            )
                          }
                          className="border rounded p-1 max-w-[100px]"
                        />
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {pago.diferencia}
                      </td>

                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        <button
                          onClick={() =>
                            handleActualizarDatos(pago.numeroDefactura)
                          }
                          className={estilosBotonVerde}
                        >
                          Guardar
                        </button>
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        {pago.anulado}
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        <button
                          onClick={() => handleAbrirFactura(pago.pdfFactura)}
                          className={estilosBoton}
                        >
                          Recibo
                        </button>
                      </td>
                      <td className="px-4 py-2 text-[#6F6F6F] text-sm">
                        <button
                          onClick={() =>
                            handleAbrirCausativo(pago.numeroDefactura)
                          }
                          className={estilosBoton}
                        >
                          {pago.causativo === '---' ? 'Generar' : 'Abrir'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Filas vacías para completar 10 elementos */}
                  {Array.from({
                    length: Math.max(0, pagosPorPagina - pagosActuales.length),
                  }).map((_, index) => (
                    <tr
                      key={`empty-${index}`}
                      className="border-b border-[#EAECF0] h-[40px]"
                    >
                      <td colSpan={6} className="bg-white"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {loading || loadingListaPagos ? <Spinner /> : ''}
            </div>

            {/* Controles de paginación */}
            <div className="flex justify-between items-center mt-4 w-full">
              <button
                onClick={handlePreviousPage}
                className="px-4 py-2 text-sm font-medium rounded-[25px] border border-[#00A7E1] text-[#00A7E1] hover:bg-[#EDEFF3]"
              >
                Anterior
              </button>
              <span className="text-[#6F6F6F] font-medium text-center">
                Página {currentPage} de {totalPaginas}
              </span>
              <button
                onClick={handleNextPage}
                className="px-4 py-2 text-sm font-medium rounded-[25px] border border-[#00A7E1] text-[#00A7E1] hover:bg-[#EDEFF3]"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
        <FormPagos
          isOpen={formClienteAbierto}
          id={idDeLaFactura}
          onClose={() => setFormClienteAbierto(false)}
        />
        <FormCuenta
          isOpen={formBancoAbierto}
          onClose={() => setFormBancoAbierto(false)}
        />
        {/* Modal xml */}
        {modalSubirArchivo && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
            onClick={() => setModalSubirArchivo(false)}
          >
            <div
              className="bg-white p-6 rounded-lg shadow-lg w-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Subir Archivo
              </h2>
              <form>
                <input type="file" onChange={handleFileChange} />

                <div className="flex justify-center gap-4 mt-4">
                  <button
                    type="button"
                    className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                    onClick={() => setModalSubirArchivo(false)}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default Pagos;
