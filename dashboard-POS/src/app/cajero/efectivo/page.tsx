"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";
import BotonRestaurante from "@/components/ui/Boton";
import { DatosOpcionales, IDataOpcional } from "@/components/DatosOpcionales";
import { generarPayloadPago } from "@/utils/generarPagoPayload";
import { ArrowLeft, PlusCircle, MinusCircle } from "lucide-react";
import { FacturaEntity, useFacturasStore } from "@/stores/facturasStore";
import Checkbox from "@/components/ui/CheckBox";
import Spinner from "@/components/feedback/Spinner";
import { IPedidos } from "@/types/models";
import { useCardStore } from "@/stores/CardsStore";
import { usePedidosStore } from "@/stores/pedidosStore";
import { calculateTip } from "@/helpers/CalculateTip";

const BILL_DENOMINATIONS = [
  { value: 100000, img: "/dinero/100_mil.png" },
  { value: 50000, img: "/dinero/50_mil.jpg" },
  { value: 20000, img: "/dinero/20_mil.png" },
  { value: 10000, img: "/dinero/10_mil.jpg" },
  { value: 5000, img: "/dinero/5_mil.jpg" },
  { value: 2000, img: "/dinero/2_mil.png" },
];

const COIN_DENOMINATIONS = [
  { value: 1000, img: "/dinero/1000 pesos.png" },
  { value: 500, img: "/dinero/500 pesos.png" },
  { value: 200, img: "/dinero/200 pesos.png" },
  { value: 100, img: "/dinero/100 pesos.png" },
  { value: 50, img: "/dinero/50 pesos.png" },
];

const ALL_DENOMINATIONS = [...BILL_DENOMINATIONS, ...COIN_DENOMINATIONS];

export default function Cambio() {
  const router = useRouter();
  const { idDivision, idPedido } = useCardStore();
  const { traerPedidoPorId } = usePedidosStore();
  const [pedidoPorPagar, setPedidoPorPagar] = useState<IPedidos | null>(null);

  useEffect(() => {
    pintarDatosDelPedido();
  }, [idPedido]);

  const pintarDatosDelPedido = async () => {
    if (!idPedido) {
      router.push("/cajero/pagar?pedidoId=" + idPedido);

      return;
    }
    const respuesta = await traerPedidoPorId(idPedido);
    if (!respuesta || !respuesta.pedidoItems) {
      toast.error("No se recibió un pedido válido.");
      router.push("/cajero/pagar?pedidoId=" + idPedido);
      return;
    }

    setPedidoPorPagar(respuesta);
  };

  const { pagarPedido, getFacturaPdf, loading } = useFacturasStore();

  const [counts, setCounts] = useState<Record<number, number>>({});
  const [totalReceived, setTotalReceived] = useState(0);
  const [change, setChange] = useState(0);
  const [declarar, setDeclarar] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalAPagar, setTotalAPagar] = useState<number>(0);

  const [returnBreakdown, setReturnBreakdown] = useState<
    Record<number, number>
  >({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [division, setDivision] = useState<IDataOpcional>({
    direccion: "",
    telefono: "",
    nota: "",
  });

  const calcularTotalAPagar = async () => {
    if (!idPedido) return;
    const respaldoKey = `respaldo_${idPedido}`;
    const respaldoStr = localStorage.getItem(respaldoKey);
    if (!respaldoStr) {
      console.error("No hay respaldo");
      return;
    }
    const respaldo = JSON.parse(respaldoStr);

    if (respaldo?.divisiones.length > 0) {
      const data = respaldo.divisiones.find((p: any) => p.id === idDivision);
      if (!data) return null;

      const baseAmount =
        data.customAmount ??
        data.items.reduce(
          (sum: number, it: any) => sum + it.precio * it.cantidad,
          0
        );

      const subtotalConDescuento =
        baseAmount * (1 - (respaldo.descuento ?? 0) / 100);
      const { totalWithTip } = calculateTip(
        subtotalConDescuento,
        data.tipPercent ?? 0,
        data.tipEnabled ?? true
      );
      setTotalAPagar(totalWithTip);
      return totalWithTip;
    }
    setTotalAPagar(respaldo.totalConPropina);
    return respaldo.totalConPropina;
  };

  useEffect(() => {
    if (!idPedido) return;
    calcularTotalAPagar();
    const respaldoKey = `respaldo_${idPedido}`;
    const respaldoStr = localStorage.getItem(respaldoKey);
    if (!respaldoStr) {
      console.error("No hay respaldo");
      return;
    }
    const respaldo = JSON.parse(respaldoStr);
    const miDivision = respaldo.divisiones.find(
      (e: any) => e.id === idDivision
    );
  }, [idPedido]);

  useEffect(() => {
    setCounts({});
    setTotalReceived(0);
  }, [declarar]);

  useEffect(() => {
    if (!declarar) {
      setTotalReceived(totalAPagar);
      return;
    }
    const sum = ALL_DENOMINATIONS.reduce((acc, { value }) => {
      const cnt = counts[value] || 0;
      return acc + value * cnt;
    }, 0);
    setTotalReceived(sum);
  }, [counts, declarar, totalAPagar]);
  useEffect(() => {
    const changeAmount = Math.max(
      Math.round(totalReceived) - Math.round(totalAPagar),
      0
    );
    setChange(changeAmount);

    let remaining = changeAmount;
    const breakdown: Record<number, number> = {};

    for (const { value } of ALL_DENOMINATIONS) {
      const cnt = Math.floor(remaining / value);
      if (cnt > 0) {
        breakdown[value] = cnt;
        remaining -= value * cnt;
      }
    }
    setReturnBreakdown(breakdown);
  }, [totalReceived, totalAPagar]);

  const handleCountChange = (denom: number, value: string) => {
    const num = Math.max(0, Math.floor(Number(value) || 0));
    setCounts({ ...counts, [denom]: num });
  };

  const handleUpdateDivision = (upd: Partial<IDataOpcional>) => {
    setDivision((prev) => ({ ...prev, ...upd }));
  };

  const handleBillClick = (denom: number, operation: "sum" | "subtract") => {
    setCounts((prevCounts) => {
      const newCount =
        operation === "sum"
          ? (prevCounts[denom] || 0) + 1
          : Math.max((prevCounts[denom] || 0) - 1, 0);
      return { ...prevCounts, [denom]: newCount };
    });
  };

  const cancelar = () => {
    router.push("/cajero/pagar?pedidoId=" + idPedido);
  };

  const handleClosePdfModal = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setShowPdfModal(false);
    setPdfUrl(null);
    router.push("/cajero/pagar?pedidoId=" + idPedido);
  };

  const finalizar = async () => {
    if (!pedidoPorPagar) return;
    if (isSubmitting) return;
    const recibido = declarar ? totalReceived : pedidoPorPagar?.total_estimado;

    if (Number(recibido) < totalAPagar) {
      toast.error("El dinero entregado no es suficiente.");
      return;
    }

    setIsSubmitting(true);
    try {
      const divisionFinal: IDataOpcional = {
        direccion:
          division.direccion === "" ? "KR 3A 17 98" : division.direccion,
        telefono: division.telefono === "" ? "3503590606" : division.telefono,
        nota: division.nota === "" ? "SIN NOTA" : division.nota,
      };

      const result = await generarPayloadPago({
        pedidoId: idPedido || "",
        idDivision: idDivision,
        division: divisionFinal,
        esEfectivo: true,
        denominacionesEfectivo: declarar ? counts : undefined,
      });
      if (!result) {
        toast.error("No se encontró la información de pago.");
        return;
      }

      const factura: FacturaEntity | null = await pagarPedido(result);

      if (!factura) {
        setIsSubmitting(false);
        return;
      }

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

      // Obtener el respaldo
      if (!idPedido) return;
      const respaldoKey = `respaldo_${idPedido}`;
      const respaldoStr = localStorage.getItem(respaldoKey);
      if (!respaldoStr) {
        console.error("No hay respaldo");
        return;
      }
      const respaldo = JSON.parse(respaldoStr);

      if (respaldo) {
        if (respaldo.divisiones && respaldo.divisiones.length > 0) {
          // Si hay divisiones, marcar la correspondiente como pagada
          const divisionIdx = respaldo.divisiones.findIndex(
            (d: any) => d.id === idDivision
          );

          if (divisionIdx !== -1) {
            respaldo.divisiones[divisionIdx].pagada = true;
          } else {
            console.warn("No se encontró la división a marcar como pagada.");
          }
        } else {
          // Si no hay divisiones, marcar singleDivision como pagada
          respaldo.singleDivision.pagada = true;
        }

        // Guardar nuevamente en el store
        localStorage.setItem(`respaldo_${idPedido}`, JSON.stringify(respaldo));
      } else {
        console.warn("No se encontró respaldo para este pedido.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al procesar el pago.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-100 p-3 sm:p-6 md:p-8 font-sans overflow-x-hidden">
      {/* LOADING SPINNER */}
      {loading && <Spinner />}

      {/* HEADER */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <ArrowLeft
          size={24}
          onClick={cancelar}
          className="cursor-pointer text-orange-500 shrink-0"
        />
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800 m-0">
          Recibir y Devolver Cambio
        </h1>
      </div>

      {/* TOTAL */}
      <div className="bg-white text-black rounded-lg p-4 sm:p-5 shadow-md text-base sm:text-lg md:text-xl font-semibold mb-4 sm:mb-6">
        Total a Pagar: <span className="text-orange-500">{totalAPagar}</span>
      </div>

      {/* CHECKBOX */}
      <div className="my-4 sm:my-5">
        <Checkbox
          label="Declarar billetes"
          checked={declarar}
          onChange={(checked) => setDeclarar(checked)}
        />
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex flex-col">
        {/* COLUMNA IZQUIERDA */}
        <div className="w-full ">
          {declarar && (
            <>
              {/* BILLETES */}
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                Billetes
              </h2>
              <div className="flex overflow-x-auto gap-3 pb-3 sm:pb-4 snap-x scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {BILL_DENOMINATIONS.map(({ value, img }) => (
                  <div
                    key={value}
                    className="bg-white text-black rounded-lg p-3 sm:p-4 shadow-md flex flex-col items-center justify-center min-w-[130px] sm:min-w-[150px] snap-center"
                  >
                    <img
                      src={img}
                      alt={`Billete de ${value.toLocaleString()}`}
                      className="w-full max-h-28 sm:max-h-36 object-contain cursor-pointer rounded-md mb-2"
                      onClick={() => handleBillClick(value, "sum")}
                    />
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handleBillClick(value, "subtract")}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <MinusCircle size={20} />
                      </button>
                      <input
                        type="number"
                        min={0}
                        className="w-16 sm:w-20 p-2 text-center border border-gray-300 rounded-md text-sm sm:text-base"
                        value={counts[value] || 0}
                        onChange={(e) =>
                          handleCountChange(value, e.target.value)
                        }
                      />
                      <button
                        onClick={() => handleBillClick(value, "sum")}
                        className="text-gray-500 hover:text-green-500 transition-colors"
                      >
                        <PlusCircle size={20} />
                      </button>
                    </div>
                    <div className="text-gray-800 font-medium text-sm sm:text-lg mt-2">
                      {value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* MONEDAS */}
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                Monedas
              </h2>
              <div className="flex overflow-x-auto gap-3 pb-3 sm:pb-4 snap-x scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {COIN_DENOMINATIONS.map(({ value, img }) => (
                  <div
                    key={value}
                    className="bg-white text-black rounded-lg p-3 sm:p-4 shadow-md flex flex-col items-center justify-center min-w-[130px] sm:min-w-[150px]  snap-center"
                  >
                    <img
                      src={img}
                      alt={`Moneda de ${value.toLocaleString()}`}
                      className="w-10 sm:w-12 h-10 sm:h-12 object-contain cursor-pointer mb-1"
                      onClick={() => handleBillClick(value, "sum")}
                    />
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleBillClick(value, "subtract")}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <MinusCircle size={16} />
                      </button>
                      <input
                        type="number"
                        min={0}
                        className="w-12 sm:w-14 p-1 text-center border border-gray-300 rounded-md text-xs sm:text-sm"
                        value={counts[value] || 0}
                        onChange={(e) =>
                          handleCountChange(value, e.target.value)
                        }
                      />
                      <button
                        onClick={() => handleBillClick(value, "sum")}
                        className="text-gray-500 hover:text-green-500"
                      >
                        <PlusCircle size={16} />
                      </button>
                    </div>
                    <div className="text-gray-800 font-medium text-xs sm:text-sm mt-1">
                      {value.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* COLUMNA DERECHA */}
        <div className="w-full  space-y-3 sm:space-y-4">
          <div className="bg-white text-black rounded-lg p-4 sm:p-5 shadow-md text-base sm:text-lg md:text-xl font-semibold">
            Total Recibido:{" "}
            <span
              className={
                totalReceived >= totalAPagar ? "text-green-600" : "text-red-600"
              }
            >
              {totalReceived.toLocaleString()}
            </span>
          </div>

          <div className="bg-white text-black rounded-lg p-4 sm:p-5 shadow-md text-base sm:text-lg md:text-xl font-semibold">
            Cambio:{" "}
            <span className="text-orange-600">{change.toLocaleString()}</span>
          </div>

          {change > 0 && (
            <div className="bg-white rounded-lg p-4 sm:p-5 shadow-md text-sm sm:text-base md:text-lg font-medium">
              <div className="text-gray-800 mb-2">
                Desglose del cambio a devolver:
              </div>
              {Object.entries(returnBreakdown).map(([denom, cnt]) => (
                <div key={denom} className="text-gray-600">
                  {cnt} x ${Number(denom).toLocaleString()}
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-6 mb-3 text-base sm:text-lg font-semibold text-gray-600">
            <span>Datos opcionales</span>
          </div>
          <DatosOpcionales
            division={division}
            onUpdate={handleUpdateDivision}
          />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 sm:static sm:mt-8 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md sm:shadow-none">
        <BotonRestaurante
          label="Cancelar"
          variacion="claro"
          onClick={cancelar}
          disabled={isSubmitting}
        />
        <BotonRestaurante
          label={isSubmitting ? "Procesando..." : "Finalizar"}
          onClick={finalizar}
          disabled={isSubmitting}
        />
      </footer>

      {/* MODAL PDF */}
      {showPdfModal && pdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-[95%] sm:w-4/5 md:w-3/4 lg:w-1/2 h-[80vh] flex flex-col overflow-hidden shadow-2xl">
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
    </div>
  );
}
