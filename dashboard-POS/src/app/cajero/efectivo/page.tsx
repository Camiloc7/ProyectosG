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
  const searchParams = useSearchParams();
  const propina = searchParams.get("propina");
  const parsedPropina = Number(propina);
  const locationState = useMemo(() => {
    const pedidoId = searchParams.get("pedidoId") ?? "";
    const total = searchParams.get("total");

    const idx = searchParams.get("idx");
    return {
      pedidoId: pedidoId,
      total: total ? Number(total) : 0,
      idx: idx ? Number(idx) : 0,
    };
  }, [searchParams]);

  const { pagarPedido, getFacturaPdf, loading } = useFacturasStore();
  const { idx, total, pedidoId } = locationState;

  const [counts, setCounts] = useState<Record<number, number>>({});
  const [totalReceived, setTotalReceived] = useState(0);
  const [change, setChange] = useState(0);
  const [declarar, setDeclarar] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [returnBreakdown, setReturnBreakdown] = useState<
    Record<number, number>
  >({});
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [division, setDivision] = useState<IDataOpcional>({
    direccion: "",
    telefono: "",
    nota: "",
    dv: "",
  });

  useEffect(() => {
    setCounts({});
    setTotalReceived(0);
  }, [declarar]);

  useEffect(() => {
    if (!declarar) {
      setTotalReceived(total);
      return;
    }
    const sum = ALL_DENOMINATIONS.reduce((acc, { value }) => {
      const cnt = counts[value] || 0;
      return acc + value * cnt;
    }, 0);
    setTotalReceived(sum);
  }, [counts, declarar, total]);

  useEffect(() => {
    const changeAmount = Math.max(totalReceived - total, 0);
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
  }, [totalReceived, total]);

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
    router.push(`/cajero/tarjetas?pedidoId=${pedidoId}`);
  };

  const handleClosePdfModal = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setShowPdfModal(false);
    setPdfUrl(null);
    router.push(`/cajero/tarjetas?pedidoId=${pedidoId}`);
  };

  const finalizar = async () => {
    if (isSubmitting) return;
    const recibido = declarar ? totalReceived : total;

    if (recibido < total) {
      toast.error("El dinero entregado no es suficiente.");
      return;
    }

    setIsSubmitting(true);
    try {
      const divisionFinal: IDataOpcional = {
        direccion:
          division.direccion === "" ? "KR 3A 17 98" : division.direccion,
        telefono: division.telefono === "" ? "3503590606" : division.telefono,
        dv: division.dv === "" ? "0" : division.dv,
        nota: division.nota === "" ? "SIN NOTA" : division.nota,
      };
      const result = await generarPayloadPago({
        pedidoId,
        idx,
        division: divisionFinal,
        total: total - parsedPropina,
        esEfectivo: true,
        denominacionesEfectivo: declarar ? counts : undefined,
      });

      if (!result) {
        toast.error("No se encontró la información de pago.");
        setIsSubmitting(false);
        return;
      }

      const factura: FacturaEntity | null = await pagarPedido(result.payload);

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

      const respaldoUnicoStr = localStorage.getItem(
        `respaldo_unico_${pedidoId}`
      );
      const respaldoDivididoStr = localStorage.getItem(
        `respaldo_dividido_${pedidoId}`
      );
      // const respaldoUnico = await window.electron.storeGet(`respaldo_unico_${pedidoId}`)
      // const respaldoDividido = await window.electron.storeGet(`respaldo_dividido_${pedidoId}`)

      if (respaldoUnicoStr) {
        const respaldoUnico = JSON.parse(respaldoUnicoStr);

        respaldoUnico.pagada = true;

        localStorage.setItem(
          `respaldo_unico_${pedidoId}`,
          JSON.stringify(respaldoUnico)
        );
        // await window.electron.storeSet(`respaldo_unico_${pedidoId}`, respaldoUnico)
      } else if (respaldoDivididoStr) {
        const respaldoDividido = JSON.parse(respaldoDivididoStr);

        if (
          Array.isArray(respaldoDividido.pagos) &&
          respaldoDividido.pagos[idx]
        ) {
          respaldoDividido.pagos[idx].pagada = true;
          localStorage.setItem(
            `respaldo_dividido_${pedidoId}`,
            JSON.stringify(respaldoDividido)
          );

          // await window.electron.storeSet(`respaldo_dividido_${pedidoId}`, respaldoDividido)
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al procesar el pago.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans">
      {/* HEADER */}
      {loading && <Spinner />}
      <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        <ArrowLeft
          size={24}
          onClick={cancelar}
          className="cursor-pointer text-orange-500 shrink-0"
        />
        <h1 className="text-xl sm:text-3xl font-bold text-gray-800 m-0">
          Recibir y Devolver Cambio
        </h1>
      </div>

      {/* TOTAL */}
      <div className="bg-white text-black rounded-lg p-4 sm:p-5 shadow-md text-lg sm:text-xl font-semibold mb-4 sm:mb-6">
        Total a Pagar:{" "}
        <span className="text-orange-500">{total.toLocaleString()}</span>
      </div>

      {/* CHECKBOX */}
      <div className="my-4 sm:my-5">
        <Checkbox
          label="Declarar billetes"
          checked={declarar}
          onChange={(checked) => setDeclarar(checked)}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
        <div className="flex-1">
          {declarar && (
            <>
              {/* BILLETES */}
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                Billetes
              </h2>
              <div className="flex overflow-x-auto gap-3 pb-3 sm:pb-4 snap-x">
                {BILL_DENOMINATIONS.map(({ value, img }) => (
                  <div
                    key={value}
                    className="bg-white text-black rounded-lg p-3 sm:p-4 shadow-md flex flex-col items-center justify-center min-w-[140px] snap-center"
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
                        className="w-14 sm:w-16 p-1 sm:p-2 text-center border border-gray-300 rounded-md text-sm sm:text-base"
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
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                Monedas
              </h2>
              <div className="flex overflow-x-auto gap-3 pb-3 sm:pb-4 snap-x">
                {COIN_DENOMINATIONS.map(({ value, img }) => (
                  <div
                    key={value}
                    className="bg-white text-black rounded-lg p-3 shadow-md flex flex-col items-center min-w-[100px] snap-center"
                  >
                    <img
                      src={img}
                      alt={`Moneda de ${value.toLocaleString()}`}
                      className="w-12 h-12 object-contain cursor-pointer mb-1"
                      onClick={() => handleBillClick(value, "sum")}
                    />
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleBillClick(value, "subtract")}
                      >
                        <MinusCircle size={16} />
                      </button>
                      <input
                        type="number"
                        min={0}
                        className="w-10 sm:w-12 p-1 text-center border border-gray-300 rounded-md text-xs sm:text-sm"
                        value={counts[value] || 0}
                        onChange={(e) =>
                          handleCountChange(value, e.target.value)
                        }
                      />
                      <button onClick={() => handleBillClick(value, "sum")}>
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

        {/* INFO TOTAL */}
        <div className="flex-1 space-y-3 sm:space-y-4">
          <div className="bg-white text-black rounded-lg p-4 sm:p-5 shadow-md text-lg sm:text-xl font-semibold">
            Total Recibido:{" "}
            <span
              className={
                totalReceived >= total ? "text-green-600" : "text-red-600"
              }
            >
              {totalReceived.toLocaleString()}
            </span>
          </div>

          <div className="bg-white text-black rounded-lg p-4 sm:p-5 shadow-md text-lg sm:text-xl font-semibold">
            Cambio:{" "}
            <span className="text-orange-600">{change.toLocaleString()}</span>
          </div>

          {change > 0 && (
            <div className="bg-white rounded-lg p-4 sm:p-5 shadow-md text-base sm:text-lg font-medium">
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

          <div
            style={{
              textAlign: "center",
              marginTop: 24,
              marginBottom: 12,
              fontSize: 18,
              fontWeight: 600,
              fontFamily: "Lato, sans-serif",
              color: "#555",
            }}
          >
            <span>Datos opcionales</span>
          </div>
          <DatosOpcionales
            division={division}
            onUpdate={handleUpdateDivision}
          />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t p-3 sm:static sm:mt-8 flex justify-between items-center gap-3 shadow-md sm:shadow-none">
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

      {showPdfModal && pdfUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
    </div>
  );
}
