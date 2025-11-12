"use client";

import { useState, useEffect, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import {
  Minus,
  Plus,
  Search,
  MapPin,
  User,
  Phone,
  Trash2,
  NotebookPen,
} from "lucide-react";
import {
  useProductosStore,
  IProductoConfigurableCompleto,
  Producto,
} from "@/stores/productosStore";
import { toast } from "react-hot-toast";
import { usePedidosStore } from "@/stores/pedidosStore";
import { useMesasStore, IMesa, IMesasLibres } from "@/stores/mesasStore";
import BotonRestaurante from "@/components/ui/Boton";
import Spinner from "@/components/feedback/Spinner";
import { FONDO, ORANGE } from "@/styles/colors";
import ModalConfigurable from "@/components/modals/ModalConfigurable";
import { IPedidos, Mesa } from "@/types/models";
import { useAuthStore } from "@/stores/authStore";
import TransferirMesaModal from "@/components/modals/TransferirMesaModal";
interface PedidoItem {
  id: string;
  uniqueId: string;
  nombre: string;
  precio: number;
  cantidad: number;
  nota?: string;
  categoria?: string;
  tipo?: "simple" | "configurable";
  opcionesSeleccionadas?: {
    nombreOpcion: string;
    valor: string;
    precio: number;
  }[];
}
interface PedidoItemBase {
  id: string;
  nombre: string;
  precio: number;
  cantidad: number;
  nota?: string;
  categoria?: string;
  tipo?: "simple" | "configurable";
  opcionesSeleccionadas?: {
    nombreOpcion: string;
    valor: string;
    precio: number;
  }[];
}
export interface IFormPedidos {
  id?: string;
  origen: string;
  telefono: string;
  notas: string;
  nombre: string;
  direccion: string;
  idOrdenExterna: string;
  mesa: string;
}
const tiposDeOrigen = [
  {
    id: "MESA",
    nombre: "Servicio en el local",
    icon: "/mesa.svg",
    description: "Servicio en el local",
  },
  {
    id: "DOMICILIO",
    nombre: "A Domicilio",
    icon: "/domiciliario.svg",
    description: "Entrega a domicilio",
  },
  {
    id: "PARA_LLEVAR",
    nombre: "Para llevar",
    icon: "/para_llevar.svg",
    description: "Pedidos para recoger",
  },
];
const convertirAItemPedido = (producto: Producto): PedidoItem => {
  return {
    id: producto.id,
    uniqueId: crypto.randomUUID(),
    nombre: producto.nombre,
    precio: Number(producto.precio),
    cantidad: 1,
    tipo: "simple",
    nota: "",
  };
};
export default function EditarPedido({
  params,
}: {
  params: Promise<{ pedidoId: string }>;
}) {
  const { pedidoId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const { traerCategorias, categorias, traerProductos, productos, loading } =
    useProductosStore();
  const [nombreMesa, setNombreMesa] = useState<string>("");

  const [estadoPedido, setEstadoPedido] = useState<string>("");
  const [pedidoItemsOriginales, setPedidoItemsOriginales] = useState<
    PedidoItem[]
  >([]);

  const { traerProductoConfigurable } = useProductosStore();
  const {
    traerPedidoPorId,
    actualizarPedido,
    loading: loadingPedidos,
    transferirMesa,
    agregarItemsAPedidoEntregado,
  } = usePedidosStore();
  const { traerMesasLibres, mesasLibres, fetchMesaById } = useMesasStore();
  const [pedidoItems, setPedidoItems] = useState<PedidoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [activeCat, setActiveCat] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [infoPedido, setInfoPedido] = useState<IFormPedidos>({
    origen: "",
    telefono: "",
    notas: "",
    nombre: "",
    direccion: "",
    idOrdenExterna: "",
    mesa: "",
  });
  const [errors, setErrors] = useState({
    origen: false,
    telefono: false,
    direccion: false,
    nombre: false,
    idOrdenExterna: false,
    mesa: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfigurableModal, setShowConfigurableModal] = useState(false);
  const [productoConfigurable, setProductoConfigurable] =
    useState<IProductoConfigurableCompleto | null>(null);
  const [loadingInitialData, setLoadingInitialData] = useState(true);
  const [mesaDelPedido, setMesaDelPedido] = useState<Mesa | null>(null);

  useEffect(() => {
    traerCategorias();
    traerProductos();
  }, [traerCategorias, traerProductos]);

  useEffect(() => {
    if (categorias.length > 0 && !activeCat) {
      setActiveCat(categorias[0].nombre);
    }
  }, [categorias, activeCat]);

  useEffect(() => {
    const totalCount = pedidoItems.reduce(
      (acc, cur) => acc + cur.cantidad * cur.precio,
      0
    );
    setTotal(totalCount);
    setReadyCount(pedidoItems.length);
  }, [pedidoItems]);

  useEffect(() => {
    const fetchPedidoData = async () => {
      if (pedidoId && productos.length > 0) {
        setLoadingInitialData(true);
        try {
          const pedido = await traerPedidoPorId(pedidoId);
          if (!pedido) {
            toast.error(
              "No se pudo cargar el pedido. Por favor, intente de nuevo."
            );
            return;
          }

          setEstadoPedido(pedido.estado); // 👈 Guardamos el estado del pedido

          if (pedido.mesa_id) {
            const mesaOcupada = await fetchMesaById(pedido.mesa_id);
            if (mesaOcupada) {
              setMesaDelPedido(mesaOcupada);
            }
          }

          if (pedido.tipo_pedido === "MESA") {
            await traerMesasLibres();
          }

          setInfoPedido({
            origen: pedido.tipo_pedido,
            telefono: pedido.cliente_telefono || "",
            nombre: pedido.cliente_nombre || "",
            notas: pedido.notas || "",
            direccion: pedido.cliente_direccion || "",
            idOrdenExterna: pedido.idOrdenExterna || "",
            mesa: pedido.mesa_id || "",
          });

          if (pedido?.mesa?.numero) {
            setNombreMesa(pedido.mesa.numero);
          }

          const items = pedido.pedidoItems.map((item: any) => {
            const tipo: "simple" | "configurable" =
              item.producto_configurable_id ? "configurable" : "simple";
            const nombreProducto =
              item.producto?.nombre || "Producto Desconocido";
            const itemPrice =
              Number(item.precio_unitario_al_momento_venta) || 0;
            const opcionesSeleccionadas = item.configuracion_json
              ? JSON.parse(item.configuracion_json)
              : [];

            return {
              id: item.producto_id,
              uniqueId: crypto.randomUUID(),
              nombre: nombreProducto,
              precio: itemPrice,
              cantidad: item.cantidad,
              nota: item.notas_item || "",
              tipo,
              opcionesSeleccionadas,
            };
          });

          setPedidoItems(items);
          setPedidoItemsOriginales(items); // 👈 Guardamos copia para detectar nuevos
        } catch (error) {
          console.error("Error al cargar el pedido:", error);
          toast.error(
            "Hubo un error al cargar el pedido. Intente de nuevo más tarde."
          );
        } finally {
          setLoadingInitialData(false);
        }
      }
    };
    fetchPedidoData();
  }, [
    pedidoId,
    productos,
    traerPedidoPorId,
    fetchMesaById,
    traerMesasLibres,
    router,
  ]);

  const obtenerItemsNuevos = () => {
    return pedidoItems.filter((itemNuevo) => {
      const itemOriginal = pedidoItemsOriginales.find(
        (orig) => orig.id === itemNuevo.id
      );

      // Si no existía antes
      if (!itemOriginal) return true;

      // Si aumentó la cantidad
      if (itemNuevo.cantidad > itemOriginal.cantidad) {
        return true;
      }

      return false;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInfoPedido((prev) => ({ ...prev, [name]: value }));
  };
  const handleCantidad = (item: PedidoItem, delta: number) => {
    // Si el pedido está entregado y se intenta restar
    if (estadoPedido === "ENTREGADO" && delta < 0) {
      toast.error("No puedes reducir cantidades en un pedido entregado");
      return;
    }

    setPedidoItems((prev) => {
      const existing = prev.find((p) => p.uniqueId === item.uniqueId);

      if (existing) {
        const nuevaCantidad = existing.cantidad + delta;
        if (estadoPedido === "ENTREGADO" && nuevaCantidad < existing.cantidad) {
          // Bloquear reducciones incluso por lógica interna
          return prev;
        }
        const updated = prev
          .map((p) =>
            p.uniqueId === item.uniqueId
              ? { ...p, cantidad: Math.max(1, nuevaCantidad) }
              : p
          )
          .filter((p) => p.cantidad > 0);
        return updated;
      } else if (delta > 0) {
        return [...prev, { ...item, cantidad: 1, nota: "" }];
      }
      return prev;
    });
  };

  const handleRemoveItem = (uniqueId: string) => {
    if (estadoPedido === "ENTREGADO") {
      toast.error("No puedes eliminar productos de un pedido entregado");
      return;
    }
    setPedidoItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
  };

  const handleNotaChange = (uniqueId: string, nota: string) => {
    setPedidoItems((prev) =>
      prev.map((p) => (p.uniqueId === uniqueId ? { ...p, nota } : p))
    );
  };
  const handleOpenConfigurableModal = async (id: string) => {
    setProductoConfigurable(null);
    setShowConfigurableModal(true);
    const data = await traerProductoConfigurable(id);
    setProductoConfigurable(data || null);
  };
  const handleAddToPedido = (newPedidoItem: PedidoItem) => {
    setPedidoItems((prev) => {
      const existing = prev.find(
        (p) => p.id === newPedidoItem.id && p.tipo === "simple"
      );
      if (existing) {
        return prev.map((p) =>
          p.uniqueId === existing.uniqueId
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        );
      }
      return [...prev, { ...newPedidoItem, uniqueId: crypto.randomUUID() }];
    });
  };
  const handleGuardarCambios = async () => {
    const newErrors = {
      origen: false,
      telefono: false,
      direccion: false,
      nombre: false,
      idOrdenExterna: false,
      mesa: false,
    };
    let valid = true;

    if (infoPedido.origen === "DOMICILIO") {
      if (
        !infoPedido.telefono ||
        infoPedido.telefono.replace(/\D/g, "").length < 7
      ) {
        newErrors.telefono = true;
        toast.error("Teléfono debe tener al menos 7 dígitos");
        valid = false;
      }
      if (!infoPedido.nombre) {
        newErrors.nombre = true;
        toast.error("Nombre es requerido");
        valid = false;
      }
      if (!infoPedido.direccion) {
        newErrors.direccion = true;
        toast.error("Dirección es requerida");
        valid = false;
      }
    }

    if (infoPedido.origen === "MESA" && !infoPedido.mesa) {
      newErrors.mesa = true;
      toast.error("Número de mesa es requerido");
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    if (pedidoItems.length === 0) {
      toast.error("Agrega al menos un producto al pedido");
      return;
    }

    // ⚠️ Si el pedido está entregado, enviamos solo los nuevos ítems al backend
    if (estadoPedido === "ENTREGADO") {
      const nuevos = obtenerItemsNuevos();

      if (nuevos.length === 0) {
        toast("No hay productos nuevos para agregar");
        return;
      }

      try {
        for (const item of nuevos) {
          const itemOriginal = pedidoItemsOriginales.find(
            (orig) => orig.id === item.id
          );

          const cantidadAAgregar = item.cantidad;

          if (cantidadAAgregar <= 0) continue;

          const payload = {
            tipo_producto: "SIMPLE",
            producto_id: item.id,
            producto_configurable_id:
              item.tipo === "configurable" ? item.id : null,
            configuracion_json:
              item.tipo === "configurable"
                ? JSON.stringify(item.opcionesSeleccionadas || [])
                : null,
            cantidad: cantidadAAgregar,
            notas_item: item.nota || "",
            estado_cocina: "PENDIENTE",
          };

          // 👇 Llama a tu función del store (agrega esta función si no existe)
          await usePedidosStore
            .getState()
            .agregarItemsAPedidoEntregado(pedidoId, payload);
        }

        volver();
      } catch (err) {
        console.error(err);
        toast.error("Error al agregar nuevos productos");
      }

      return; // 👈 detenemos aquí
    }

    // 🧩 Si no está entregado, flujo normal
    const payloadProductos = pedidoItems.map((item) => ({
      id: item.id,
      cantidad: item.cantidad,
      nota: item.nota,
      opciones:
        item.tipo === "configurable" ? item.opcionesSeleccionadas : undefined,
    }));

    const pedido = {
      ...infoPedido,
      productos: payloadProductos,
      total,
      id: pedidoId,
    };

    actualizarPedido(pedido);
    volver();
  };

  const volver = () => {
    if (user?.rol === "MESERO") {
      router.push("/mesero");
    } else {
      router.push("/cajero");
    }
  };

  const handleTransfer = async (newMesaId: string) => {
    if (!pedidoId) {
      toast.error("No se pudo transferir el pedido. ID no encontrado.");
      return;
    }
    const success = await transferirMesa(pedidoId, newMesaId);
    if (success) {
      setShowTransferModal(false);
      volver();
    }
  };

  const filteredItems = useMemo(() => {
    if (searchTerm) {
      return productos.filter((item) =>
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return productos.filter(
      (it) => "categoria" in it && it.categoria === activeCat
    );
  }, [productos, activeCat, searchTerm]);

  const mesasADesplegar = useMemo(() => {
    const mesas = [...mesasLibres];
    if (mesaDelPedido) {
      if (
        mesaDelPedido.numero !== undefined &&
        !mesas.some((m) => m.id === mesaDelPedido.id)
      ) {
        const mesaConvertida = {
          ...mesaDelPedido,
          nombre: mesaDelPedido.numero.toString(),
        };
        mesas.unshift(mesaConvertida);
      }
    }
    return mesas;
  }, [mesasLibres, mesaDelPedido]);
  const findCantidad = (id: string) =>
    pedidoItems.find((p) => p.id === id)?.cantidad || 0;
  const findNota = (uniqueId: string) =>
    pedidoItems.find((p) => p.uniqueId === uniqueId)?.nota || "";

  const origenParaMostrar = tiposDeOrigen.find(
    (o) => o.id === infoPedido.origen
  );

  if (loading || loadingPedidos || loadingInitialData) {
    return <Spinner />;
  }
  return (
    <>
      <div
        className="min-h-screen p-6 font-lato flex flex-col lg:flex-row gap-8"
        style={{ backgroundColor: FONDO }}
      >
        <div className="flex-shrink-0 flex flex-col items-center lg:w-1/4">
          <h1 className="text-2xl font-semibold text-gray-900 m-0 text-center lg:text-left">
            Actualizando Pedido
            {infoPedido.origen === "MESA" && mesaDelPedido && (
              <div className="mt-2 text-lg font-bold text-orange-500">
                {nombreMesa}
              </div>
            )}
          </h1>

          {origenParaMostrar && (
            <div className="flex flex-col gap-4 w-full max-w-xs mt-6">
              <button
                key={origenParaMostrar.id}
                className={`
                  flex flex-col items-center justify-center gap-2 p-6 rounded-xl shadow-md transition-all duration-300
                  bg-orange-500 text-white transform scale-105
                `}
                disabled
              >
                <img
                  src={origenParaMostrar.icon}
                  alt={origenParaMostrar.nombre}
                  width={80}
                  height={80}
                  className="invert"
                />
                <h2 className="text-base font-bold text-center">
                  {origenParaMostrar.nombre}
                </h2>
              </button>
            </div>
          )}
          {infoPedido.origen === "MESA" && (
            <div className="mt-6">
              <BotonRestaurante
                label="Transferir a otra Mesa"
                onClick={() => setShowTransferModal(true)}
              />
            </div>
          )}
          <div className="mt-8 p-4 bg-white rounded-xl shadow-lg w-full max-w-xs overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Resumen del Pedido
            </h2>
            {pedidoItems.length > 0 ? (
              <div className="space-y-4">
                {pedidoItems.map((item) => (
                  <div
                    key={item.uniqueId}
                    className="border-b border-gray-200 pb-4 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-gray-900 leading-tight">
                          {item.nombre}
                        </h3>
                        <p className="text-sm text-gray-600">
                          ${(item.precio * item.cantidad).toFixed(2)}
                        </p>
                        {item.nota && (
                          <p className="text-xs text-gray-500 italic mt-1">
                            Nota: {item.nota}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="p-1 rounded-full text-gray-500 hover:text-orange-500 transition-colors"
                          onClick={() => handleCantidad(item, -1)}
                          disabled={estadoPedido === "ENTREGADO"}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="text-sm font-semibold text-gray-700">
                          {item.cantidad}
                        </span>
                        <button
                          className="p-1 rounded-full text-gray-500 hover:text-orange-500 transition-colors"
                          onClick={() => handleCantidad(item, 1)}
                        >
                          <Plus size={16} />
                        </button>
                        <button
                          className="ml-2 p-1 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors"
                          onClick={() => handleRemoveItem(item.uniqueId)}
                          disabled={estadoPedido === "ENTREGADO"} // 👈 Desactiva el botón
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 p-4">
                El pedido está vacío. Agrega productos de la lista.
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col w-full overflow-hidden p-4 lg:w-3/4">
          {infoPedido.origen && (
            <div className="space-y-4 mb-8">
              {infoPedido.origen === "DOMICILIO" && (
                <>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Detalles de la entrega
                  </h2>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-300">
                    <Phone size={20} className="text-gray-500 flex-shrink-0" />
                    <input
                      type="tel"
                      name="telefono"
                      value={infoPedido.telefono}
                      onChange={handleChange}
                      placeholder="Teléfono"
                      className="w-full focus:outline-none bg-white text-gray-700"
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-300">
                    <User size={20} className="text-gray-500 flex-shrink-0" />
                    <input
                      type="text"
                      name="nombre"
                      value={infoPedido.nombre}
                      onChange={handleChange}
                      placeholder="Nombre"
                      className="w-full focus:outline-none bg-white text-gray-700"
                    />
                  </div>
                  <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-300">
                    <MapPin size={20} className="text-gray-500 flex-shrink-0" />
                    <input
                      type="text"
                      name="direccion"
                      value={infoPedido.direccion}
                      onChange={handleChange}
                      placeholder="Dirección"
                      className="w-full focus:outline-none bg-white text-gray-700"
                    />
                  </div>
                </>
              )}
              {infoPedido.origen === "MESA" && (
                <>
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    Mesa del pedido
                  </h2>
                  {mesasADesplegar.length === 0 ? (
                    <div className="flex items-center gap-3 mb-4 p-4 border border-gray-300 rounded-lg bg-red-50 text-red-700">
                      <h1 className="text-lg m-0">
                        No se pudo cargar la mesa del pedido
                      </h1>
                      {infoPedido.mesa && (
                        <p className="text-sm">ID de mesa: {infoPedido.mesa}</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                      {infoPedido.origen !== "MESA" &&
                        mesasADesplegar.map((mesa) => (
                          <button
                            key={mesa.id}
                            className={`
                            flex flex-col items-center p-4 rounded-lg shadow-sm transition-colors duration-200
                            bg-orange-500 text-white
                          `}
                            disabled={true}
                          >
                            <img
                              src="/mesa.svg"
                              alt="Mesa"
                              width={60}
                              height={60}
                              className="invert"
                            />
                            <span className="mt-1 font-semibold">
                              {mesa.nombre}
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-300">
                <NotebookPen
                  size={20}
                  className="text-gray-500 flex-shrink-0"
                />
                <input
                  type="text"
                  name="notas"
                  value={infoPedido.notas}
                  onChange={handleChange}
                  placeholder="Notas extra del pedido"
                  className="w-full focus:outline-none bg-white text-gray-700"
                />
              </div>
              <div className="relative w-full mb-4">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Buscar productos por nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                />
              </div>
              <nav className="flex items-center justify-start gap-2 my-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {categorias.map((cat: { id: string; nombre: string }) => (
                  <button
                    key={cat.id}
                    className={`py-2 px-4 rounded-full text-sm font-semibold cursor-pointer transition-colors duration-200 ease-in-out flex-shrink-0 ${
                      activeCat === cat.nombre
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-white text-gray-700 border border-gray-300"
                    }`}
                    onClick={() => setActiveCat(cat.nombre)}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </nav>
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {filteredItems.map((item) => {
                  const isConfigurable = item.tipo === "configurable";
                  const itemPrecio = isConfigurable
                    ? item.precio_base
                    : item.precio;
                  const cantidadEnCarrito = findCantidad(item.id);
                  return (
                    <div
                      key={item.id}
                      className="
                        border border-gray-200 rounded-xl p-4 bg-white shadow-md flex flex-col items-center text-center cursor-pointer transition-transform transform hover:scale-105 hover:shadow-lg
                      "
                    >
                      <h2 className="text-lg font-bold text-gray-800 mb-1">
                        {item.nombre}
                      </h2>
                      <div className="text-sm text-gray-600 mb-3">
                        Precio: ${Number(itemPrecio).toFixed(2)}
                      </div>
                      {isConfigurable ? (
                        <BotonRestaurante
                          label="Configurar"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenConfigurableModal(item.id);
                          }}
                        />
                      ) : (
                        <div className="flex items-center gap-2 my-2">
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCantidad(convertirAItemPedido(item), -1);
                            }}
                          >
                            <Minus size={16} />
                          </button>
                          <div className="w-10 text-center font-semibold text-lg text-gray-700">
                            {cantidadEnCarrito}
                          </div>
                          <button
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToPedido(convertirAItemPedido(item));
                            }}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )}
                      {pedidoItems
                        .filter((p) => p.id === item.id)
                        .map((pedidoItem) => (
                          <textarea
                            key={pedidoItem.uniqueId}
                            className="w-full border border-gray-300 text-gray-500 rounded-lg placeholder:text-gray-500 p-2 text-sm resize-y mt-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            placeholder="Nota (sin azúcar, etc.)"
                            value={pedidoItem.nota}
                            onChange={(e) =>
                              handleNotaChange(
                                pedidoItem.uniqueId,
                                e.target.value
                              )
                            }
                          />
                        ))}
                    </div>
                  );
                })}
              </section>
            </div>
          )}
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white shadow-lg flex justify-between items-center z-10 ml-16">
        <BotonRestaurante label="Cancelar" onClick={() => router.back()} />

        <div className="text-xl font-semibold text-gray-900">
          TOTAL: ${total.toFixed(2)}
        </div>
        <BotonRestaurante
          label={`Guardar Cambios (${readyCount} ítems)`}
          onClick={handleGuardarCambios}
        />
      </footer>

      <TransferirMesaModal
        show={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        mesasLibres={mesasLibres}
        onTransfer={handleTransfer}
      />
      {showConfigurableModal && (
        <ModalConfigurable
          producto={productoConfigurable}
          onClose={() => setShowConfigurableModal(false)}
          onAdd={(itemFromModal: PedidoItemBase) => {
            handleAddToPedido({
              ...itemFromModal,
              uniqueId: crypto.randomUUID(),
            });
          }}
          loading={loading}
        />
      )}
    </>
  );
}
