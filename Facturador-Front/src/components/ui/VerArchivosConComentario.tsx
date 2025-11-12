'use client';
import React, { useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

import { useUserStore } from '@/store/useUser';
import { Search } from 'lucide-react';
import { saveAs } from 'file-saver'; // Librería para la descarga de archivos
import 'jspdf-autotable'; // Esta importación debe ser después de "jspdf"
import { useFacturaStore } from '@/store/useFacturaStore';
import { useXMLStore } from '@/store/useXMLStore';
import { useCausativoStore } from '@/store/useCausativoStore';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

interface Nota {
  id: string;
  prefijo: string;
  consecutivo: number | null; // Permitir null
  contrato: string;
  estado: string;
  xml: string;
  enviar: string;
  opciones: string;
  dian: string;
  pagada: string;
  fecha: string;
  factura: string;
  tipoDeFactura: string;
  electronica: string;
  contingencia: string;
  pdfURL: string;
  causativo?: string;
}

const columnasIniciales = [
  { key: 'prefijo', label: 'Fecha', visible: true },
  { key: 'consecutivo', label: 'Comentarios', visible: true },
  { key: 'ver', label: 'Ver', visible: true },
  { key: 'eliminar', label: 'Eliminar', visible: true },
];

const VerArchivosConComentario: React.FC<ModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    listaDeFacturas,
    fetchListaDeFacturas,
    anularFactura,
    sendFacturaMail,
    importarFacturas,
    loading: loadingFactura,
    error: errorFactura,
  } = useFacturaStore();
  const { traerCausativo, loading: loadingCausativo } = useCausativoStore();
  const { subirXML, verXML } = useXMLStore();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [email, setEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [copied, setCopied] = useState(false);
  const { infoDelUsuario } = useUserStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [importarVisible, setImportarVisible] = useState(false);
  const [enviarVisible, setEnviarVisible] = useState(false);
  const [subirXmlVisible, setSubirXmlVisible] = useState(false);
  const [id, setId] = useState<string>();

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
      nota.prefijo.toLowerCase().includes(query) ||
      nota.fecha.toLowerCase().includes(query) ||
      nota.contrato.toLowerCase().includes(query) ||
      (nota.consecutivo?.toString() || '').includes(query);

    return matchesSearch;
  });

  const totalPaginas = Math.ceil(filteredNotas.length / notasPorPagina);
  const indexInicio = (currentPage - 1) * notasPorPagina;
  const indexFinal = indexInicio + notasPorPagina;
  const notasActuales = filteredNotas.slice(indexInicio, indexFinal);

  useEffect(() => {
    handleFetch();
  }, []);

  const handleFetch = () => {
    // fetchListaDeFacturas();
  };

  useEffect(() => {
    if (listaDeFacturas) {
      // console.log('Facturas antes de ordenar:', listaDeFacturas);

      const facturasOrdenadas = [...listaDeFacturas].sort((a, b) => {
        // Si la fecha es "0000-000-000", moverla al final
        if (a.fecha === '0000-000-000') return 1;
        if (b.fecha === '0000-000-000') return -1;

        // Ordenar por fecha descendente (más nueva primero)
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });

      // console.log('Facturas después de ordenar:', facturasOrdenadas);
      setNotas(facturasOrdenadas);
    }
  }, [listaDeFacturas]);

  const sortNotas = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sortedNotas = [...notas].sort((a, b) => {
      if (key === 'prefijo' || key === 'contrato') {
        return direction === 'asc'
          ? String(a[key as keyof Nota]).localeCompare(
              String(b[key as keyof Nota])
            )
          : String(b[key as keyof Nota]).localeCompare(
              String(a[key as keyof Nota])
            );
      }

      if (key === 'fecha') {
        const dateA = new Date(a[key as keyof Nota] as string);
        const dateB = new Date(b[key as keyof Nota] as string);
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
    anularFactura(Number(id));
  };

  const handleEnviar = (id: string) => {
    setId(id);
    setEnviarVisible(true);
  };

  const BASE_URL = 'https://api-facturador.qualitysoftservice.com/index.php/';

  const handleCausativo = (id: string) => {
    // Busca la factura correspondiente al ID dado y extrae el campo 'causativo'.
    const factura = listaDeFacturas.find((factura) => factura.id === id);
    const causativoURL = (factura as any)?.causativo;

    if (!causativoURL) {
      traerCausativo(id);
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

  const handleVerXml = (id: string) => {
    verXML(Number(id));
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
    importarFacturas(selectedFile);
    setImportarVisible(false);
  };

  const handleCopiar = (): void => {
    const datosCopiar =
      `Prefijo Consecutivo Contrato Pagada Factura Estado XML Enviar Opciones DIAN\n` +
      filteredNotas
        .map(
          (nota) =>
            `${nota.prefijo} ${nota.consecutivo || ''} ${nota.contrato} ${
              nota.pagada
            } ${nota.factura} ${nota.estado} ${nota.xml} ${nota.enviar} ${
              nota.opciones
            } ${nota.dian}`
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
      `Prefijo,Consecutivo,Contrato,Pagada,Factura,Estado,XML,Enviar,Opciones,DIAN\n` +
      filteredNotas
        .map(
          (nota) =>
            `${nota.prefijo},${nota.consecutivo},${nota.contrato},${nota.pagada},${nota.factura},${nota.estado},${nota.xml},${nota.enviar},${nota.opciones},${nota.dian}`
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

    subirXML(Number(id), selectedFile);
    setSubirXmlVisible(false);
  };

  const toggleColumna = (key: string) => {
    setColumnas((prevColumnas) =>
      prevColumnas.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const handleBackgroundClick = () => {
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Bloquea el scroll cuando el modal está abierto
    } else {
      document.body.style.overflow = ''; // Restaura el scroll cuando se cierra
    }

    return () => {
      document.body.style.overflow = ''; // Asegura que el scroll se restablezca al desmontar
    };
  }, [isOpen]);

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 flex justify-center items-center z-[201]"
      onClick={handleBackgroundClick}
    >
      <div className="fixed inset-0 flex justify-center items-center  bg-opacity-50">
        <div
          className="relative bg-white p-6 rounded-2xl shadow-lg w-[800px] overflow-y-auto transition-all duration-300 transform scale-95 opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón de cierre */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>

          {/* Título */}
          <h1 className="text-2xl font-semibold text-gray-800 mb-6 text-center ">
            Archivos
          </h1>
          <div className="w-full">
            <div className="flex flex-wrap items-center justify-between gap-4">
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
                          {col.label}
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
                                onClick={() => handleAbrirFactura(nota.pdfURL)}
                                className={estilosBoton}
                              >
                                Factura
                              </button>
                            ) : col.key === 'ver' ? (
                              <button
                                onClick={() => handleEnviar(nota.id)}
                                className={estilosBoton}
                              >
                                Ver
                              </button>
                            ) : col.key === 'eliminar' ? (
                              <button
                                onClick={() => handleCausativo(nota.id)}
                                className={estilosBotonAnular}
                              >
                                Eliminar
                              </button>
                            ) : (
                              nota[col.key as keyof Nota]
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
                    <strong>Prefijo:</strong> {nota.prefijo}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Consecutivo:</strong> {nota.consecutivo}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Contrato:</strong> {nota.contrato}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Pagada:</strong> {nota.pagada}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Estado:</strong> {nota.estado}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>DIAN:</strong> {nota.dian}
                  </p>
                  <p className="text-sm font-medium">
                    <strong>Ver:</strong> {nota.xml}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerArchivosConComentario;
