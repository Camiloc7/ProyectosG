'use client';
import Spinner from '@/components/feedback/Spinner'; // Asegúrate de tener este componente Spinner
import { useUserStore } from '@/store/useUser';
import React, { useState, useEffect } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import { Search } from 'lucide-react';
import { saveAs } from 'file-saver'; // Librería para la descarga de archivos
import 'jspdf-autotable'; // Esta importación debe ser después de "jspdf"
import SimpleSelect from '@/components/ui/SimpleSelect';
import { useFacturaStore } from '@/store/useFacturaStore';
import { useXMLStore } from '@/store/useXMLStore';
import ParametrosInformeExel from '@/features/facturas/paramentrosInformeExel';
import ParametrosInformesPDF from '@/features/facturas/parametrosInformePDF';
import ParametrosDeImpresion from '@/features/facturas/parametrosImpresionFacturas';
import { useCausativoStore } from '@/store/useCausativoStore';
import { BASE_URL } from '@/helpers/ruta';
import PrivateRoute from '@/helpers/PrivateRoute';
import { useNotasCreditoStore } from '@/store/useNotasCreditoStore';
import { NotaCredito } from '@/types/types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

const tiposDeFactura = [
  'Todas',
  'Facturas Anuladas',
  'Facturas Activas',
  'Facturas Incrementadas',
];

const columnasIniciales = [
  { key: 'prefijoNotaCredito', label: 'PrefijoNC', visible: true },
  { key: 'consecutivo', label: 'Consecutivo', visible: true },
  { key: 'fecha', label: 'Fecha', visible: true },
  { key: 'valor', label: 'Valor', visible: true },
  { key: 'factura', label: 'Ver', visible: true },
  { key: 'xml', label: 'XML', visible: true },
  { key: 'estado', label: 'Estado', visible: true },
  { key: 'opciones', label: 'Opciones', visible: true },
  { key: 'enviar', label: 'Enviar', visible: true },
  { key: 'causacion', label: 'Causación', visible: false },
];

const ListaNotasCredito = () => {
  const { sendFacturaMail } = useFacturaStore();
  const {
    fetchListaDeNotasCredito,
    notasCredito,
    adjuntarXMLCredito,
    fetchCausativoCredito,
    importarNotasCredito,
    sendNotaCredito,
    anularNotaDeCredito,
    loading,
  } = useNotasCreditoStore();
  const [notas, setNotas] = useState<NotaCredito[]>([]);
  const [email, setEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const [openParametrosExel, setOpenParametrosExel] = useState(false);
  const [openParametrosPDF, setOpenParametrosPDF] = useState(false);
  const [openParametrosImpresion, setOpenParametrosImpresion] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [importarVisible, setImportarVisible] = useState(false);
  const [modalDeVisibiidadVisible, setModalDeVisibiidadVisible] =
    useState(false);
  const [enviarVisible, setEnviarVisible] = useState(false);
  const [subirXmlVisible, setSubirXmlVisible] = useState(false);
  const [id, setId] = useState<string>('');

  const [tipoDeFacturaFilter, setTipoDeFacturaFilter] = useState<string>(
    tiposDeFactura[0]
  );
  const [columnas, setColumnas] = useState(columnasIniciales);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  }>({
    key: '',
    direction: 'asc',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const notasPorPagina = 10;

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentPage(1);
    setSearchQuery(event.target.value);
  };

  const filteredNotas = notas.filter((nota) => {
    const query = searchQuery.toLowerCase();

    // Filtro por búsqueda
    const matchesSearch =
      nota.prefijoNotaCredito.toLowerCase().includes(query) ||
      nota.fecha.toLowerCase().includes(query) ||
      nota.valor.toString().toLowerCase().includes(query) ||
      (nota.consecutivo?.toString() || '').includes(query);

    // Filtro por tipo de factura
    const matchesTipoDeFactura = (() => {
      switch (tipoDeFacturaFilter) {
        case 'Facturas Anuladas':
          return nota.anulado === '1';
        case 'Facturas Activas':
          return nota.anulado === '0';
        case 'Facturas Incrementadas':
          return nota.anulado === '2';
        default:
          return true;
      }
    })();

    return matchesSearch && matchesTipoDeFactura;
  });

  const totalPaginas = Math.ceil(filteredNotas.length / notasPorPagina);
  const indexInicio = (currentPage - 1) * notasPorPagina;
  const indexFinal = indexInicio + notasPorPagina;
  const notasActuales = filteredNotas.slice(indexInicio, indexFinal);

  useEffect(() => {
    handleFetch();
  }, []);

  const handleFetch = () => {
    fetchListaDeNotasCredito();
  };

  useEffect(() => {
    if (notasCredito) {
      // console.log('Facturas antes de ordenar:', notasCredito);

      const facturasOrdenadas = [...notasCredito].sort((a, b) => {
        // Si la fecha es "0000-000-000", moverla al final
        if (a.fecha === '0000-000-000') return 1;
        if (b.fecha === '0000-000-000') return -1;

        // Ordenar por fecha descendente (más nueva primero)
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });

      // console.log('Facturas después de ordenar:', facturasOrdenadas);
      setNotas(facturasOrdenadas);
    }
  }, [notasCredito]);

  const sortNotas = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sortedNotas = [...notas].sort((a, b) => {
      if (key === 'consecutivo' || key === 'prefijoNC' || key === 'valor') {
        return direction === 'asc'
          ? String(a[key as keyof NotaCredito]).localeCompare(
              String(b[key as keyof NotaCredito])
            )
          : String(b[key as keyof NotaCredito]).localeCompare(
              String(a[key as keyof NotaCredito])
            );
      }

      if (key === 'fecha') {
        const dateA = new Date(a[key as keyof NotaCredito] as string);
        const dateB = new Date(b[key as keyof NotaCredito] as string);
        return direction === 'asc'
          ? dateA.getTime() - dateB.getTime()
          : dateB.getTime() - dateA.getTime();
      }

      return 0;
    });

    setNotas(sortedNotas);
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPaginas));
  };

  const handleAnular = (id: string) => {
    setId(id);
    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setSelectedId(null);
  };

  const handleConfirm = () => {
    setModalVisible(false);
    anularNotaDeCredito(id);
  };

  const handleEnviar = (id: string) => {
    setId(id);
    setEnviarVisible(true);
  };

  const BASE_URL = 'https://api-facturador.qualitysoftservice.com/index.php/';

  const handleCausativo = (id: string) => {
    // Busca la factura correspondiente al ID dado y extrae el campo 'causativo'.
    const factura = notasCredito.find((factura) => factura.id === id);
    const causativoURL = (factura as any)?.causativo;

    if (!causativoURL) {
      fetchCausativoCredito(id);
      return;
    }

    const sanitizedBaseURL = BASE_URL.replace('/index.php', ''); // Eliminar '/index.php'
    const fullURL = `${sanitizedBaseURL}${causativoURL.replace('./', '')}`;

    // Abrir la URL en una nueva pestaña.
    window.open(fullURL, '_blank');
  };

  const handleAbrirFactura = (url: string) => {
    window.open(url, '_blank');
  };

  const handleCancelEnviar = () => {
    setEnviarVisible(false);
  };

  const handleSubmit = (event: any) => {
    event.preventDefault(); // Evita la recarga de la página

    sendFacturaMail(email, Number(id));
    setEnviarVisible(false);
  };

  const handleSubirXml = (id: string) => {
    setSubirXmlVisible(true);
    setId(id);
  };

  const handleVerXml = (ruta: string) => {
    const sanitizedBaseURL = BASE_URL.replace('/index.php', ''); // Eliminar '/index.php'
    const fullURL = `${sanitizedBaseURL}${ruta.replace('./', '')}`;

    // Abrir la URL en una nueva pestaña.
    window.open(fullURL, '_blank');
  };

  const handleFileFacturasRecibido = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = event.target.files?.[0]; // Usa optional chaining para manejar posibles nulos.

    if (!selectedFile) {
      console.error('No se seleccionó un archivo.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    importarNotasCredito(selectedFile);
    setImportarVisible(false);
  };

  const handleCopiar = (): void => {
    const datosCopiar =
      `PrefijoNC  Consecutivo Fecha  Valor  Estado\n` +
      filteredNotas
        .map(
          (nota) =>
            `${nota.prefijoNotaCredito}   ${nota.consecutivo}  ${nota.fecha}  ${nota.valor}   ${nota.estado}`
        )
        .join('\n');

    navigator.clipboard
      .writeText(datosCopiar)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => {
        console.error('Error al copiar al portapapeles: ', err);
      });
  };

  // Función para asegurarse de que las cadenas tengan un tamaño fijo (rellena con espacios)
  const padString = (str: string, length: number): string => {
    return str.padEnd(length, ' '); // Rellena con espacios al final para asegurar el tamaño
  };

  // Función para descargar el archivo CSV
  const handleCSV = () => {
    const csvContent =
      `PrefijoNC,Consecutivo,Fecha,Valor,Estado\n` +
      filteredNotas
        .map(
          (nota) =>
            `${nota.prefijoNotaCredito}, ${nota.consecutivo},${nota.fecha},${nota.valor},${nota.estado}`
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, 'Quality Bill Service - Lista de Facturas.csv');
  };

  // Función para abrir la pantalla de impresión
  const handlePrint = () => {
    //conectar con el back
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]; // Usa optional chaining para manejar posibles nulos.

    if (!selectedFile) {
      console.error('No se seleccionó un archivo.');
      return;
    }
    adjuntarXMLCredito(id, selectedFile);
    setSubirXmlVisible(false);
  };

  const toggleColumna = (key: string) => {
    setColumnas((prevColumnas) =>
      prevColumnas.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const estilosTitulos =
    'cursor-pointer px-4 py-2 font-medium font-Inter text-[#667085] text-sm ';
  const estilosContenido =
    'px-4 py-2 text-[#6F6F6F] text-sm font-medium font-Inter h-[44px]';

  const estilosBoton =
    'h-5 w-14 text-xs font-medium font-inter text-[#00A7E1] border:none bg-[#E2F5FF] rounded-[16px] hover:bg-[#EDEFF3]';

  const estilosBotonAnular =
    'h-5 w-14 text-xs font-medium font-inter text-[#FFFFFF] bg-[#ffb2b2] rounded-[16px] hover:bg-[#FAD4D4]';

  const estilosBotonesDeAccion =
    'bg-white text-[#00A7E1] text-sm font-semibold px-[16px] py-[6px] w-24 h-8 rounded-[20px] hover:bg-[#EDEFF3] transition-all sm:w-32 ';

  return (
    <PrivateRoute>
      <LayoutAdmi>
        <div className="bg-[#F7F7F7] relative pt-12 p-6 sm:p-8  w-full overflow-hidden ">
          <div className="w-full">
            <div className="flex items-center justify-center gap-4">
              {/* Barra de búsqueda */}
              <div className="flex-1 max-w-[400px] h-[50px] border border-[#D5D5D5] flex items-center justify-between px-[20px] bg-white rounded-[40px]">
                <input
                  type="text"
                  placeholder="Buscar factura"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full border-none outline-none"
                />
                <Search className="bg-[#00A7E1] text-white p-[7px] rounded-[20px] w-[30px] h-[30px]" />
              </div>

              {/* H1 Lista de facturas */}
              <h1
                onClick={handleFetch}
                className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none"
              >
                Lista de Notas Credito
              </h1>
            </div>

            {/* Botones de accion */}
            <div className="flex flex-wrap items-center gap-4 mt-4 justify-center sm:justify-start">
              <button onClick={handleCopiar} className={estilosBotonesDeAccion}>
                Copiar
              </button>
              <button onClick={handleCSV} className={estilosBotonesDeAccion}>
                CSV
              </button>
              <button
                onClick={() => setOpenParametrosExel(true)}
                className={estilosBotonesDeAccion}
              >
                Excel
              </button>
              <ParametrosInformeExel
                isOpen={openParametrosExel}
                onClose={() => setOpenParametrosExel(false)}
                from="creditoLista"
              />
              <button
                onClick={() => setOpenParametrosPDF(true)}
                className={estilosBotonesDeAccion}
              >
                PDF
              </button>
              <ParametrosInformesPDF
                isOpen={openParametrosPDF}
                onClose={() => setOpenParametrosPDF(false)}
                itsFrom="listaNotasCredito"
              />
              <button
                onClick={() => setOpenParametrosImpresion(true)}
                className={estilosBotonesDeAccion}
              >
                Print
              </button>
              <ParametrosDeImpresion
                isOpen={openParametrosImpresion}
                onClose={() => setOpenParametrosImpresion(false)}
              />
              <button
                onClick={() => setModalDeVisibiidadVisible(true)}
                className={estilosBotonesDeAccion}
              >
                Visibilidad
              </button>
              <button
                onClick={() => setImportarVisible(true)}
                className={estilosBotonesDeAccion}
              >
                Importar
              </button>

              <div className="md:w-[24%] md:ml-auto justify-center w-auto">
                <SimpleSelect
                  options={tiposDeFactura}
                  width={'100%'}
                  value={tipoDeFacturaFilter}
                  onChange={(value) => {
                    setTipoDeFacturaFilter(() => value);
                  }}
                  height="8"
                />
              </div>
            </div>

            {/* Tabla normal */}
            <div className="hidden sm:block rounded-[8px] mt-6 overflow-x-auto">
              <table className="w-full bg-white justify-center rounded-[8px]">
                <thead className="bg-[#FCFCFD] rounded-[8px]">
                  <tr>
                    {columnas
                      .filter((col) => col.visible)
                      .map((col) => (
                        <th
                          key={col.key}
                          onClick={() => sortNotas(col.key)}
                          className={`${estilosTitulos} min-w-[120px] ${
                            col.key === 'prefijo' ? 'rounded-tl-[8px]' : ''
                          }`}
                          role="button"
                        >
                          {col.label}{' '}
                          {sortConfig.key === col.key
                            ? sortConfig.direction === 'asc'
                              ? '↑'
                              : '↓'
                            : '↑'}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {notasActuales.map((nota) => (
                    <tr
                      key={nota.id}
                      className="border-b text-center border-[#EAECF0]"
                    >
                      {columnas
                        .filter((col) => col.visible)
                        .map((col) => (
                          <td key={col.key} className={estilosContenido}>
                            {col.key === 'factura' ? (
                              <button
                                onClick={() => handleAbrirFactura(nota.rutaPdf)}
                                className={estilosBoton}
                              >
                                Factura
                              </button>
                            ) : col.key === 'xml' ? (
                              nota.rutaXml === '---' ? (
                                <button
                                  onClick={() =>
                                    handleSubirXml(nota.numeroFactura)
                                  }
                                  className={estilosBoton}
                                >
                                  Subir
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleVerXml(nota.rutaXml)}
                                  className={estilosBoton}
                                >
                                  Ver
                                </button>
                              )
                            ) : col.key === 'enviar' ? (
                              <button
                                onClick={() => handleEnviar(nota.numeroFactura)}
                                className={estilosBoton}
                              >
                                Enviar
                              </button>
                            ) : col.key === 'opciones' ? (
                              nota.estado !== 'Anulada' ? (
                                <button
                                  onClick={() =>
                                    handleAnular(nota.numeroFactura)
                                  }
                                  className={estilosBotonAnular}
                                >
                                  Anular
                                </button>
                              ) : null
                            ) : col.key === 'causacion' ? (
                              <button
                                onClick={() => handleCausativo(nota.id)}
                                className={estilosBoton}
                              >
                                Causacion
                              </button>
                            ) : col.key === 'estado' ? (
                              nota.anulado === '2' ? (
                                'Incrementada'
                              ) : nota.anulado === '1' ? (
                                'Anulada'
                              ) : nota.anulado === '0' ? (
                                'Anulada'
                              ) : (
                                '---'
                              )
                            ) : (
                              nota[col.key as keyof NotaCredito]
                            )}
                          </td>
                        ))}
                    </tr>
                  ))}

                  {/* Filas vacías para completar 10 elementos */}
                  {[
                    ...Array(
                      Math.max(0, notasPorPagina - notasActuales.length)
                    ),
                  ].map((_, index) => (
                    <tr
                      key={`empty-${index}`}
                      className="border-b border-[#EAECF0] h-[40px]"
                    >
                      <td
                        colSpan={columnas.filter((col) => col.visible).length}
                        className="bg-white"
                      ></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Controles de paginación */}
            <div className="flex justify-between items-center mt-4 w-full">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="px-4 py-2 text-sm font-medium rounded-[25px] border border-[#00A7E1] text-[#00A7E1] hover:bg-[#EDEFF3] sm:w-auto w-full mb-2 sm:mb-0 mr-2"
              >
                Anterior
              </button>
              <span className="text-[#6F6F6F] font-medium sm:w-auto w-full text-center mb-2 sm:mb-0">
                Página {currentPage} de {totalPaginas}
              </span>
              <button
                onClick={handleNextPage}
                className="px-4 py-2 text-sm font-medium rounded-[25px] border border-[#00A7E1] text-[#00A7E1] hover:bg-[#EDEFF3] sm:w-auto w-full mb-2 sm:mb-0 ml-2"
              >
                Siguiente
              </button>
            </div>

            {/* Slider para pantallas pequeñas */}
            <div className="block sm:hidden mt-8">
              {notasActuales.map((nota) => (
                <div
                  key={nota.id}
                  className="bg-white rounded-lg shadow-sm border p-4 mb-4"
                >
                  <p className="text-sm font-medium">
                    <strong>Prefijo:</strong> {nota.prefijoNotaCredito}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Consecutivo:</strong> {nota.consecutivo}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Estado:</strong> {nota.estado}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Ver:</strong> {nota.xml}
                  </p>
                </div>
              ))}
            </div>

            {/* Cartelito de "copiado" */}
            {copied && (
              <div className="absolute top-8 right-4  bg-[#E2F5FF] text-sm font-medium font-Inter text-[#00A7E1] px-4 py-2 rounded-lg shadow-md ">
                ¡Datos copiados al portapapeles!
              </div>
            )}

            {/* Modal de confirmacion de ANULAR*/}
            {modalVisible && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center "
                onClick={handleCancel}
              >
                <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    ¿Estás seguro de anular esta factura?
                  </h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Esta acción no se puede deshacer.
                  </p>
                  <div className="flex justify-end gap-4">
                    <button
                      className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                      onClick={handleCancel}
                    >
                      Cancelar
                    </button>
                    <button
                      className="bg-blueQ text-white h-11  hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]"
                      onClick={handleConfirm}
                    >
                      Continuar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de enviar */}
            {enviarVisible && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
                onClick={handleCancelEnviar}
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
                        onClick={handleCancelEnviar}
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

            {/* Modal xml */}
            {subirXmlVisible && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
                onClick={() => setSubirXmlVisible(false)}
              >
                <div
                  className="bg-white p-6 rounded-lg shadow-lg w-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    Subir Archivo
                  </h2>
                  <form>
                    <input
                      type="file"
                      accept=".zip" // Restringe la selección a archivos ZIP
                      onChange={handleFileChange}
                    />

                    <div className="flex justify-center gap-4 mt-4">
                      <button
                        type="button"
                        className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                        onClick={() => setSubirXmlVisible(false)}
                      >
                        Cancelar
                      </button>
                      {/* <button
                      className="bg-blueQ text-white h-11  hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]"
                    >
                      Continuar
                    </button> */}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {modalDeVisibiidadVisible && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
                onClick={() => setModalDeVisibiidadVisible(false)}
              >
                <div
                  className="bg-white p-6 rounded-lg shadow-lg w-96"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-lg font-bold mb-4">
                    Configurar Visibilidad
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {columnas.map((col) => (
                      <button
                        key={col.key}
                        onClick={() => toggleColumna(col.key)}
                        className={`px-4 py-2 text-sm font-normal rounded-[25px] ${
                          col.visible
                            ? 'bg-blueQ text-white h-11  hover:bg-[#008ec1] '
                            : 'bg-white border border-[#787878] text-[#787878] hover:bg-gray-300'
                        }`}
                      >
                        {col.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-center mt-4">
                    <button
                      type="button"
                      className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                      onClick={() => setModalDeVisibiidadVisible(false)}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal importar */}
            {importarVisible && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-[201] flex justify-center items-center"
                onClick={() => setImportarVisible(false)}
              >
                <div
                  className="bg-white p-6 rounded-lg shadow-lg w-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-lg font-bold text-gray-800 mb-4">
                    Importar facturas
                  </h2>
                  <form>
                    <input type="file" onChange={handleFileFacturasRecibido} />

                    <div className="flex justify-center gap-4 mt-4">
                      <button
                        type="button"
                        className="bg-white border border-[#787878] text-[#787878] hover:bg-gray-300 px-4 py-2 text-sm font-normal rounded-[25px]"
                        onClick={() => setImportarVisible(false)}
                      >
                        Cancelar
                      </button>
                      <button className="bg-blueQ text-white h-11  hover:bg-[#008ec1] px-4 py-2 text-sm font-normal rounded-[25px]">
                        Continuar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          {loading ? <Spinner /> : ''}
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default ListaNotasCredito;
