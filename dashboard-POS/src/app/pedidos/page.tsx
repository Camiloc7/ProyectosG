"use client";
import Spinner from "@/components/feedback/Spinner";
import BotonRestaurante from "@/components/ui/Boton";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { usePedidosStore } from "@/stores/pedidosStore";
import { useFacturasStore } from "@/stores/facturasStore";
import { useEffect, useMemo, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import PedidoDetalles from "@/features/pedidos/PedidoDetalles";
import { IPedidos } from "@/types/models";
import {
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import toast from "react-hot-toast";

export default function Pedidos() {
  const { loading, pedidos, pedidosTotal, traerPedidosPaginados } =
    usePedidosStore();
  const {
    getFacturaPdf,
    getFacturaByPedidoId,
    loading: loadingFactura,
  } = useFacturasStore();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [estadoFiltro, setEstadoFiltro] = useState<string>("TODOS");
  const [selectedPedido, setSelectedPedido] = useState<IPedidos | null>(null);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  useEffect(() => {
    traerPedidosPaginados(
      page,
      itemsPerPage,
      search,
      fechaInicio,
      fechaFin,
      estadoFiltro
    );
  }, [
    page,
    itemsPerPage,
    search,
    fechaInicio,
    fechaFin,
    estadoFiltro,
    traerPedidosPaginados,
  ]);

  const handleCardClick = (pedido: IPedidos) => {
    setSelectedPedido(pedido);
  };

  const handleBackToList = () => {
    setSelectedPedido(null);
  };

  const handleClosePdfModal = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setShowPdfModal(false);
    setPdfUrl(null);
  };

  const handleFacturaClick = async (pedido: IPedidos) => {
    const factura = await getFacturaByPedidoId(pedido.id);

    if (factura && factura.id) {
      const pdfBlob = await getFacturaPdf(factura.id, false);

      if (pdfBlob instanceof Blob && pdfBlob.type === "application/pdf") {
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setShowPdfModal(true);
        toast.success("Factura generada correctamente.");
      } else {
        toast.error(
          "Factura procesada, pero no se pudo obtener el PDF válido."
        );
        handleClosePdfModal();
      }
    } else {
      alert("No se encontró una factura para este pedido.");
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedPedidos = useMemo(() => {
    const sortablePedidos = [...pedidos];
    if (sortColumn) {
      sortablePedidos.sort((a, b) => {
        let aValue: any = a[sortColumn as keyof IPedidos];
        let bValue: any = b[sortColumn as keyof IPedidos];
        if (sortColumn === "total_estimado") {
          aValue = parseFloat(aValue);
          bValue = parseFloat(bValue);
        } else if (sortColumn === "created_at") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        }
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortablePedidos;
  }, [pedidos, sortColumn, sortDirection]);
  const totalPages = Math.ceil(pedidosTotal / itemsPerPage);
  const getSortIcon = (column: string) => {
    if (sortColumn !== column)
      return <ArrowUpDown className="ml-2 w-4 h-4 text-gray-400" />;
    return sortDirection === "asc" ? (
      <ArrowDown className="ml-2 w-4 h-4" />
    ) : (
      <ArrowUp className="ml-2 w-4 h-4" />
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-[calc(100vh-4rem)] text-gray-800">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">
          Historial de Pedidos
        </h1>
        {selectedPedido && (
          <BotonRestaurante
            label="Volver a la lista"
            onClick={handleBackToList}
          />
        )}
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col">
            <label
              htmlFor="search"
              className="text-sm font-medium text-gray-700"
            >
              Buscar por ID
            </label>
            <input
              id="search"
              type="text"
              placeholder="Ej. 12345"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="mt-1 border border-gray-300 h-10 rounded-lg px-4 py-2 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="fechaInicio"
              className="text-sm font-medium text-gray-700"
            >
              Fecha de Inicio
            </label>
            <DatePickerInput
              value={fechaInicio}
              onChange={(date) => {
                setFechaInicio(date);
                setPage(1);
              }}
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="fechaFin"
              className="text-sm font-medium text-gray-700"
            >
              Fecha de Fin
            </label>
            <DatePickerInput
              value={fechaFin}
              onChange={(date) => {
                setFechaFin(date);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>
      {loading && <Spinner />}
      {!loading && (
        <>
          {selectedPedido ? (
            <PedidoDetalles pedido={selectedPedido} />
          ) : (
            <>
              <div className="mb-4 flex items-center gap-2">
                <label
                  htmlFor="estadoFiltro"
                  className="text-sm font-medium text-gray-700"
                >
                  Filtrar por Estado:
                </label>
                <select
                  id="estadoFiltro"
                  value={estadoFiltro}
                  onChange={(e) => {
                    setEstadoFiltro(e.target.value);
                    setPage(1); // Reiniciar página
                  }}
                  className="border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="TODOS">Todos</option>
                  <option value="ABIERTO">Abierto</option>
                  <option value="PAGADO">Pagado</option>
                  <option value="CANCELADO">Cancelado</option>
                  <option value="PENDIENTE_PAGO">Pendiente de pago</option>
                </select>
              </div>
              <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full table-auto text-sm text-gray-700">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th
                        className="px-6 py-3 text-left font-bold uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("codigo_pedido")}
                      >
                        <div className="flex items-center">
                          ID
                          {getSortIcon("codigo_pedido")}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">
                        Mesa
                      </th>
                      <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left font-bold uppercase tracking-wider">
                        Estado
                      </th>
                      <th
                        className="px-6 py-3 text-left font-bold uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("total_estimado")}
                      >
                        <div className="flex items-center">
                          Total
                          {getSortIcon("total_estimado")}
                        </div>
                      </th>
                      <th
                        className="px-6 py-3 text-left font-bold uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("created_at")}
                      >
                        <div className="flex items-center">
                          Fecha
                          {getSortIcon("created_at")}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left font-bold uppercase tracking-wider cursor-pointer">
                        <div className="flex items-center">Hora</div>
                      </th>
                      <th className="px-6 py-3 text-center font-bold uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Se usa 'sortedPedidos' que es el resultado del sort local */}
                    {sortedPedidos.map((pedido) => (
                      <tr
                        key={pedido.id}
                        className="border-b border-gray-200 last:border-0 hover:bg-amber-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          {pedido.codigo_pedido?.slice(-3) ?? "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          {pedido.mesa_numero || "N/A"}
                        </td>
                        <td className="px-6 py-4">{pedido.tipo_pedido}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              pedido.estado === "PAGADO"
                                ? "bg-green-100 text-green-800"
                                : pedido.estado === "ABIERTO"
                                ? "bg-blue-100 text-blue-800"
                                : pedido.estado === "PENDIENTE_PAGO"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {pedido.estado}
                          </span>
                        </td>

                        <td className="px-6 py-4 font-semibold">
                          ${pedido.total_estimado}
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          {new Date(pedido.created_at).toLocaleDateString(
                            "es-ES"
                          )}
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          {new Date(pedido.created_at).toLocaleTimeString(
                            "es-ES",
                            {
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )}
                        </td>

                        {/* <td className="px-6 py-4">{new Date(pedido.created_at).toLocaleDateString()}</td> */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <Tooltip.Provider delayDuration={0}>
                              <Tooltip.Root>
                                <Tooltip.Trigger asChild>
                                  <button
                                    onClick={() => handleCardClick(pedido)}
                                    className="p-2 rounded hover:bg-white hover:bg-opacity-10 transition-transform transform duration-200 hover:scale-110 text-gray-700 hover:text-orange-500"
                                  >
                                    <Eye size={20} />
                                  </button>
                                </Tooltip.Trigger>
                                <Tooltip.Content
                                  className="bg-black text-white text-sm px-2 py-1 rounded shadow-lg"
                                  sideOffset={5}
                                >
                                  Ver detalles
                                  <Tooltip.Arrow className="fill-black" />
                                </Tooltip.Content>
                              </Tooltip.Root>
                            </Tooltip.Provider>
                            {pedido.estado.toUpperCase() === "PAGADO" && (
                              <Tooltip.Provider delayDuration={0}>
                                <Tooltip.Root>
                                  <Tooltip.Trigger asChild>
                                    <button
                                      onClick={() => handleFacturaClick(pedido)}
                                      className="p-2 rounded hover:bg-white hover:bg-opacity-10 transition-transform transform duration-200 hover:scale-110 text-gray-700 hover:text-orange-500"
                                    >
                                      <FileText size={20} />
                                    </button>
                                  </Tooltip.Trigger>
                                  <Tooltip.Content
                                    className="bg-black text-white text-sm px-2 py-1 rounded shadow-lg"
                                    sideOffset={5}
                                  >
                                    Ver factura
                                    <Tooltip.Arrow className="fill-black" />
                                  </Tooltip.Content>
                                </Tooltip.Root>
                              </Tooltip.Provider>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center mt-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <label htmlFor="itemsPerPage" className="font-medium">
                    Mostrar:
                  </label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <div className="flex items-center gap-4">
                  <BotonRestaurante
                    label="Anterior"
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft />
                  </BotonRestaurante>
                  <span className="text-sm text-gray-600 font-medium">
                    Página {page} de {totalPages}
                  </span>
                  <BotonRestaurante
                    label="Siguiente"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page === totalPages || totalPages === 0}
                  >
                    <ChevronRight />
                  </BotonRestaurante>
                </div>
              </div>
            </>
          )}
        </>
      )}
      {showPdfModal && pdfUrl && (
        <div className="fixed inset-0 backdrop-blur-md bg-white/30 dark:bg-black/20 flex items-center justify-center z-[201] transition-all">
          <div className="bg-white rounded-lg w-11/12 md:w-3/4 lg:w-1/2 h-5/6 flex flex-col overflow-hidden shadow-2xl">
            <div className="p-2 text-right">
              <button
                className="bg-transparent border-none text-xl cursor-pointer"
                onClick={handleClosePdfModal}
              >
                ✖
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfUrl}
                width="100%"
                height="100%"
                title="Factura PDF"
                className="border-none"
              />
            </div>
          </div>
        </div>
      )}

      {loadingFactura && <Spinner />}
    </div>
  );
}
