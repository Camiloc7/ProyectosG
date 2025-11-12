// pages/mesero/page.tsx

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Minus, Plus, CheckCircle, Clock, UtensilsCrossed } from 'lucide-react';
import { useMesasStore, IMesasLibres } from '@/stores/mesasStore';
import { usePedidosStore } from '@/stores/pedidosStore';
import { useProductosStore, IProductoConfigurableCompleto, Producto } from '@/stores/productosStore';
import { IPedidos, EstadoPedido } from '@/types/models';
import BotonRestaurante from '@/components/ui/Boton';
import Spinner from '@/components/feedback/Spinner';
import { FONDO } from '@/styles/colors';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { conectarSocket } from '@/helpers/socket';
import TransferirMesaModal from '@/components/modals/TransferirMesaModal';

export interface CrearPedidoItem {
    id: string
    nombre: string
    precio: number
    cantidad: number
    nota?: string
    categoria?: string
    tipo?: 'simple' | 'configurable'
    opcionesSeleccionadas?: { nombreOpcion: string; valor: string; precio: number }[]
}

export interface IFormPedidos {
    id?: string
    origen: string
    telefono: string
    nombre: string
    direccion: string
    idOrdenExterna: string
    mesa: string
    notas?: string
}

const convertirAItemPedido = (producto: Producto): CrearPedidoItem => {
    return {
        id: producto.id,
        nombre: producto.nombre,
        precio: Number(producto.precio),
        cantidad: 1,
        tipo: 'simple',
        nota: '',
    }
}

export default function MeseroDashboard() {
    const router = useRouter();
    const { user, token } = useAuthStore();
    const [currentView, setCurrentView] = useState('dashboard');
    const { fetchMesas, mesas, loading: loadingMesas } = useMesasStore();
    const { traerPedidos, pedidos, loading: loadingPedidos, traerPedidoPorId, crearPedido, actualizarPedido, transferirMesa, imprimirComanda } = usePedidosStore();
    const [searchMesaTerm, setSearchMesaTerm] = useState('');
    const { traerCategorias, categorias, traerProductos, productos, loading: loadingProductos } = useProductosStore();
    const [pedidoItems, setPedidoItems] = useState<CrearPedidoItem[]>([]);
    const [total, setTotal] = useState(0);
    const [infoPedido, setInfoPedido] = useState<IFormPedidos>({
        origen: 'MESA',
        telefono: '',
        nombre: '',
        direccion: '',
        idOrdenExterna: '',
        mesa: '',
    });
    const [errors, setErrors] = useState({ origen: false, telefono: false, direccion: false, nombre: false, idOrdenExterna: false, mesa: false });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCat, setActiveCat] = useState('');
    const [loadingInitialData, setLoadingInitialData] = useState(false);
    const [currentPedidoId, setCurrentPedidoId] = useState<string | null>(null);
    const [showTransferModal, setShowTransferModal] = useState(false);

    useEffect(() => {
        const calculateTotal = () => {
            const newTotal = pedidoItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
            setTotal(newTotal);
        };
        calculateTotal();
    }, [pedidoItems]);

    useEffect(() => {
        if (!token || !user?.establecimiento_id) {
            router.push('/login');
            return;
        }
        fetchMesas();
        traerPedidos();
        const socketPromise = conectarSocket(user.establecimiento_id);
        socketPromise.then((s) => {
            s.on('pedidoStatusUpdated', () => {
                traerPedidos();
            });
            s.on('pedidoCreated', () => {
                traerPedidos();
            });
            s.on('mesaStatusUpdated', () => {
                fetchMesas();
            });
            return () => {
                s.off('pedidoStatusUpdated');
                s.off('pedidoCreated');
                s.off('mesaStatusUpdated');
            };
        }).catch((err) => {
            console.error('[WS Mesero] Fallo al conectar el socket:', err);
            toast.error('No se pudo establecer la conexión en tiempo real.');
        });
    }, [token, user, router, fetchMesas, traerPedidos]);

    useEffect(() => {
        if (currentView !== 'dashboard') {
            traerCategorias();
            traerProductos();
        }
    }, [currentView, traerCategorias, traerProductos]);

    useEffect(() => {
        const fetchPedidoData = async () => {
            if (currentView === 'editar' && currentPedidoId) {
                setLoadingInitialData(true);
                const pedidoCompleto = await traerPedidoPorId?.(currentPedidoId);
                if (pedidoCompleto) {
                    setInfoPedido({
                        origen: pedidoCompleto.tipo_pedido,
                        telefono: pedidoCompleto.cliente_telefono || '',
                        nombre: pedidoCompleto.cliente_nombre || '',
                        direccion: pedidoCompleto.cliente_direccion || '',
                        idOrdenExterna: (pedidoCompleto as any).idOrdenExterna || '',
                        mesa: pedidoCompleto.mesa_id || '',
                    });
                    const items = pedidoCompleto.pedidoItems.map((item: any) => {
                        const nombreProducto = item.producto?.nombre || 'Producto Desconocido';
                        const precioProducto = Number(item.producto?.precio) || 0;
                        const tipo: 'simple' | 'configurable' = item.producto_configurable_id ? 'configurable' : 'simple';
                        
                        return {
                            id: item.producto_id,
                            nombre: nombreProducto,
                            precio: precioProducto,
                            cantidad: item.cantidad,
                            nota: item.notas_item || '',
                            tipo: tipo,
                            opcionesSeleccionadas: item.configuracion_json ? JSON.parse(item.configuracion_json) : [],
                        };
                    });
                    setPedidoItems(items);
                } else {
                    toast.error('No se pudo cargar el pedido. Por favor, intente de nuevo.');
                }
                setLoadingInitialData(false);
            }
        };
        fetchPedidoData();
    }, [currentView, currentPedidoId, traerPedidoPorId]);

    const mesasConEstado = useMemo(() => {
        const pedidosPorMesa = new Map(pedidos.map(p => [p.mesa_id, p]));
        return mesas.map(mesa => ({
            ...mesa,
            estado: pedidosPorMesa.has(mesa.id) ? 'ocupada' : 'libre',
            pedido: pedidosPorMesa.get(mesa.id) || null,
        }));
    }, [mesas, pedidos]);

    const mesasLibres = useMemo(() => {
        return mesas.filter(m => !pedidos.some(p => p.mesa_id === m.id));
    }, [mesas, pedidos]);

    const filteredItems = useMemo(() => {
        if (searchTerm) {
            return productos.filter(item => item.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        return productos.filter(it => 'categoria' in it && it.categoria === activeCat);
    }, [productos, activeCat, searchTerm]);

    const handleCantidad = (item: CrearPedidoItem, delta: number) => {
        setPedidoItems((prev) => {
            const existing = prev.find((p) => p.id === item.id);
            if (existing) {
                const updated = prev
                    .map((p) => (p.id === item.id ? { ...p, cantidad: Math.max(0, p.cantidad + delta) } : p))
                    .filter((p) => p.cantidad > 0);
                return updated;
            } else if (delta > 0) {
                return [...prev, { ...item, cantidad: 1, nota: '' }];
            }
            return prev;
        });
    };

    const handleNotaChange = (id: string, nota: string) => {
        setPedidoItems((prev) => prev.map((p) => (p.id === id ? { ...p, nota } : p)));
    };

    const findCantidad = (id: string) => pedidoItems.find((p) => p.id === id)?.cantidad || 0;
    const findNota = (id: string) => pedidoItems.find((p) => p.id === id)?.nota || '';



    const handleGenerarPedido = () => {
        const isEditing = currentView === 'editar';
        const newErrors = { origen: false, telefono: false, direccion: false, nombre: false, idOrdenExterna: false, mesa: false };
        let valid = true;
        if (infoPedido.origen === 'MESA' && !infoPedido.mesa) {
            newErrors.mesa = true;
            toast.error('Número de mesa es requerido');
            valid = false;
        }
        setErrors(newErrors);
        if (!valid || pedidoItems.length === 0) {
            if (pedidoItems.length === 0) toast.error('Agrega al menos un producto al pedido');
            return;
        }
        const payloadProductos = pedidoItems.map((item) => ({
            id: item.id,
            cantidad: item.cantidad,
            nota: item.nota,
            opciones: item.tipo === 'configurable' ? item.opcionesSeleccionadas : undefined,
        }));
        const pedido = {
            ...infoPedido,
            productos: payloadProductos,
            total,
            ...(isEditing && currentPedidoId ? { id: currentPedidoId } : {}),
        };
        if (isEditing) {
            actualizarPedido(pedido);
        } else {
            crearPedido(pedido);
        }
        handleCancel();
    };
    

    const handleTransfer = async (newMesaId: string) => {
        if (!currentPedidoId) {
            toast.error('No se pudo transferir el pedido. ID no encontrado.');
            return;
        }
        const success = await transferirMesa(currentPedidoId, newMesaId);
        if (success) {
            handleCancel();
        }
    };

    const startCrearPedido = (mesaId: string) => {
        if (pedidos.some(p => p.mesa_id === mesaId)) {
            toast.error('Esta mesa ya está ocupada. Por favor, edite el pedido existente o seleccione otra mesa.');
            return;
        }
        setInfoPedido({ ...infoPedido, mesa: mesaId, origen: 'MESA' });
        setCurrentView('crear');
    };

    const startEditarPedido = (pedidoId: string) => {
        setCurrentPedidoId(pedidoId);
        setCurrentView('editar');
    };

    const handleCancel = () => {
        setPedidoItems([]);
        setInfoPedido({ origen: 'MESA', telefono: '', nombre: '', direccion: '', idOrdenExterna: '', mesa: '' });
        setCurrentPedidoId(null);
        setCurrentView('dashboard');
    };

    if (loadingMesas || loadingPedidos || loadingProductos || loadingInitialData) {
        return <Spinner />;
    }

    if (currentView === 'dashboard') {
        return (
            <div className="min-h-screen p-6 font-lato" style={{ backgroundColor: FONDO }}>
                <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Panel del Mesero</h1>
                <section className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Mesas del Restaurante</h2>
                    <div className="relative w-full mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar mesa por nombre..."
                            value={searchMesaTerm}
                            onChange={(e) => setSearchMesaTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all duration-200"
                        />
                    </div>
                    {mesasConEstado.length === 0 ? (
                        <div className="text-center text-gray-500 p-4">
                            <p>No hay mesas registradas.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {mesasConEstado
                                .filter(mesa => mesa.numero.toLowerCase().includes(searchMesaTerm.toLowerCase()))
                                .map((mesa) => {
                                    const isOcupada = mesa.estado === 'ocupada';
                                    const pedidoDeMesa = mesa.pedido;
                                    const getStatusInfo = (status: EstadoPedido) => {
                                        switch (status) {
                                            case EstadoPedido.ABIERTO:
                                                return { text: 'Pedido Abierto', color: 'bg-orange-500', icon: <Clock size={20} /> };
                                            case EstadoPedido.EN_PREPARACION:
                                                return { text: 'En Preparación', color: 'bg-yellow-500', icon: <UtensilsCrossed size={20} /> };
                                            case EstadoPedido.LISTO_PARA_ENTREGAR:
                                                return { text: 'Listo para Entregar', color: 'bg-blue-500', icon: <CheckCircle size={20} /> };
                                            default:
                                                return { text: 'Ocupada', color: 'bg-gray-500', icon: null };
                                        }
                                    };
                                    const statusInfo = isOcupada ? getStatusInfo(pedidoDeMesa?.estado as EstadoPedido) : { text: 'Libre', color: 'bg-gray-500', icon: null };
                                    const colorClass = isOcupada ? statusInfo.color : 'bg-green-500';
                                    const hoverClass = isOcupada ? 'hover:scale-105' : 'hover:bg-green-600';

                                    return (
                                        <button
                                            key={mesa.id}
                                            className={`        relative flex flex-col items-center justify-center p-6 rounded-xl shadow-md transition-transform transform ${colorClass} ${hoverClass} text-white

                                            `}
                                            onClick={() => isOcupada ? startEditarPedido(pedidoDeMesa!.id) : startCrearPedido(mesa.id)}
                                        >
                                            <img src="/mesa.svg" alt="Mesa" width={60} height={60} className="invert" />
                                            <span className="mt-2 text-lg font-semibold">{mesa.numero}</span>
                                            <div className="flex items-center gap-1 mt-1 text-sm font-medium">
                                                {statusInfo.icon}
                                                <span>{statusInfo.text}</span>
                                            </div>
                                             {isOcupada && pedidoDeMesa && (
                                                <button
                                                    className="absolute top-2 right-2 p-2 rounded-full bg-white/30 text-white hover:bg-white/50 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); 
                                                        imprimirComanda(pedidoDeMesa.id); 
                                                    }}
                                                    title="Imprimir comanda"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </button>
                                    );
                                })}
                        </div>
                    )}
                </section>
            </div>
        );
    } else {
        return (
            <div className="min-h-screen p-6 font-lato flex flex-col gap-8" style={{ backgroundColor: FONDO }}>
                <button onClick={handleCancel} className="flex items-center gap-2 text-gray-700 hover:text-orange-500 transition-colors self-start">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
                    Volver
                </button>
                <div className="flex flex-col lg:flex-row w-full gap-8">
                    <div className="flex-grow flex flex-col w-full lg:w-3/4">
                        <h1 className="text-2xl font-semibold text-gray-900 m-0 text-center lg:text-left mb-6">
                            {currentView === 'editar' ? 'Actualizando' : 'Creando'} Pedido para Mesa {infoPedido.mesa}
                        </h1>
                        <div className="relative w-full mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar productos por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                            />
                        </div>
                        <nav className="flex items-center justify-start gap-2 my-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
                            {categorias.map((cat) => (
                                <button
                                    key={cat.id}
                                    className={`py-2 px-4 rounded-full text-sm font-semibold cursor-pointer transition-colors duration-200 ease-in-out flex-shrink-0 ${activeCat === cat.nombre ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-300'}`}
                                    onClick={() => setActiveCat(cat.nombre)}
                                >
                                    {cat.nombre}
                                </button>
                            ))}
                        </nav>
                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                            {filteredItems.map((item) => {
                                const isConfigurable = item.tipo === 'configurable';
                                const itemPrecio = isConfigurable ? item.precio_base : item.precio;
                                const cantidadEnCarrito = findCantidad(item.id);
                                return (
                                    <div
                                        key={item.id}
                                        className="
                                            border border-gray-200 rounded-xl p-4 bg-white shadow-md flex flex-col items-center text-center cursor-pointer transition-transform transform hover:scale-105 hover:shadow-lg
                                        "
                                        onClick={() => handleCantidad(convertirAItemPedido(item), 1)}
                                    >
                                        <h2 className="text-lg font-bold text-gray-800 mb-1">{item.nombre}</h2>
                                        <div className="text-sm text-gray-600 mb-3">
                                            Precio: ${Number(itemPrecio).toFixed(2)}
                                        </div>
                                        {isConfigurable ? (
                                            <BotonRestaurante
                                                label="Configurar"
                                                onClick={(e) => { e.stopPropagation(); }}
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2 my-2">
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-gray-700 border border-gray-300 shadow-sm hover:bg-gray-100 transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); handleCantidad(convertirAItemPedido(item), -1); }}
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <div className="w-10 text-center font-semibold text-lg">{cantidadEnCarrito}</div>
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); handleCantidad(convertirAItemPedido(item), 1); }}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        )}
                                        {(cantidadEnCarrito > 0 || isConfigurable) && (
                                            <textarea
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-y mt-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                placeholder="Nota (sin azúcar, etc.)"
                                                value={findNota(item.id)}
                                                onChange={(e) => handleNotaChange(item.id, e.target.value)}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </section>
                    </div>
                    <div className="flex-shrink-0 w-full lg:w-1/4 bg-white rounded-2xl shadow-xl p-6 h-fit">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen del Pedido</h2>
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-4">
                            {pedidoItems.length === 0 ? (
                                <div className="text-gray-500 text-center">Agregue productos para ver el resumen.</div>
                            ) : (
                                pedidoItems.map((item, index) => (
                                    <div key={index} className="flex justify-between items-center border-b border-gray-200 pb-2 last:border-0">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-800">{item.nombre}</h3>
                                            <p className="text-sm text-gray-600">Cantidad: {item.cantidad}</p>
                                        </div>
                                        <div className="font-semibold text-gray-900">${(item.precio * item.cantidad).toFixed(2)}</div>
                                    </div>
                                ))
                            )}
                        </div>
                        <textarea
    className="w-full border text-gray-500 rounded-lg p-3 text-sm resize-y mt-2 mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500"
    placeholder="Notas generales del pedido (ej: mesa 5 sin queso, etc.)"
    value={infoPedido.notas}
    onChange={(e) => setInfoPedido({ ...infoPedido, notas: e.target.value })}
/>
                        <BotonRestaurante
                            label={currentView === 'editar' ? 'Guardar Cambios' : `Generar Pedido`}
                            onClick={handleGenerarPedido}
                            className="mt-4 w-full"
                        />
                        {currentView === 'editar' && (
                            <BotonRestaurante
                                label="Transferir a otra Mesa"
                                onClick={() => setShowTransferModal(true)}
                                className="mt-2 w-full bg-orange-500 hover:bg-orange-600"
                            />
                        )}
                    </div>
                </div>
                {currentView === 'editar' && (
                    <TransferirMesaModal
                        show={showTransferModal}
                        onClose={() => setShowTransferModal(false)}
                        mesasLibres={mesasLibres}
                        onTransfer={handleTransfer}
                    />
                )}
            </div>
        );
    }
}