"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  Division,
  DivisionCard,
  DivisionErrors,
} from "../../../features/pagar/DivisionCards";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { FONDO, FONDO_COMPONENTES, ORANGE } from "../../../styles/colors";
import { DivisionCommonInfo } from "@/components/DivisionCommonInfo";
import { PropinaSection } from "@/components/PropinaSection";
import { calculateTip } from "@/utils/propina";
import { IPedidos } from "@/types/models";
import { ListaItems } from "@/features/pagar/ListaDeItems";
import { formatearNumero } from "@/features/pagar/ListaDeItems";
import { usePedidosStore } from "@/stores/pedidosStore";
import InputField from "@/components/ui/InputField";

const formatearPedidoCompleto = (pedido: any): IPedidos => {
  return {
    id: pedido.id,
    mesa_id: pedido.mesa?.id || "",
    mesa_numero: pedido.mesa?.numero || "",
    usuario_domiciliario_id: pedido.usuario_domiciliario_id || "",
    estado: pedido.estado,
    tipo_pedido: pedido.tipo_pedido,
    cliente_nombre: pedido.cliente_nombre || "",
    cliente_telefono: pedido.cliente_telefono || "",
    cliente_direccion: pedido.cliente_direccion || "",
    total_estimado: pedido.total_estimado,
    descuentos_aplicados: pedido.descuentos_aplicados,
    notas: pedido.notas || "",
    pedidoItems: (pedido.pedidoItems || []).map((item: any) => ({
      id: item.id,
      nombre: item.producto?.nombre || "Producto Desconocido", // mejor si tomás del producto
      cantidad: item.cantidad,
      precio: parseFloat(item.precio_unitario_al_momento_venta || "0"),
      notas: item.notas_item || "",
    })),
    created_at: new Date(pedido.created_at),
    codigo_pedido: pedido.codigo_pedido,
    numero_secuencial_diario: pedido.numero_secuencial_diario,
  };
};

export type DivisionMode = "PRODUCTS" | "MONEY" | undefined;

const TOLERANCE_PESOS = 100;
interface PedidoItem {
  id: string;
  name: string;
  cantidad: number;
  precio: number;
  notas?: string;
}

export default function DivisionCuentas() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { traerPedidoPorId, loading } = usePedidosStore();
  const pedidoId = searchParams.get("pedidoId");

  // const pedidoPorPagar: IPedidos | undefined = pedidos.find(
  //   (p) => p.id === pedidoId
  // );
  const [pedidoPorPagar, setPedidoPorPagar] = useState<IPedidos | null>(null);

  const [pedido, setPedido] = useState<IPedidos>();
  const [active, setActive] = useState<number>(0);
  const [moneyCount, setMoneyCount] = useState<number>(2);
  const [descuento, setDescuento] = useState<number>(0);
  const [divisiones, setDivisiones] = useState<Division[]>([]);
  const [errors, setErrors] = useState<DivisionErrors[]>([]);
  const [locked, setLocked] = useState(false);
  const [singleDivision, setSingleDivision] = useState<Division>({
    name: "",
    cedula: "",
    docType: "",
    correo: "",
    electronica: false,
    tipEnabled: false,
    tipPercent: 10,
    items: [],
    mode: undefined,
  });
  const [singleErrors, setSingleErrors] = useState<DivisionErrors>({
    name: false,
    docType: false,
    cedula: false,
    correo: false,
  });
  const mode: DivisionMode =
    active === 1 ? "PRODUCTS" : active === 2 ? "MONEY" : undefined;

  const totalPedido = useMemo(() => {
    return (
      pedido?.pedidoItems?.reduce(
        (sum, it) => sum + it.cantidad * it.precio,
        0
      ) ?? 0
    );
  }, [pedido]);

  const subtotal = totalPedido;

  const traerPedidoParaPagar = async () => {
    if (!pedidoId) return;
    const pedido = await traerPedidoPorId(pedidoId);
    if (!pedido) return;
    const formateado = formatearPedidoCompleto(pedido);
    setPedidoPorPagar(formateado);
    setPedido(formateado);
  };
  useEffect(() => {
    traerPedidoParaPagar();
  }, []);

  useEffect(() => {
    setErrors([]);
    if (mode === "PRODUCTS") {
      const init: Division[] = Array.from({ length: 2 }, () => ({
        name: "",
        correo: "",
        docType: "",
        tipEnabled: true,
        tipPercent: 10,
        cedula: "",
        items: [],
        mode: "PRODUCTS",
      }));
      setDivisiones(init);
    } else {
      setDivisiones([]);
      setMoneyCount(2);
    }
  }, [mode]);

  useEffect(() => {
    if (mode === "MONEY") {
      const count = Math.max(1, moneyCount);
      const share = Math.ceil(totalPedido / count);
      const newDivs: Division[] = Array.from({ length: count }, () => ({
        name: "",
        items: [],
        tipEnabled: true,
        tipPercent: 10,
        mode: "MONEY",
        customAmount: share,
      }));
      setDivisiones(newDivs);
    }
  }, [moneyCount, mode, totalPedido]);

  useEffect(() => {
    setErrors(
      divisiones.map(() => ({
        name: false,
        docType: false,
        cedula: false,
        correo: false,
      }))
    );
  }, [divisiones.length]);

  const computeRemaining = (idx: number) => {
    if (!pedidoPorPagar?.pedidoItems) return [];
    const used: Record<string, number> = {};
    divisiones.forEach((div, i) => {
      if (i === idx) return;
      div.items.forEach((it) => {
        used[it.id] = (used[it.id] || 0) + it.cantidad;
      });
    });
    return pedidoPorPagar.pedidoItems.map((it) => ({
      ...it,
      cantidad: Math.max(it.cantidad - (used[it.id] || 0), 0),
      max: Math.max(it.cantidad - (used[it.id] || 0), 0),
    }));
  };

  const handleUpdate = (idx: number, updated: Division) => {
    const maxItems = computeRemaining(idx);
    const correctedItems = updated.items.map((it) => {
      const maxItem = maxItems.find((m) => m.id === it.id);
      const maxAllowed = maxItem?.cantidad ?? 0;
      const safeQty = Math.min(Math.max(it.cantidad, 0), maxAllowed);
      return { ...it, cantidad: safeQty, max: maxAllowed };
    });

    const correctedDivision = { ...updated, items: correctedItems };
    setDivisiones((prev) =>
      prev.map((d, i) => (i === idx ? correctedDivision : d))
    );
    setErrors((prev) =>
      prev.map((e, i) =>
        i === idx
          ? {
              name: !correctedDivision.name?.trim(),
              docType: !correctedDivision.docType,
              cedula: !correctedDivision.cedula?.trim(),
              correo:
                !correctedDivision.correo?.trim() ||
                !isEmailValid(correctedDivision.correo || ""),
            }
          : e
      )
    );
  };

  const validateItemDistribution = (): boolean => {
    const totalAssigned: Record<string, number> = {};
    divisiones.forEach((div) => {
      div.items.forEach((it) => {
        totalAssigned[it.id] = (totalAssigned[it.id] || 0) + it.cantidad;
      });
    });
    if (!pedidoPorPagar || !pedidoPorPagar.pedidoItems) {
      toast.error("Error: No se recibió un pedido válido.");
      return false;
    }
    for (const item of pedidoPorPagar.pedidoItems) {
      if ((totalAssigned[item.id] || 0) > item.cantidad) {
        toast.error(
          `Error: El producto "${item.nombre}" tiene asignadas más unidades (${
            totalAssigned[item.id]
          }) que las disponibles (${item.cantidad}).`
        );
        return false;
      }
    }
    return true;
  };

  const canAddDivision = () => {
    if (!pedidoPorPagar?.pedidoItems) return false;
    const totalAssigned: Record<string, number> = {};
    divisiones.forEach((div) => {
      div.items.forEach((it) => {
        totalAssigned[it.id] = (totalAssigned[it.id] || 0) + it.cantidad;
      });
    });
    return pedidoPorPagar.pedidoItems.some(
      (item) => (totalAssigned[item.id] || 0) < item.cantidad
    );
  };

  const addDivision = () => {
    setDivisiones((prev) => [
      ...prev,
      {
        name: `División ${prev.length + 1}`,
        items: [],
        mode: "PRODUCTS",
        tipAmount: 10,
        tipEnabled: true,
        tipPercent: 10,
      },
    ]);
  };

  const totalDivisiones =
    Math.ceil(
      divisiones.reduce((sum, d) => {
        if (d.mode === "MONEY" && d.customAmount != null)
          return sum + d.customAmount;
        return sum + d.items.reduce((s, it) => s + it.cantidad * it.precio, 0);
      }, 0) * 100
    ) / 100;

  const isEmailValid = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateSingle = (): boolean => {
    const { name, docType, cedula, correo } = singleDivision;
    const newErr: DivisionErrors = {
      name: !name?.trim(),
      docType: !docType,
      cedula: !cedula?.trim(),
      correo: !correo?.trim() || !isEmailValid(correo || ""),
    };
    setSingleErrors(newErr);
    const valid = Object.values(newErr).every((e) => !e);
    if (!valid)
      toast.error(
        "Completa todos los campos requeridos en la sección de datos."
      );
    return valid;
  };

  const validateAll = (): boolean => {
    if (!divisiones.length) {
      toast.error("No hay ítems en la cuenta.");
      return false;
    }

    const newErrors = divisiones.map((d) => {
      const name = d.name?.trim();
      const correo = d.correo?.trim();
      const cedula = d.cedula?.trim();
      if (name === "111" || name === "222") {
        const correoInvalido = !correo || !isEmailValid(correo);
        return {
          name: false,
          docType: false,
          cedula: false,
          correo: correoInvalido,
        };
      }
      return {
        name: !name,
        docType: !d.docType,
        cedula: !cedula,
        correo: !correo || !isEmailValid(correo),
      };
    });

    setErrors(newErrors);

    return newErrors.every(
      (e) => !e.name && !e.docType && !e.cedula && !e.correo
    );
  };
  const handleProcess = async () => {
    if (!pedidoPorPagar?.id) {
      toast.error("No se encontró el ID del pedido.");
      return;
    }
    if (active === 0) {
      //?----------EN CASO DE SER UNA CUENTA SIMPLE--------------
      if (!validateSingle()) return;

      const data = {
        pedido_id: pedidoPorPagar.id,
        propina: tipAmount,
        descuento,
        monto_a_pagar: totalWithTip,
        tipo_documento: singleDivision.docType,
        numero_documento: singleDivision.cedula,
        pagada: false,
        nombre_completo: singleDivision.name,
        correo_electronico: singleDivision.correo,
      };

      localStorage.setItem(
        `respaldo_unico_${pedidoPorPagar.id}`,
        JSON.stringify(data)
      );

      //   await window.electron.storeSet(`respaldo_unico_${pedidoPorPagar.id}`, data)
    } else {
      //?----------EN CASO DE SER UNA CUENTA DIVIDIDA--------------
      //Validamos que las cuentas esten divididas correctamente
      if (!validateAll()) return;
      if (!validateItemDistribution()) return;

      //Armamos el json de cada una de las cuentas
      const pagos = divisiones.map((d) => {
        const base =
          d.mode === "MONEY" && d.customAmount != null
            ? d.customAmount
            : d.items.reduce((s, it) => s + it.cantidad * it.precio, 0);

        const baseConDescuento = base * (1 - descuento / 100); //Total de la division con descuentos aplicados

        const { tipAmount, totalWithTip } = calculateTip(
          baseConDescuento,
          d.tipPercent ?? 0,
          d.tipEnabled ?? false
        );

        if (totalWithTip <= 0) {
          alert(
            "No puedes continuar, hay tarjetas sin monto a pagar asignado."
          );
          return;
        }

        return {
          monto_a_pagar: totalWithTip,
          tipo_documento: d.docType || "",
          propina: tipAmount.toFixed(2),
          pagada: false,
          numero_documento: d.cedula || "",
          nombre_completo: d.name || "",
          correo_electronico: d.correo || "",
        };
      });

      const data = {
        pedido_id: pedidoPorPagar.id,
        descuento, //El descuento es global para todas las cards
        pagos,
      };

      localStorage.setItem(
        `respaldo_dividido_${pedidoPorPagar.id}`,
        JSON.stringify(data)
      );

      //   await window.electron.storeSet(`respaldo_dividido_${pedidoPorPagar.id}`, data)
    }

    // Navegar a siguiente vista
    router.push(`/cajero/tarjetas?pedidoId=${pedidoPorPagar.id}`);

    // navigate('/tarjetas-por-pagar', { state: { pedidoId: pedidoPorPagar.id } })
  };

  const diff = Math.abs(totalDivisiones - totalPedido);
  const ok =
    active === 0 ||
    (mode === "PRODUCTS"
      ? divisiones.length >= 2 &&
        totalDivisiones >= totalPedido &&
        diff <= TOLERANCE_PESOS
      : diff <= TOLERANCE_PESOS && totalDivisiones >= totalPedido);

  const buttonStyle = {
    backgroundColor: ORANGE,
    color: "#ffffff",
    height: 40,
    padding: "8px 16px",
    fontWeight: 500,
    border: "none",
    borderRadius: 25,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    transition: "box-shadow 0.3s ease",
  };

  const totalConPropina = useMemo(() => {
    return divisiones.reduce((acc, d) => {
      const baseAmount =
        d.mode === "MONEY" && d.customAmount != null
          ? d.customAmount
          : d.items.reduce((sum, it) => sum + it.cantidad * it.precio, 0);

      const { totalWithTip } = calculateTip(
        baseAmount,
        d.tipPercent ?? 0,
        d.tipEnabled ?? false
      );

      return acc + totalWithTip * (1 - descuento / 100);
    }, 0);
  }, [divisiones, descuento]);

  const subtotalConDescuento = subtotal * (1 - descuento / 100);
  const { totalWithTip, tipAmount } = calculateTip(
    subtotalConDescuento,
    singleDivision.tipPercent ?? 0,
    singleDivision.tipEnabled ?? false
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: FONDO,
        fontFamily: "Lato, sans-serif",
        padding: 32,
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1124, margin: "0 auto" }}>
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
            onClick={() => router.push("/cajero")}
            style={{ cursor: "pointer", stroke: ORANGE }}
          />
          <h1
            style={{ fontSize: 24, fontWeight: 700, color: "#333", margin: 0 }}
          >
            Dividir Cuenta
          </h1>
        </div>

        <div
          style={{
            backgroundColor: FONDO_COMPONENTES,
          }}
        >
          <ListaItems items={pedidoPorPagar?.pedidoItems || []} />
        </div>
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex flex-1 p-1 rounded-xl bg-black">
            <div
              className="absolute inset-0 z-0 transition-transform duration-300 ease-out rounded-lg"
              style={{
                width: `${
                  100 /
                  [
                    "Una Sola Cuenta",
                    "Dividir por Productos",
                    "Dividir por Dinero",
                  ].length
                }%`,
                transform: `translateX(${active * 100}%)`,
                backgroundColor: ORANGE,
                boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
              }}
            />
            {[
              "Una Sola Cuenta",
              "Dividir por Productos",
              "Dividir por Dinero",
            ].map((opt, i) => (
              <button
                key={opt}
                onClick={() => {
                  if (!locked) {
                    setActive(i);
                    setLocked(true);
                  }
                }}
                className={`
                    relative flex-1 py-3 px-2 text-sm font-medium z-10 transition-colors duration-300 rounded-lg whitespace-nowrap overflow-hidden text-ellipsis
                    ${active === i ? "text-grey-400" : "text-white"} 
                    ${
                      locked
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer"
                    }
                `}
                disabled={locked}
              >
                {opt}
              </button>
            ))}
          </div>
          <button
            onClick={() => setLocked((prev) => !prev)}
            className="p-2 transition-transform duration-200 hover:scale-110"
          >
            {locked ? (
              <Lock size={24} color={ORANGE} strokeWidth={2.5} />
            ) : (
              <Unlock size={24} color={ORANGE} />
            )}
          </button>
        </div>
        {mode === "MONEY" && (
          <div style={{ marginBottom: 30 }}>
            <label style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>
              Dividir cuenta en:
            </label>
            <input
              type="number"
              min={1}
              max={250}
              style={{
                marginLeft: 12,
                padding: 8,
                borderRadius: 12,
                border: "1px solid #D1D5DB",
                fontSize: 14,
                width: 80,
              }}
              value={moneyCount}
              onChange={(e) =>
                setMoneyCount(
                  Math.max(0, Math.min(400, Number(e.target.value)))
                )
              }
            />
          </div>
        )}

        {mode === "PRODUCTS" && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "#333",
              }}
            >
              Cantidad de divisiones: {divisiones.length}
            </h2>
            <button
              style={buttonStyle}
              onClick={addDivision}
              disabled={!canAddDivision()}
              title={
                !canAddDivision()
                  ? "No quedan productos para asignar"
                  : undefined
              }
            >
              Agregar División
            </button>
          </div>
        )}
        {active !== 0 && mode && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 24,
              marginBottom: 32,
            }}
          >
            {divisiones.map((div, idx) => (
              <DivisionCard
                key={idx}
                descuento={descuento}
                mode={mode}
                division={div}
                errors={errors[idx]}
                allItems={computeRemaining(idx)}
                onUpdate={(upd) => handleUpdate(idx, upd)}
                onDelete={() => {
                  if (divisiones.length > 2) {
                    setDivisiones((prev) => prev.filter((_, i) => i !== idx));
                    setErrors((prev) => prev.filter((_, i) => i !== idx));
                  }
                }}
              />
            ))}
          </div>
        )}
        {active === 0 && (
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 8,
              padding: 20,
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              marginBottom: 20,
            }}
          >
            <DivisionCommonInfo
              division={singleDivision}
              errors={singleErrors}
              onUpdate={(upd) => setSingleDivision((d) => ({ ...d, ...upd }))}
            />
            <PropinaSection
              tipEnabled={singleDivision.tipEnabled ?? true}
              tipPercent={singleDivision.tipPercent ?? 10}
              subtotal={subtotal}
              tipAmount={tipAmount ?? 0}
              onToggleTip={() =>
                setSingleDivision((d) => ({ ...d, tipEnabled: !d.tipEnabled }))
              }
              onChangeTipPercent={(newPct) =>
                setSingleDivision((d) => ({ ...d, tipPercent: newPct }))
              }
            />
            <div
              style={{
                marginTop: 12,
                borderTop: "1px solid #eee",
                paddingTop: 12,
              }}
            >
              <div style={{ fontSize: 10, color: "#666", marginBottom: 4 }}>
                Total con descuento y propina
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 600,
                  color: "#333",
                }}
              >
                <span>Total a pagar:</span>
                <span>${formatearNumero(totalWithTip)}</span>
              </div>
            </div>
          </div>
        )}
        <div className="flex">
          <div className="w-[80%]">
            <InputField
              label="Descuento %"
              onChange={(e) =>
                setDescuento(Math.min(100, Math.max(0, Number(e.target.value))))
              }
              value={descuento}
            />
          </div>
          <div className="mt-8 ml-auto">
            {active !== 0 && mode && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: ok ? "#38A169" : "#E53E3E",
                  }}
                >
                  {active === 0
                    ? totalPedido.toFixed(0)
                    : `${formatearNumero(totalConPropina)} / ${formatearNumero(
                        subtotalConDescuento
                      )}`}
                </span>
                <small style={{ fontSize: 12, color: "#718096", marginTop: 4 }}>
                  * Este número es solo una ayuda visual del total a pagar.
                </small>
              </div>
            )}
            <button
              disabled={!ok}
              style={{
                ...buttonStyle,
                backgroundColor: ok ? "#38A169" : "#A0AEC0",
                cursor: ok ? "pointer" : "not-allowed",
                marginLeft: 16,
              }}
              onClick={handleProcess}
            >
              Procesar Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
