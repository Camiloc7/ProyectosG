"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Minus,
  Plus,
  Search,
  MapPin,
  User,
  Phone,
  NotebookPen,
} from "lucide-react";
import {
  useProductosStore,
  IProductoConfigurableCompleto,
  Producto,
} from "@/stores/productosStore";
import { toast } from "react-hot-toast";
import { usePedidosStore } from "@/stores/pedidosStore";
import { useMesasStore } from "@/stores/mesasStore";
import BotonRestaurante from "@/components/ui/Boton";
import Spinner from "@/components/feedback/Spinner";
import { FONDO, ORANGE } from "@/styles/colors";
import Modal from "@/components/modals/Modal";
import ModalConfigurable from "@/components/modals/ModalConfigurable";

export interface CrearPedidoItem {
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
  notas: string;
  telefono: string;
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

const convertirAItemPedido = (producto: Producto): CrearPedidoItem => {
  return {
    id: producto.id,
    nombre: producto.nombre,
    precio: Number(producto.precio),
    cantidad: 1,
    tipo: "simple",
    nota: "",
  };
};

export default function CreacionDePedidos() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mesa = searchParams.get("mesa");
  const pedidoId = searchParams.get("pedidoId");
  const {
    traerCategorias,
    categorias,
    traerProductos,
    productos,
    loading,
    traerProductoConfigurable,
  } = useProductosStore();
  const {
    crearPedido,
    actualizarPedido,
    loading: loadingPedidos,
  } = usePedidosStore();
  const { traerMesasLibres, mesasLibres } = useMesasStore();
  const [pedidoItems, setPedidoItems] = useState<CrearPedidoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [readyCount, setReadyCount] = useState(0);
  const [activeCat, setActiveCat] = useState("");
  const [infoPedido, setInfoPedido] = useState<IFormPedidos>({
    origen: "",
    telefono: "",
    nombre: "",
    notas: "",
    direccion: "",
    idOrdenExterna: "",
    mesa: mesa || "",
  });
  const isEditing = !!searchParams.get("edit");
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
  const [searchMesaTerm, setSearchMesaTerm] = useState("");

  const handleSearchMesaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchMesaTerm(e.target.value);
  };

  useEffect(() => {
    traerCategorias();
    traerProductos();
    traerMesasLibres();
  }, [traerCategorias, traerProductos, traerMesasLibres]);
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
      if (isEditing && pedidoId) {
        setLoadingInitialData(true);
        const pedido = await usePedidosStore
          .getState()
          .traerPedidoPorId?.(pedidoId);

        if (pedido) {
          setInfoPedido({
            origen: pedido.tipo_pedido,
            telefono: pedido.cliente_telefono || "",
            notas: pedido.notas || "", //revisa si esta bien
            nombre: pedido.cliente_nombre || "",
            direccion: pedido.cliente_direccion || "",
            idOrdenExterna: pedido.idOrdenExterna || "",
            mesa: pedido.mesa_id || "",
          });
          const items = pedido.pedidoItems.map((item: any) => {
            const tipo: "simple" | "configurable" =
              item.producto_configurable_id ? "configurable" : "simple";
            const nombre = item.producto?.nombre || "Producto Desconocido";

            return {
              id: item.producto_id,
              nombre: nombre,
              precio: Number(item.precio_unitario_al_momento_venta),
              cantidad: item.cantidad,
              nota: item.notas_item || "",
              tipo: tipo,
              opcionesSeleccionadas: item.configuracion_json
                ? JSON.parse(item.configuracion_json)
                : [],
            };
          });

          setPedidoItems(items);
        } else {
          toast.error(
            "No se pudo cargar el pedido. Por favor, intente de nuevo."
          );
        }
        setLoadingInitialData(false);
      } else {
        setLoadingInitialData(false);
      }
    };

    fetchPedidoData();
  }, [isEditing, pedidoId]);
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setInfoPedido((prev) => ({ ...prev, [name]: value }));
  };

  const handleCantidad = (item: CrearPedidoItem, delta: number) => {
    setPedidoItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        const updated = prev
          .map((p) =>
            p.id === item.id
              ? { ...p, cantidad: Math.max(0, p.cantidad + delta) }
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
  const handleNotaChange = (id: string, nota: string) => {
    setPedidoItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, nota } : p))
    );
  };
  const handleOpenConfigurableModal = async (id: string) => {
    setProductoConfigurable(null);
    setShowConfigurableModal(true);
    const data = await traerProductoConfigurable(id);
    setProductoConfigurable(data || null);
  };

  const handleAddToPedido = (newPedidoItem: CrearPedidoItem) => {
    setPedidoItems((prev) => {
      const existing = prev.find((p) => p.id === newPedidoItem.id);
      if (existing && newPedidoItem.tipo === "simple") {
        return prev.map((p) =>
          p.id === newPedidoItem.id ? { ...p, cantidad: p.cantidad + 1 } : p
        );
      }
      return [...prev, { ...newPedidoItem, cantidad: 1 }];
    });
  };

  const handleGenerarPedido = () => {
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

    if (infoPedido.origen === "MESA") {
      if (!infoPedido.mesa) {
        newErrors.mesa = true;
        toast.error("Número de mesa es requerido");
        valid = false;
      }
    }
    setErrors(newErrors);
    if (!valid) return;
    if (pedidoItems.length === 0) {
      toast.error("Agrega al menos un producto al pedido");
      return;
    }
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
      ...(isEditing && pedidoId ? { id: pedidoId } : {}),
    };

    if (isEditing) {
      actualizarPedido(pedido);
      router.push("/cajero");
    } else {
      crearPedido(pedido);
      router.push("/cajero");
    }
  };
  const handleCancel = () => {
    router.back();
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

  const filteredMesas = useMemo(() => {
    if (!searchMesaTerm) {
      return mesasLibres;
    }
    return mesasLibres.filter((mesa) =>
      mesa.nombre.toLowerCase().includes(searchMesaTerm.toLowerCase())
    );
  }, [mesasLibres, searchMesaTerm]);
  const findCantidad = (id: string) =>
    pedidoItems.find((p) => p.id === id)?.cantidad || 0;
  const findNota = (id: string) =>
    pedidoItems.find((p) => p.id === id)?.nota || "";
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
            {isEditing ? "Actualizando" : "Creando"} Pedido
          </h1>
          <div className="flex flex-col gap-4 w-full max-w-xs mt-6">
            {tiposDeOrigen.map((origen) => {
              const isActive = infoPedido.origen === origen.id;
              const imgClassName = isActive ? "invert" : "";
              return (
                <button
                  key={origen.id}
                  className={`
                    flex flex-col items-center justify-center gap-2 p-6 rounded-xl shadow-md transition-all duration-300
                    ${
                      isActive
                        ? "bg-orange-500 text-white transform scale-105"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }
                  `}
                  onClick={() =>
                    setInfoPedido((prev) => ({ ...prev, origen: origen.id }))
                  }
                >
                  <img
                    src={origen.icon}
                    alt={origen.nombre}
                    width={80}
                    height={80}
                    className={imgClassName}
                  />
                  <h2 className="text-base font-bold text-center">
                    {origen.nombre}
                  </h2>
                </button>
              );
            })}
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
                    Seleccione una mesa
                  </h2>
                  <div className="relative w-full mb-4">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Buscar mesa por nombre..."
                      value={searchMesaTerm}
                      onChange={handleSearchMesaChange}
                      className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    />
                  </div>
                  {mesasLibres.length === 0 ? (
                    <div className="flex items-center gap-3 mb-4 p-4 border border-gray-300 rounded-lg bg-red-50 text-red-700">
                      <h1 className="text-lg m-0">No hay mesas disponibles</h1>
                      <BotonRestaurante
                        label="Recargar"
                        variacion="claro"
                        onClick={() => {
                          toast.success("Recargando...");
                          traerMesasLibres();
                        }}
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                      {filteredMesas.map((mesa) => {
                        const isActive = infoPedido.mesa === mesa.id;
                        const imgClassName = isActive ? "invert" : "";
                        return (
                          <button
                            key={mesa.id}
                            className={`
                    flex flex-col items-center p-4 rounded-lg shadow-sm transition-colors duration-200
                    ${
                      isActive
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-700 hover:bg-gray-100"
                    }
                `}
                            onClick={() =>
                              setInfoPedido((prev) => ({
                                ...prev,
                                mesa: mesa.id,
                              }))
                            }
                          >
                            <img
                              src="/mesa.svg"
                              alt="Mesa"
                              width={60}
                              height={60}
                              className={imgClassName}
                            />
                            <span className="mt-1 font-semibold">
                              {mesa.nombre}
                            </span>
                          </button>
                        );
                      })}
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
                          <div className="w-10 text-center font-semibold text-lg">
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
                      {(cantidadEnCarrito > 0 || isConfigurable) && (
                        <textarea
                          className="w-full border border-gray-800 rounded-lg p-2 text-sm text-black resize-y mt-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Nota (sin azúcar, etc.)"
                          value={findNota(item.id)}
                          onChange={(e) =>
                            handleNotaChange(item.id, e.target.value)
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </section>
            </div>
          )}
        </div>
      </div>
      <footer className="fixed bottom-0 left-0 right-0 p-6 bg-white shadow-lg flex justify-between items-center z-10">
        <div className="text-xl font-semibold text-gray-900">
          TOTAL: ${total.toFixed(2)}
        </div>
        <BotonRestaurante
          label={
            isEditing
              ? "Guardar Cambios"
              : `Generar Pedido (${readyCount} ítems)`
          }
          onClick={handleGenerarPedido}
        />
      </footer>
      {(loading || loadingPedidos) && <Spinner />}
      {showConfigurableModal && (
        <ModalConfigurable
          producto={productoConfigurable}
          onClose={() => setShowConfigurableModal(false)}
          onAdd={handleAddToPedido}
          loading={loading}
        />
      )}
    </>
  );
}
