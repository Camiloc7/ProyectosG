"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import SimpleSelect from "@/components/ui/SimpleSelect";
import { ArrowLeft } from "lucide-react";
import { FONDO, ORANGE } from "../../../styles/colors";
import { toast } from "react-hot-toast";
import { useCuentasStore } from "@/stores/cuentaStore";
import { useFacturasStore, FacturaEntity } from "@/stores/facturasStore"; // ⬅️ Actualizado
import Spinner from "@/components/feedback/Spinner";
import BotonRestaurante from "@/components/ui/Boton";
import { generarPayloadPago } from "@/utils/generarPagoPayload";
import InputField from "@/components/ui/InputField";
import { DatosOpcionales, IDataOpcional } from "@/components/DatosOpcionales";

export default function PagoElectronico() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idx = searchParams.get("idx");
  const total = searchParams.get("total");
  const propina = searchParams.get("propina");
  const pedidoId = searchParams.get("pedidoId");
  const parsedIdx = Number(idx);
  const parsedTotal = Number(total);
  const parsedPropina = Number(propina);
  const { pagarPedido, loading, getFacturaPdf } = useFacturasStore(); // ⬅️ Actualizado
  const { traerCuentas, cuentas, loading: loadingCuentas } = useCuentasStore();
  const [cuenta, setCuenta] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [division, setDivision] = useState<IDataOpcional>({
    direccion: "",
    telefono: "",
    nota: "",
    dv: "",
  });

  // ⬅️ NUEVOS ESTADOS para el PDF
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  useEffect(() => {
    traerCuentas();
  }, []);

  const handleUpdateDivision = (upd: Partial<IDataOpcional>) => {
    setDivision((prev: IDataOpcional) => ({ ...prev, ...upd }));
  };

  // ⬅️ NUEVA FUNCIÓN para cerrar el modal del PDF
  const handleClosePdfModal = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    setShowPdfModal(false);
    setPdfUrl(null);
    router.push(`/tarjetas-por-pagar?pedidoId=${pedidoId}`);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!cuenta) {
      toast.error("Por favor selecciona una cuenta bancaria.");
      return;
    }
    if (!pedidoId) {
      toast.error("No se encontró el ID del pedido.");
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
        idx: parsedIdx,
        division: divisionFinal,
        total: parsedTotal - parsedPropina,
        esEfectivo: false,
        cuentaId: cuenta,
      });

      if (!result) {
        toast.error("No se encontró la información de pago.");
        setIsSubmitting(false); // ⬅️ Asegurar que se detiene el envío
        return;
      }

      // ⬅️ LOGICA PARA PAGAR Y OBTENER EL PDF
      const factura: FacturaEntity | null = await pagarPedido(result.payload);

      if (!factura) {
        setIsSubmitting(false);
        return;
      }
      
      const pdfBlob = await getFacturaPdf(factura.id);
      if (pdfBlob instanceof Blob && pdfBlob.type === "application/pdf") {
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setShowPdfModal(true);
        toast.success("Factura generada correctamente.");
      } else {
        toast.error("Factura procesada, pero no se pudo obtener el PDF válido.");
        handleClosePdfModal();
      }
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al procesar el pago.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: FONDO,
        padding: 32,
        fontFamily: "Lato, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 32,
        }}
      >
        <ArrowLeft
          size={24}
          onClick={() =>
            router.push(`/tarjetas-por-pagar?pedidoId=${pedidoId}`)
          }
          style={{ cursor: "pointer", stroke: ORANGE }}
        />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#333" }}>
          Pago Electrónico
        </h1>
      </div>

      <div
        style={{ maxWidth: 480, margin: "0 auto", display: "grid", gap: 16 }}
      >
        <SimpleSelect
          label="Seleccione la cuenta"
          options={cuentas.map((c) => ({ id: c.id, nombre: c.nombre_banco }))}
          value={cuenta}
          onChange={(v) => setCuenta(v)}
          error={cuenta === ""}
        />

        <div>
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

        <div
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginTop: 20,
            color: "#333",
          }}
        >
          Total a pagar:{" "}
          <span style={{ color: ORANGE }}>{parsedTotal.toLocaleString()}</span>
        </div>

        <BotonRestaurante
          label={isSubmitting ? "Procesando..." : "Registrar pago"}
          onClick={handleSubmit}
          disabled={isSubmitting}
        />
      </div>

      {(loading || loadingCuentas) && <Spinner />}
      
      {/* ⬅️ NUEVO: MODAL DEL PDF */}
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
