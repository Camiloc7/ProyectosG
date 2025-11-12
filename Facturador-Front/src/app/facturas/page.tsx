'use client';

import Spinner from '@/components/feedback/Spinner'; // Asegúrate de tener este componente Spinner
import { useUserStore } from '@/store/useUser';
import React, { useState, useEffect, useRef } from 'react';
import LayoutAdmi from '@/components/layout/layoutAdmi';
import {
  BadgeCheck,
  CheckCircle,
  Handshake,
  Inbox,
  Search,
  X,
  XCircleIcon,
} from 'lucide-react';
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
import DosFechasModalInput from '@/components/ui/TwoYearsInputModal';
import { useInformesStore } from '@/store/useInformesStore';
import { StatusBadge } from '@/components/ui/StatusBadge';
import ExogenasModal from '@/features/facturas/ExogenasModal';
import { MilSeisModal } from '@/features/facturas/Mil_SeisModal';
import { useInformesExogenasStore } from '@/store/useInformesExogenas';
import InvoiceStatusModal from '@/features/facturas/ExplicacionEstados';
import { FaCircleXmark } from 'react-icons/fa6';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: any;
  }
}

const tiposDeFactura = [
  'Facturas electronicas',
  'Electronica de contingencia',
  'Facturas anuladas',
  'Electronicas de Habilitacion',
];
export interface EstadosCliente {
  CUFE: string;
  ID_USUARIO: string;
  NIT_USUARIO: string;
  ID_CLIENTE: string;
  NIT_CLIENTE: string;
  ACUSE_RECIBO: string;
  RECLAMO_FACTURA: string;
  RECIBO_DEL_BIEN: string;
  ACEPTACION_EXPRESA: string;
  ACEPTACION_TACITA: string;
  FECHA_CREACION: string;
  FECHA_ACTUALIZACION: string;
}
export interface Nota {
  id: string;
  prefijo: string;
  consecutivo: number | null; // Permitir null
  contrato: string;
  estado: string;
  estadoDIAN: string;
  xml: string;
  enviar: string;
  opciones: string;
  dian: string;
  pagada: string;
  cufe: string;
  fecha: string;
  factura: string;
  tipoDeFactura: string;
  electronica: string;
  contingencia: string;
  pdfURL: string;
  causativo?: string;
  descripcionDelContrato: string;
}

//!-----------------!DESDE AQUI MODIFICAMOS LAS COLUMNAS DE LA TABLA ---------!!
const columnasIniciales = [
  { key: 'prefijo', label: 'Prefijo', visible: true },
  { key: 'consecutivo', label: 'Consecutivo', visible: true },
  { key: 'contrato', label: 'Contrato', visible: true },
  { key: 'fecha', label: 'Fecha', visible: true },
  { key: 'factura', label: 'Factura', visible: true },
  { key: 'pagada', label: 'Pagada', visible: true },
  { key: 'cliente', label: 'Cliente', visible: true },
  { key: 'estado', label: 'DIAN', visible: true },
  { key: 'xml', label: 'XML', visible: true },
  { key: 'enviar', label: 'Enviar', visible: true },
  // { key: 'opciones', label: 'Opciones', visible: true },

  { key: 'opciones', label: 'Opciones', visible: true },
  { key: 'causacion', label: 'Causación', visible: false },
];

const Facturas = () => {
  const {
    listaDeFacturas,
    fetchListaDeFacturas,
    anularFactura,
    sendFacturaMail,
    importarFacturas,
    checkEstadoDian,
    checkEstadoCliente,
    loading: loadingFactura,
    error: errorFactura,
  } = useFacturaStore();
  const { loading } = useInformesExogenasStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { resumenDeVentas } = useInformesStore();
  const { traerCausativo, loading: loadingCausativo } = useCausativoStore();
  const { subirXML, verXML } = useXMLStore();
  const [notas, setNotas] = useState<Nota[]>([]);
  const [email, setEmail] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [mouseX, setMouseX] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const [mouseY, setMouseY] = useState(0);
  const [copied, setCopied] = useState(false);
  const [openParametrosExel, setOpenParametrosExel] = useState(false);
  const [openParametrosPDF, setOpenParametrosPDF] = useState(false);
  const [openParametrosImpresion, setOpenParametrosImpresion] = useState(false);
  const { infoDelUsuario } = useUserStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [importarVisible, setImportarVisible] = useState(false);
  const [exogenasOpen, setExogenasOpen] = useState(false);
  const [modalDeVisibiidadVisible, setModalDeVisibiidadVisible] =
    useState(false);

  const [modalDeFechasIva, setModalDeFechasIva] = useState(false);
  const [enviarVisible, setEnviarVisible] = useState(false);
  const [subirXmlVisible, setSubirXmlVisible] = useState(false);

  const [id, setId] = useState<string>();
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
  const [datosDelEstadoCliente, setdatosDelEstadoCliente] = useState<
    EstadosCliente[] | null
  >(null);

  const [descripcionContratoVisible, setIsDescripcionContratoVisible] =
    useState(false);
  const [descripcionContrato, setDescripcionContrato] = useState('');
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
      nota.consecutivo?.toString().includes(query);

    // Filtro por tipo de factura
    const matchesTipoDeFactura = (() => {
      switch (tipoDeFacturaFilter) {
        case 'Electronicas de Habilitacion':
          return nota.prefijo === 'SETP';
        case 'Facturas electronicas':
          return nota.prefijo !== 'SETP';
        case 'Electronica de contingencia':
          return nota.contingencia === '1';
        case 'Facturas anuladas':
          return nota.estado === 'Anulada';
        case 'Todas':
          return true;
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

  // Nuevo efecto para polling de facturas con estadoDIAN === "2"
  useEffect(() => {
    llamadoAChekeo();
  }, [listaDeFacturas]);

  // Loguea el CUFE de cada factura visible en la página actual
  // Loguea el CUFE de cada factura visible en la página actual

  const llamadoAChekeo = () => {
    // Función que dispara checkEstadoDian para cada factura con estadoDIAN === "2"
    const pollEstadoDian = () => {
      if (!listaDeFacturas) return;

      const pendientes = listaDeFacturas.filter((f) => f.estadoDIAN === '2');
      pendientes.forEach((f) => {
        checkEstadoDian(f.cufe);
      });
    };

    // Primero disparamos inmediatamente (opcional)
    pollEstadoDian();

    // Luego programamos el interval cada 15s
    timeoutRef.current = setInterval(pollEstadoDian, 15000);

    // Cleanup al desmontar o cuando listaDeFacturas cambie
    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  };
  useEffect(() => {
    handleFetch();
  }, []);

  useEffect(() => {
    // if (descripcionContratoVisible) {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
    // }
  }, [descripcionContratoVisible]);

  const handleFetch = () => {
    fetchListaDeFacturas();
  };

  const verificarEstadoCliente = async () => {
    if (!listaDeFacturas || listaDeFacturas.length === 0) return;

    const indexInicio = (currentPage - 1) * notasPorPagina;
    const indexFinal = indexInicio + notasPorPagina;
    const notasEnPagina = listaDeFacturas.slice(indexInicio, indexFinal);

    let cufes: string[] = [];
    if (notasEnPagina.length > 0) {
      notasEnPagina.forEach((nota) => cufes.push(nota.cufe));
    }
    const datosDelEstadoCliente = await checkEstadoCliente(cufes);
    setdatosDelEstadoCliente(datosDelEstadoCliente);
  };

  useEffect(() => {
    verificarEstadoCliente();
  }, [currentPage, listaDeFacturas.length]);

  // useEffect(() => {
  //   console.log("'Aca adentro", datosDelEstadoCliente);
  // }, [datosDelEstadoCliente]);

  useEffect(() => {
    if (listaDeFacturas) {
      setNotas(listaDeFacturas);
    }
  }, [listaDeFacturas]);

  useEffect(() => {
    const facturaEncontrada = listaDeFacturas.find(
      (e) => e.consecutivo === 572
    );
    console.log(facturaEncontrada);
  }, []);

  const sortNotas = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sortedNotas = [...notas].sort((a, b) => {
      if (key === 'prefijo' || key === 'contrato' || 'consecutivo') {
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
    setdatosDelEstadoCliente(null);
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
  const handleIVA = () => {
    setModalDeFechasIva(true);
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

  const handleMouseEnter = (descripcion: string) => {
    setDescripcionContrato(descripcion);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsDescripcionContratoVisible(true);
    }, 700);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsDescripcionContratoVisible(false);
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
          <div className="w-full mb-10">
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

              {/* H1 Lista de facturas */}
              <h1
                onClick={handleFetch}
                className="mr-auto text-xl md:text-2xl lg:text-3xl ml-20 leading-9 font-bold font-montserrat text-[#6F6F6F] text-center flex-1 md:flex-none"
              >
                Lista de Facturas de Venta
              </h1>
            </div>

            {/* Botones de accion */}
            <div className="flex flex-wrap items-center gap-4 mt-4 justify-center sm:justify-start">
              <button onClick={handleCopiar} className={estilosBotonesDeAccion}>
                Copiar
              </button>
              <button onClick={handleIVA} className={estilosBotonesDeAccion}>
                IVA
              </button>
              {/* <button
                onClick={() => setOpenParametrosExel(true)}
                className={estilosBotonesDeAccion}
              >
                Excel
              </button> */}
              <ParametrosInformeExel
                isOpen={openParametrosExel}
                onClose={() => setOpenParametrosExel(false)}
                from="listaDeFacturas"
              />
              {/* <button
                onClick={() => setOpenParametrosPDF(true)}
                className={estilosBotonesDeAccion}
              >
                PDF
              </button> */}
              <DosFechasModalInput
                isOpen={modalDeFechasIva}
                onClose={() => setModalDeFechasIva(false)}
                title="Informe IVA"
                onSubmitData={(data) => {
                  resumenDeVentas(data);
                  setModalDeFechasIva(false);
                }}
              />
              <ParametrosInformesPDF
                isOpen={openParametrosPDF}
                onClose={() => setOpenParametrosPDF(false)}
                itsFrom="listaDeFacturas"
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
              <button
                onClick={() => setExogenasOpen(true)}
                className={estilosBotonesDeAccion}
              >
                Exogenas
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className={estilosBotonesDeAccion}
              >
                Ayuda
              </button>

              <InvoiceStatusModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
              />
              {/* //Hola */}
              <MilSeisModal
                isOpen={exogenasOpen}
                onClose={() => setExogenasOpen(false)}
              />
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
            {/* 🔹 Explicaciones de los iconos en horizontal */}
            <div
              className="flex flex-col sm:flex-row gap-6 mt-6 p-4 bg-white rounded-xl shadow"
              onClick={() => setModalOpen(true)}
            >
              {/* ESTADOS EN DIAN */}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-800 mb-4 border-b pb-2">
                  Estados en DIAN
                </h3>
                <div className="flex  gap-4">
                  {/* Pendiente */}
                  <div className="flex items-center space-x-2">
                    <div className="w-5 aspect-square border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                    <div>
                      <p className="text-sm font-medium">Pendiente</p>
                      <p className="text-xs text-gray-600">
                        La factura aún está en proceso de validación.
                      </p>
                    </div>
                  </div>

                  {/* Rechazada */}
                  <div className="flex items-center space-x-2">
                    <FaCircleXmark className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Rechazada por DIAN</p>
                      <p className="text-xs text-gray-600">
                        La DIAN no aceptó esta factura.
                      </p>
                    </div>
                  </div>
                  {/* Aceptada */}
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Aceptada por DIAN</p>
                      <p className="text-xs text-gray-600">
                        La DIAN validó la factura correctamente.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* ESTADOS DEL CLIENTE */}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-800 mb-4 border-b pb-2">
                  Estados del Cliente
                </h3>
                <div className="flex  gap-4">
                  {/* Recibido */}
                  <div className="flex items-center space-x-2">
                    <Inbox className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Recibida</p>
                      <p className="text-xs text-gray-600">
                        La factura fue recibida, pendiente de revisión.
                      </p>
                    </div>
                  </div>

                  {/* Rechazado */}
                  <div className="flex items-center space-x-2">
                    <XCircleIcon className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium">Rechazada</p>
                      <p className="text-xs text-gray-600">
                        La factura fue rechazada, no pasó validación.
                      </p>
                    </div>
                  </div>

                  {/* Factoring */}
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <Handshake className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium">Aceptada</p>
                      <p className="text-xs text-gray-600">
                        Puede solicitar financiamiento con esta factura.
                      </p>
                    </div>
                  </div>
                </div>
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
                            : ''}
                        </th>
                      ))}
                  </tr>
                </thead>

                <tbody>
                  {notasActuales.map((nota, index) => (
                    <tr
                      key={index}
                      className="border-b text-center border-[#EAECF0]"
                    >
                      {columnas
                        .filter((col) => col.visible)
                        .map((col) => {
                          let contenido: React.ReactNode;

                          if (col.key === 'factura') {
                            contenido = (
                              <button
                                onClick={() => handleAbrirFactura(nota.pdfURL)}
                                className={estilosBoton}
                              >
                                Factura
                              </button>
                            );
                          } else if (col.key === 'xml') {
                            contenido =
                              nota.xml && nota.xml !== 'No disponible' ? (
                                <button
                                  onClick={() => handleVerXml(nota.id)}
                                  className={estilosBoton}
                                >
                                  Ver
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSubirXml(nota.id)}
                                  className={estilosBoton}
                                >
                                  Subir
                                </button>
                              );
                          } else if (col.key === 'estado') {
                            if (nota.estado !== 'Anulada') {
                              contenido = (
                                <div className="flex items-center justify-center space-x-1">
                                  <button onClick={() => llamadoAChekeo()}>
                                    <StatusBadge status={nota.estadoDIAN} />
                                  </button>
                                </div>
                              );
                            } else {
                              contenido = ''; // o null
                            }
                          } else if (col.key === 'enviar') {
                            contenido = (
                              <button
                                onClick={() => handleEnviar(nota.id)}
                                className={estilosBoton}
                              >
                                Enviar
                              </button>
                            );
                          } else if (col.key === 'opciones') {
                            contenido =
                              nota.estado !== 'Anulada' ? (
                                <button
                                  onClick={() => handleAnular(nota.id)}
                                  className={estilosBotonAnular}
                                >
                                  Anular
                                </button>
                              ) : (
                                <h3>Anulada</h3>
                              );
                          } else if (col.key === 'cliente') {
                            // Si la nota está anulada, no renderizamos nada
                            if (nota.estado === 'Anulada') {
                              contenido = null;
                            } else {
                              contenido = (
                                <div className="flex items-center justify-center space-x-2">
                                  {(() => {
                                    if (!datosDelEstadoCliente)
                                      return (
                                        <div className="flex items-center space-x-2">
                                          <div className="w-5 aspect-square border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg z-10">
                                            Cargando..
                                          </div>
                                        </div>
                                      );

                                    const estadoCliente =
                                      datosDelEstadoCliente[index];

                                    if (!estadoCliente) {
                                      return (
                                        <div className="relative flex items-center justify-center group cursor-pointer">
                                          <Inbox className="h-4 w-4 text-blue-500" />
                                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg z-10">
                                            Recibida
                                          </div>
                                        </div>
                                      );
                                    } else if (
                                      estadoCliente.ACUSE_RECIBO === '1' &&
                                      estadoCliente.ACEPTACION_EXPRESA ===
                                        '1' &&
                                      nota.estadoDIAN === '1'
                                    ) {
                                      return (
                                        <div className="relative flex items-center justify-center group cursor-pointer">
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                          <Handshake className="h-4 w-4 text-yellow-500" />
                                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg z-10">
                                            Aceptada se puede hacer Factoring
                                          </div>
                                        </div>
                                      );
                                    } else if (
                                      estadoCliente.RECLAMO_FACTURA === '1'
                                    ) {
                                      return (
                                        <div className="relative flex items-center justify-center group cursor-pointer">
                                          <XCircleIcon className="h-4 w-4 text-red-500" />
                                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg z-10">
                                            Rechazada
                                          </div>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div className="relative flex items-center justify-center group cursor-pointer">
                                          <Inbox className="h-4 w-4 text-blue-500" />
                                          <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 shadow-lg z-10">
                                            Recibida
                                          </div>
                                        </div>
                                      );
                                    }
                                  })()}
                                </div>
                              );
                            }
                          } else if (col.key === 'pagada') {
                            // Si la nota está anulada, no mostramos nada
                            if (nota.estado === 'Anulada') {
                              contenido = null;
                            } else if (!datosDelEstadoCliente) {
                              // Datos aún no cargados
                              contenido = <h1>Cargando...</h1>;
                            } else {
                              const estadoCliente =
                                datosDelEstadoCliente[index];

                              if (!estadoCliente) {
                                contenido = <h1>Recibida</h1>;
                              } else if (
                                estadoCliente.ACUSE_RECIBO === '1' &&
                                estadoCliente.ACEPTACION_EXPRESA === '1' &&
                                nota.estadoDIAN === '1'
                              ) {
                                contenido = <h1>Aceptada</h1>;
                              } else if (
                                estadoCliente.RECLAMO_FACTURA === '1'
                              ) {
                                contenido = <h1>Rechazada</h1>;
                              } else {
                                contenido = <h1>Recibida</h1>;
                              }
                            }
                          } else if (col.key === 'causacion') {
                            contenido = (
                              <button
                                onClick={() => {
                                  handleCausativo(nota.id);
                                }}
                                className={estilosBoton}
                              >
                                Causacion
                              </button>
                            );
                          } else {
                            contenido = nota[col.key as keyof Nota];
                          }

                          return (
                            <td
                              key={col.key}
                              className={estilosContenido}
                              onMouseEnter={() =>
                                col.key === 'contrato' &&
                                handleMouseEnter(nota.descripcionDelContrato)
                              }
                              onMouseLeave={handleMouseLeave}
                            >
                              {contenido}
                            </td>
                          );
                        })}
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
                onClick={() => {
                  setCurrentPage((prev) => Math.max(prev - 1, 1));
                  setdatosDelEstadoCliente(null);
                }}
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
              {notasActuales.map((nota, index) => (
                <div
                  key={index}
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

          {/* Modal para mostrar la descripción del contrato */}
          {descripcionContratoVisible && (
            <div
              className="fixed inset-0 z-[201] backdrop-blur-sm"
              style={{ pointerEvents: 'none' }}
            >
              <div
                style={{
                  top: mouseY + 10,
                  left: mouseX + 10,
                  pointerEvents: 'auto',
                }} // Asegura que el contenido del modal reciba eventos si es necesario.
                className="absolute bg-white p-6 rounded-lg shadow-lg"
              >
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  {descripcionContrato}
                </h2>
              </div>
            </div>
          )}

          {loadingCausativo || loadingFactura || loading ? <Spinner /> : ''}
        </div>
      </LayoutAdmi>
    </PrivateRoute>
  );
};

export default Facturas;
