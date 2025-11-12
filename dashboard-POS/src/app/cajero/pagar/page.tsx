"use client";
import { PropinaSection } from "@/components/PropinaSection";
import InputField from "@/components/ui/InputField";
import {
  Division,
  DivisionCard,
  DivisionErrors,
} from "@/features/divisionCuentas/DivisionCards";
import { DivisionCommonInfo } from "@/features/divisionCuentas/DivisionCommonInfo";
import { ListaItems } from "@/features/divisionCuentas/ListaDeItems";
import { formatearNumero } from "@/helpers/betterNumberFormat";
import { calculateTip } from "@/helpers/CalculateTip";
import { useCardStore } from "@/stores/CardsStore";
import { usePedidosStore } from "@/stores/pedidosStore";
import { FONDO, FONDO_COMPONENTES, ORANGE } from "@/styles/colors";

import { ArrowLeft, Lock, RefreshCcw, Unlock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useClienteStore } from "@/stores/clienteStore";

export type DivisionMode = "PRODUCTS" | "MONEY" | undefined;

const TOLERANCE_PESOS = 85;
// EL BACK TIENE TOLERANCIA DE 100 PESOS, pero dentro de las sub cuentas de el pago electronico tiene tolerancia de un peso, por lo que
// teoricamente el back no lanzaria ningun error si las subcuentas no son mas de 15 y todas al maximo de la tolerancia

type IItemsPedidos = {
  id: string;
  nombre: string;
  cantidad: number;
  precio: number;
  notas: string;
  tipo?: "simple" | "configurable";
  opcionesSeleccionadas?: "simple" | "configurable";
};

type IPedidos = {
  id: string;
  mesa_id: string;
  mesa_numero: string;
  usuario_domiciliario_id?: string;
  estado: string;
  tipo_pedido: string;
  cliente_nombre?: string;
  cliente_telefono?: string;
  cliente_direccion?: string;
  total_estimado: string;
  descuentos_aplicados: string;
  notas?: string;
  pedidoItems: IItemsPedidos[];
};

export default function DivisionCuentas() {
  const router = useRouter();
  const { traerPedidoPorId, loading } = usePedidosStore();
  const { guardarInfoPago } = useCardStore();
  const searchParams = useSearchParams();
  const pedidoId = searchParams.get("pedidoId");
  const { fetchExternalClientInfo } = useClienteStore();
  const { traerClientesQB, clientes } = useClienteStore();
  const [pedidoPorPagar, setPedidoPorPagar] = useState<IPedidos | null>(null);

  const [pedido, setPedido] = useState<IPedidos>();
  const [active, setActive] = useState<number>(0);
  const [pedidoPagado, setPedidoPagado] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [moneyCount, setMoneyCount] = useState<number>(2);
  const [descuento, setDescuento] = useState<number>(0);
  const [divisiones, setDivisiones] = useState<Division[]>([]);
  const [errors, setErrors] = useState<DivisionErrors[]>([]);
  const [locked, setLocked] = useState(false);
  const [BLOQUEADO, SETBLOQUEADO] = useState(false);
  const mode: DivisionMode =
    active === 1 ? "PRODUCTS" : active === 2 ? "MONEY" : undefined;
  // single division state (solo para "Una Sola Cuenta")

  const [singleDivision, setSingleDivision] = useState<Division>({
    id: crypto.randomUUID(), // <-- ID único
    name: "Cliente Genérico",
    cedula: "111111111111",
    docType: "Cédula de ciudadanía",
    DV: "0",
    correo: "pruebas@ejemplo.com",
    electronica: false,
    pagada: false,
    tipEnabled: false,
    tipPercent: 10,
    items: [],
    mode: undefined,
  });
  //Errores de la division simple o de una sola cuenta
  const [singleErrors, setSingleErrors] = useState<DivisionErrors>({
    name: false,
    docType: false,
    cedula: false,
    correo: false,
    DV: false,
  });

  // Total del pedido
  const totalPedido = useMemo(() => {
    return (
      pedido?.pedidoItems?.reduce(
        (sum, it) => sum + it.cantidad * it.precio,
        0
      ) ?? 0
    );
  }, [pedido]);

  const pintarDatosDelPedido = async () => {
    if (!pedidoId) {
      router.push("/cajero");
      toast.error("No se recibio un id de pedido");
      return;
    }
    const respuesta = await traerPedidoPorId(pedidoId);
    if (!respuesta || !respuesta.pedidoItems) {
      toast.error("No se recibió un pedido válido.");
      router.push("/cajero");
      return;
    }

    // ✅ Usar los datos reales (id y precio) del pedido original
    const itemsTransformados = respuesta.pedidoItems.map((item: any) => ({
      id: item.id,
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precio: item.precio_unitario_al_momento_venta,
      notas: item.notas ?? "",
    }));

    setPedidoPorPagar({
      ...respuesta,
      pedidoItems: itemsTransformados,
    });

    setPedido({
      ...respuesta,
      pedidoItems: itemsTransformados,
    });
    cargarRespaldo();
  };

  const setClientName = async () => {
    // Para la división simple
    if (singleDivision.docType && singleDivision.cedula) {
      if (singleDivision.docType === "3" || singleDivision.docType === "21") {
        // suponiendo "3" es CC
        const info: any = await fetchExternalClientInfo(
          "CC",
          singleDivision.cedula
        );
        // Normalizar a string: preferir info.nombre si existe, luego string directo, luego fallback al nombre previo
        let nameStr = "";
        if (typeof info === "string") nameStr = info;
        else if (
          info &&
          typeof info === "object" &&
          typeof info.nombre === "string"
        )
          nameStr = info.nombre;
        else if (info != null) nameStr = String(info);

        if (nameStr) {
          setSingleDivision((prev) => ({
            ...prev,
            name: nameStr,
          }));
        }
      }

      //En caso de ser nit
      if (singleDivision.docType === "6") {
        //Buscar el cliente en quality bill
        const clienteEncontradoQB = clientes.find(
          (e: any) => e.nit === singleDivision.cedula
        );

        if (clienteEncontradoQB?.nombre) {
          setSingleDivision((prev) => ({
            ...prev,
            name: clienteEncontradoQB.nombre,
            DV: clienteEncontradoQB.dv,
          }));
        }
      }
    }

    // Para divisiones múltiples
    const updatedDivs = await Promise.all(
      divisiones.map(async (div) => {
        if (div.docType && div.cedula) {
          //SI EL TIPO DE DOCUMENTO ES CEDULA DE EXTRANGERIA O DE CIUDADANIA ENTONCES CONTINUAMOS
          if (div.docType === "3" || div.docType === "21") {
            //CUANDO ESTE AGREGADO EL TIPO DE DOCUMENTO PT LE AGREGAMOS ACA
            const info: any = await fetchExternalClientInfo("CC", div.cedula);
            let nameStr = "";
            if (typeof info === "string") nameStr = info;
            else if (
              info &&
              typeof info === "object" &&
              typeof info.nombre === "string"
            )
              nameStr = info.nombre;
            else if (info != null) nameStr = String(info);

            return { ...div, name: nameStr || div.name };
          }

          // //SI EL TIPO DE DOCUMEMTNO ES 31 ENTONCES
          // if (div.docType === "31") {
          //   console.log("yeah");
          //   const cliente = clientes.find(div.cedula);
          //   console.log(cliente);
          //   // return { ...div, name: nameStr || div.name };
          // }
        }
        return div;
      })
    );

    setDivisiones(updatedDivs);
  };

  useEffect(() => {
    const fetchName = async () => {
      // Solo buscar si docType y cedula están definidos y no son genéricos
      if (
        singleDivision.docType &&
        singleDivision.cedula &&
        singleDivision.cedula !== "111111111111" &&
        singleDivision.cedula !== "222222222222"
      ) {
        await setClientName();
      }
    };
    fetchName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [singleDivision.docType, singleDivision.cedula]);

  //Pintamos los datos del pedido
  useEffect(() => {
    pintarDatosDelPedido();
  }, [pedidoId]);

  //Pintamos los datos del pedido
  useEffect(() => {
    if (clientes.length < 1) {
    }
    traerClientesQB();
  }, []);

  //Revisamos si hay reespaldo de la division de cuentas en disco y si es asi lo pintamos en el front:
  useEffect(() => {
    cargarRespaldo();
  }, [pedidoPorPagar]);

  // Cada que cambie la cantidad de divisiones borramos los errores
  useEffect(() => {
    setErrors(
      divisiones.map(() => ({
        name: false,
        docType: false,
        cedula: false,
        correo: false,
        DV: false,
      }))
    );
  }, [divisiones.length]);

  const cambioDeModo = (i: number) => {
    if (isRestoring) {
      console.error("Esta restoring");
      return;
    }
    if (locked) {
      console.error("Esta locked");
      return;
    }
    if (i === active) return;
    setActive(i);
    setErrors([]);
    setDivisiones([]);
    setMoneyCount(2);
    const createDivision = (
      mode: "MONEY" | "PRODUCTS" | undefined,
      customAmount?: number
    ): Division => ({
      id: crypto.randomUUID(),
      cedula: "111111111111",
      docType: "Cédula de ciudadanía",
      name: "Cliente Genérico",
      correo: "pruebas@ejemplo.com",
      items: [],
      pagada: false,
      DV: "0",
      tipEnabled: false,
      tipPercent: 10,
      mode,
      customAmount,
    });

    if (i === 2) {
      const count = Math.max(1, moneyCount);
      const share = Math.ceil(totalPedido / count);
      setDivisiones(
        Array.from({ length: count }, () => createDivision("MONEY", share))
      );
    } else if (i === 1) {
      setDivisiones(
        Array.from({ length: 2 }, () => createDivision("PRODUCTS"))
      );
    } else {
      setDivisiones([]);
      setMoneyCount(2);
    }
    // setLocked(true)
  };

  const moreDivisionsMoney = (e: any) => {
    const newCount = Math.max(2, Math.min(400, Number(e.target.value)));
    setMoneyCount(newCount);

    // Actualizamos las divisiones inmediatamente
    const share = Math.ceil(totalPedido / newCount);
    const newDivs: Division[] = Array.from({ length: newCount }, () => ({
      id: crypto.randomUUID(),
      name: "Cliente Genérico",

      cedula: "111111111111",
      docType: "Cédula de ciudadanía",
      DV: "0",

      correo: "pruebas@ejemplo.com",

      items: [],
      pagada: false,
      tipEnabled: false,
      tipPercent: 10,
      mode: "MONEY",
      customAmount: share,
    }));
    setDivisiones(newDivs);
  };

  const cargarRespaldo = async () => {
    setIsRestoring(true);
    if (!pedidoPorPagar?.id) {
      setIsRestoring(false);
      return; // No detenemos el restoring porque volveremos a intentarlo cuando cambie el estado de pedido por pagar
    }
    const respaldoKey = `respaldo_${pedidoPorPagar.id}`;
    const respaldoStr = localStorage.getItem(respaldoKey);
    if (!respaldoStr) {
      setIsRestoring(false);
      return;
    }
    const respaldo = JSON.parse(respaldoStr);

    if (!respaldo) {
      setIsRestoring(false);
      return;
    }
    //SI ES QUE EL NO HAY DIVISION DE CUENTAS
    if (respaldo.divisiones.length <= 0) {
      if (respaldo.singleDivision.pagada === true) {
        //Y EL PEDIDO YA FUE PAGADO
        setPedidoPagado(true); //MOSTRAR MENSAJE
        setTimeout(() => {
          localStorage.removeItem(respaldoKey);
          setPedidoPagado(false); //DEJAR DE MOSTRAR MENSAJE
          router.push("/cajero");
        }, 2000);
        setIsRestoring(false);
        return; //DETENER LA FUNCION
      }
      //SI EL PEDIDO AUN NO FUE PAGADO
      localStorage.removeItem(respaldoKey);
      SETBLOQUEADO(false);
      setIsRestoring(false);
      return; //DETENER LA FUNCION
    }
    if (respaldo) {
      SETBLOQUEADO(true);
      const divisionesNormalizadas = respaldo.divisiones.map((div: any) => ({
        ...div,
        items: div.items.map((it: any) => {
          const pedidoOriginal = pedidoPorPagar.pedidoItems.find(
            (p: any) => p.id === it.id
          );
          return {
            ...it,
            precio: it.precio ?? pedidoOriginal?.precio ?? 0,
            nombre: it.nombre ?? pedidoOriginal?.nombre ?? "",
          };
        }),
      }));

      setDivisiones(divisionesNormalizadas);

      setSingleDivision({
        id: crypto.randomUUID(),
        name: "",
        cedula: "",
        docType: "",
        correo: "",
        electronica: false,
        tipEnabled: false,
        tipPercent: 10,
        DV: "",

        items: [],
        mode: undefined,
        pagada: false,
      });

      setDescuento(respaldo.descuento ?? 0);
      setPedido(respaldo.pedido);
      setActive(respaldo.mode === "MONEY" ? 2 : 1);
      setIsRestoring(false);

      setTimeout(() => setIsRestoring(false), 0);
    }

    // ✅ Revisar si todas las divisiones y la cuenta simple están pagadas
    const todasPagadas =
      respaldo?.divisiones?.every((d: any) => d.pagada) ?? false;
    if (todasPagadas) {
      // Mostrar mensaje por 2 segundos
      setPedidoPagado(true);
      if (respaldo) {
        localStorage.removeItem(respaldoKey);
      }
      setIsRestoring(false);
      setTimeout(() => {
        setPedidoPagado(false);
        router.push("/cajero");
      }, 2000);
    }
  };

  // --- computeRemaining robusto: calcula cantidad disponible por producto para la división idx ---
  const computeRemaining = (idx: number) => {
    if (!pedidoPorPagar?.pedidoItems) return [];

    const used: Record<string, number> = {};
    divisiones.forEach((div, i) => {
      if (i === idx) return;
      div.items.forEach((it) => {
        used[it.id] = (used[it.id] || 0) + it.cantidad;
      });
    });
    return pedidoPorPagar.pedidoItems.map((it: any) => ({
      ...it,
      cantidad: Math.max(it.cantidad - (used[it.id] || 0), 0),
      max: Math.max(it.cantidad - (used[it.id] || 0), 0),
    }));
  };

  //El controlador para actualizar las divisionesw
  const handleUpdate = (idx: number, updated: Division) => {
    // Limitar cantidades en items a max
    const maxItems = computeRemaining(idx);
    const correctedItems = updated.items.map((it) => {
      const maxItem = maxItems.find((m: any) => m.id === it.id);
      const maxAllowed = maxItem?.cantidad ?? 0;
      const safeQty = Math.min(Math.max(it.cantidad, 0), maxAllowed);
      return { ...it, cantidad: safeQty, max: maxAllowed };
    });

    const correctedDivision = { ...updated, items: correctedItems };

    // Actualizar divisiones y errores
    setDivisiones((prev) =>
      prev.map((d, i) => (i === idx ? correctedDivision : d))
    );
    setErrors((prev) =>
      prev.map((e, i) =>
        i === idx
          ? {
              name: !correctedDivision.name.trim(),
              docType: !correctedDivision.docType,
              DV: !correctedDivision.DV,

              cedula: !correctedDivision.cedula?.trim(),
              correo:
                !correctedDivision.correo?.trim() ||
                !isEmailValid(correctedDivision.correo || ""),
            }
          : e
      )
    );
  };

  // --- Validar que la suma de todas las cantidades no exceda el pedido ---
  const validateItemDistribution = (): boolean => {
    if (!pedidoPorPagar) return false;
    // Acumular cantidades por producto
    const totalAssigned: Record<string, number> = {};
    divisiones.forEach((div) => {
      div.items.forEach((it) => {
        totalAssigned[it.id] = (totalAssigned[it.id] || 0) + it.cantidad;
      });
    });

    // Comparar contra pedido original
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

  // Funcion que verifica si es que se pueden añadir mas divisiones segun la cantidad de items
  const canAddDivision = () => {
    if (!pedidoPorPagar?.pedidoItems) return false;

    const totalAssigned: Record<string, number> = {};
    divisiones.forEach((div) => {
      div.items.forEach((it) => {
        totalAssigned[it.id] = (totalAssigned[it.id] || 0) + it.cantidad;
      });
    });

    return pedidoPorPagar.pedidoItems.some(
      (item: any) => (totalAssigned[item.id] || 0) < item.cantidad
    );
  };

  //Fuincion que añade divisiones nuevas
  const addDivision = () => {
    setDivisiones((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(), // <-- ID único
        name: `División ${prev.length + 1}`,
        items: [],
        mode: "PRODUCTS",
        tipAmount: 10,
        DV: "0",

        pagada: false,
        tipEnabled: false,
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

  //Verificacion de mail
  const isEmailValid = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Funcion que valida en caso de una cuenta simple
  const validateSingle = (): boolean => {
    const { name, docType, cedula, correo, DV } = singleDivision;
    const newErr: DivisionErrors = {
      name: !name?.trim(),
      docType: !docType,
      DV: !DV,

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

  //Validaciones en caso de mas de una cuenta
  const validateAll = (): boolean => {
    if (!divisiones.length) {
      toast.error("No hay ítems en la cuenta.");
      return false;
    }

    const newErrors = divisiones.map((d) => {
      const name = d.name?.trim();
      const correo = d.correo?.trim();
      const cedula = d.cedula?.trim();

      //En caso de que el nombre sea 111 No validar nada
      if (name === "111") {
        return {
          name: false,
          docType: false,
          cedula: false,
          correo: false,
          DV: false,
        };
      }

      //En caso de nombre 222 Solo validar que el correo exista y sea válido
      if (name === "222") {
        const correoInvalido = !correo || !isEmailValid(correo);
        return {
          name: false,
          docType: false,
          cedula: false,
          DV: false,
          correo: correoInvalido,
        };
      }

      // Validación general
      return {
        name: !name,
        docType: !d.docType,
        cedula: !cedula,
        correo: !correo || !isEmailValid(correo),
        DV: !d.DV,
      };
    });

    setErrors(newErrors);

    return newErrors.every(
      (e) => !e.name && !e.docType && !e.cedula && !e.correo && !e.DV
    );
  };

  // ¿Dentro del umbral y cumple mínimo de divisiones?
  const diff = Math.abs(totalDivisiones - totalPedido);
  const ok =
    active === 0 ||
    (mode === "PRODUCTS"
      ? divisiones.length >= 2 &&
        totalDivisiones >= totalPedido &&
        diff <= TOLERANCE_PESOS
      : diff <= TOLERANCE_PESOS && totalDivisiones >= totalPedido);

  const totaslSinPropina = useMemo(() => {
    return divisiones.reduce((acc, d) => {
      const baseAmount =
        d.mode === "MONEY" && d.customAmount != null
          ? d.customAmount
          : d.items.reduce((sum, it) => sum + it.cantidad * it.precio, 0);

      // const { totalWithTip } = calculateTip(baseAmount, d.tipPercent ?? 0, d.tipEnabled ?? false)

      return acc + baseAmount * (1 - descuento / 100);
    }, 0);
  }, [divisiones, descuento]);

  const subtotalConDescuento = totalPedido * (1 - descuento / 100);

  //ACA ESTA EL MONTO POR PAGAR, Y LA PROPINA EN PESOS DE LA CUENTA SIMPLE
  const { totalWithTip, tipAmount } = calculateTip(
    subtotalConDescuento,
    singleDivision.tipPercent ?? 0,
    singleDivision.tipEnabled ?? false
  );

  const onPagar = async (id: string, electronica: boolean) => {
    if (!pedidoPorPagar) return;

    const destino = electronica ? "/cajero/electronico" : "/cajero/efectivo";

    // const destino = electronica ? "/electronico" : "/cambio";
    // 1️⃣ Validar que todas las divisiones tengan items o customAmount
    if (active !== 0) {
      const invalidDivision = divisiones.find(
        (d) =>
          (!d.items || d.items.length === 0) &&
          (d.mode !== "MONEY" || d.customAmount == null)
      );

      if (invalidDivision) {
        toast.error(
          "No se puede pagar: hay divisiones sin items asignados o monto definido."
        );
        return; // Detener la función
      }
    }

    // Estructura de respaldo
    const data = {
      pedido: pedidoPorPagar,
      singleDivision,
      divisiones,
      descuento,
      totalConPropina: totalWithTip,
      mode,
    };

    // Validaciones
    if (active === 0) {
      if (!validateSingle()) return;
    } else {
      if (!validateAll()) return;
      if (!validateItemDistribution()) return;
    }
    // console.log(data);
    localStorage.setItem(`respaldo_${pedidoPorPagar.id}`, JSON.stringify(data));
    guardarInfoPago(pedidoPorPagar.id, id);
    router.push(destino);
  };
  const buttonStyle = {
    backgroundColor: ORANGE,
    color: "#ffffff",
    height: 40,
    padding: "8px 16px",
    minWidth: 160,
    fontWeight: 500,
    border: "none",
    borderRadius: 25,
    fontSize: 14,
    cursor: "pointer",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    transition: "box-shadow 0.3s ease",
  };

  const setClientNameForDivision = async (
    idx: number,
    docType: string,
    cedula: string
  ) => {
    let nameStr = "";
    let dvStr = "";
    let found = false; // ✅ Para saber si encontró datos válidos

    if (docType === "3" || docType === "21") {
      const info: any = await fetchExternalClientInfo("CC", cedula);
      if (typeof info === "string") nameStr = info;
      else if (info && typeof info.nombre === "string") nameStr = info.nombre;
      else if (info != null) nameStr = String(info);
      found = !!nameStr;
    }

    if (docType === "6") {
      const clienteEncontradoQB = clientes.find((e: any) => e.nit === cedula);
      if (clienteEncontradoQB) {
        nameStr = clienteEncontradoQB.nombre || "";
        dvStr = clienteEncontradoQB.dv || "";
        found = true;
      }
    }

    // ✅ Si encontró nombre válido, actualizar división y limpiar errores
    if (found) {
      setDivisiones((prev) => {
        const newDivs = [...prev];
        newDivs[idx] = {
          ...newDivs[idx],
          name: nameStr || newDivs[idx].name,
          DV: dvStr || newDivs[idx].DV,
        };
        return newDivs;
      });

      // ✅ Limpiar errores del campo en esa división
      setErrors((prev) => {
        const newErrors = [...prev];
        newErrors[idx] = {
          ...newErrors[idx],
          name: false,
          cedula: false,
          DV: false,
        };
        return newErrors;
      });
    }
  };

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
      {pedidoPagado && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            zIndex: 9999,
            fontSize: "1.5rem",
            textAlign: "center",
            padding: "20px",
            backdropFilter: "blur(5px)",
          }}
        >
          <h1>✅ Pedido pagado completamente</h1>
          <p>Gracias por su compra, redirigiendo a la lista de pedidos...</p>
        </div>
      )}

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
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.05)",
            marginBottom: 32,
          }}
        >
          <ListaItems items={pedido?.pedidoItems} />
        </div>

        {/* Triple switch */}
        {!BLOQUEADO && (
          <>
            {/* Selector de modos */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 30,
              }}
            >
              <div
                style={{
                  position: "relative",
                  display: "flex",
                  flex: 1,
                  backgroundColor: "#000000",
                  borderRadius: 9999,
                  padding: 4,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 4,
                    bottom: 4,
                    left: `calc(${(100 / 3) * active}% + 4px)`,
                    width: `calc(${100 / 3}% - 8px)`,
                    backgroundColor: ORANGE,
                    borderRadius: 9999,
                    transition: "left 0.3s",
                  }}
                />
                {[
                  "Una Sola Cuenta",
                  "Dividir Productos",
                  "Dividir por dinero",
                ].map((opt, i) => (
                  <button
                    key={opt}
                    onClick={() => {
                      cambioDeModo(i);
                    }}
                    style={{
                      flex: 1,
                      zIndex: 2,
                      border: "none",
                      background: "transparent",
                      color: active === i ? "#FFFFFF" : "#CCCCCC",
                      fontWeight: 600,
                      padding: "10px 0",
                      cursor: locked ? "not-allowed" : "pointer",
                      opacity: locked ? 0.6 : 1,
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setLocked((prev) => !prev)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {locked ? (
                  <Lock size={24} color={ORANGE} />
                ) : (
                  <Unlock size={24} color={ORANGE} />
                )}
              </button>
            </div>

            {/* Modo MONEY */}
            {mode === "MONEY" && (
              <div style={{ marginBottom: 30 }}>
                <label style={{ fontSize: 16, fontWeight: 600, color: "#333" }}>
                  Dividir cuenta en:
                </label>
                <input
                  type="number"
                  min={1} //!No cambiar el minimo o se buguea
                  max={250}
                  style={{
                    marginLeft: 12,
                    padding: 8,
                    color: "#333",
                    borderRadius: 12,
                    border: "1px solid #D1D5DB",
                    fontSize: 14,
                    width: 80,
                  }}
                  value={moneyCount}
                  onChange={
                    (e) => moreDivisionsMoney(e)
                    // setMoneyCount(Math.max(0, Math.min(400, Number(e.target.value))))
                  } //!No cambiar el minimo o se buguea
                />
              </div>
            )}

            {/* Modo PRODUCTS */}
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
          </>
        )}

        {/* EN CASO DE CUENTA DIVIDIDA POR DINERO O PRODUCTOS */}
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
                onUpdate={(upd) => {
                  handleUpdate(idx, upd); // actualiza la division
                  if (upd.docType && upd.cedula) {
                    setClientNameForDivision(idx, upd.docType, upd.cedula);
                  }
                }}
                onDelete={() => {
                  if (divisiones.length > 2) {
                    setDivisiones((prev) => prev.filter((_, i) => i !== idx));
                    setErrors((prev) => prev.filter((_, i) => i !== idx));
                  }
                }}
                onPagar={onPagar}
                bloqueado={BLOQUEADO}
                ok={ok}
              />
            ))}
          </div>
        )}

        {/* FORM EN CASO DE UNA CUENTA SIMPLE */}
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
              disabled={BLOQUEADO}
              onUpdate={(upd) => setSingleDivision((d) => ({ ...d, ...upd }))}
            />
            <PropinaSection
              tipEnabled={singleDivision.tipEnabled ?? true}
              tipPercent={singleDivision.tipPercent ?? 10}
              subtotal={totalPedido}
              tipAmount={tipAmount ?? 0}
              disabled={BLOQUEADO}
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
                color: "#333",

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
                }}
              >
                <span>Total a pagar:</span>
                <span>${formatearNumero(totalWithTip)}</span>
              </div>
            </div>

            {ok && (
              <div
                style={{
                  marginTop: 12,
                  borderTop: "1px solid #eee",
                  paddingTop: 12,
                  display: "flex",
                  justifyContent: "flex-end", // los coloca a la derecha
                  gap: 8, // separación entre los botones
                }}
              >
                <button
                  onClick={() => onPagar(singleDivision.id, false)}
                  style={buttonStyle}
                >
                  Efectivo
                </button>
                <button
                  onClick={() => onPagar(singleDivision.id, true)}
                  style={buttonStyle}
                >
                  Electrónico/Mixto
                </button>
              </div>
            )}
          </div>
        )}

        {/* barra final */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24, // Espacio entre input y el bloque de abajo
            backgroundColor: FONDO_COMPONENTES,
            padding: 24,
            borderRadius: 24,
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Input arriba */}
          <InputField
            label="Porcentaje de Descuento"
            type="number"
            disabled={BLOQUEADO}
            min={"0"}
            max={"100"}
            onChange={(e) =>
              setDescuento(Math.min(100, Math.max(0, Number(e.target.value))))
            }
            value={descuento || ""}
          />

          {/* Parte inferior */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexDirection: "row", // fila para que número quede a la izquierda y botón a la derecha
              width: "100%",
            }}
          >
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
                    : `${formatearNumero(totaslSinPropina)} / ${formatearNumero(
                        subtotalConDescuento
                      )}`}
                </span>
                <small style={{ fontSize: 12, color: "#718096", marginTop: 4 }}>
                  * Este número es solo una ayuda visual del total a pagar.
                </small>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
