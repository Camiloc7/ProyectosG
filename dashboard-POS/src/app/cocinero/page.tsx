"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { usePedidosStore } from '@/stores/pedidosStore';
import { useAuthStore } from '@/stores/authStore';
import { conectarSocket } from '@/helpers/socket';
import { EstadoPedido, IPedidos } from '@/types/models';
import PedidoCocina from '@/features/pedidos/PedidoCocina';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/feedback/Spinner';
import { COLOR_TEXT_MUTED, PEDIDO_CANCELADO, PEDIDO_ENTREGADO_COLOR, PEDIDO_LISTO_COLOR, PEDIDO_PENDIENTE_COLOR, PEDIDO_PREPARANDO_COLOR } from '@/styles/colors';

const useCocineroDashboard = () => {
    const router = useRouter();
    const { user, token } = useAuthStore();
    const { pedidos, traerPedidos, loading, cambiarEstadoPedido } = usePedidosStore();
    const [refreshing, setRefreshing] = useState(false);
    const loadPedidos = useCallback(async () => {
        if (!token || !user?.establecimiento_id) {
            return;
        }
        setRefreshing(true);
        await traerPedidos();
        setRefreshing(false);
    }, [token, user?.establecimiento_id, traerPedidos]);

    useEffect(() => {
        if (!token) {
            router.push('/login');
            return;
        }
        if (user?.establecimiento_id) {
            const socketPromise = conectarSocket(user.establecimiento_id);
            socketPromise.then((s) => {
                s.on('connect', () => {
                    console.log('[WS] Conexión de socket establecida para el cocinero.');
                });
                s.on('pedidoCreated', () => {
                    console.log('[WS] Nuevo pedido recibido.');
                    toast.success('¡Nuevo pedido!');
                    traerPedidos();
                });
                s.on('pedidoStatusUpdated', () => {
                    console.log('[WS] Actualización de estado de pedido recibida.');
                    traerPedidos(); 
                });
                return () => {
                    s.off('pedidoCreated');
                    s.off('pedidoStatusUpdated');
                };
            }).catch((err) => {
                console.error('[WS] Fallo al conectar el socket:', err);
                toast.error('No se pudo establecer la conexión en tiempo real.');
            });
        }
        loadPedidos();
    }, [token, user, router, traerPedidos, loadPedidos]);

    const handleUpdateStatus = async (pedidoId: string, currentStatus: EstadoPedido) => {
        let newStatus: EstadoPedido;
        if (currentStatus === EstadoPedido.ABIERTO) {
            newStatus = EstadoPedido.EN_PREPARACION;
        } else if (currentStatus === EstadoPedido.EN_PREPARACION) {
            newStatus = EstadoPedido.LISTO_PARA_ENTREGAR;
        } else {
            toast.error('Este pedido ya está en un estado final.');
            return;
        }
        toast.promise(
            cambiarEstadoPedido(pedidoId, newStatus),
            {
                loading: 'Actualizando estado...',
                success: `Pedido actualizado a "${newStatus}"`,
                error: (err) => err.message || 'No se pudo actualizar el estado.',
            }
        );
    };
    return {
        pedidos,
        loading,
        refreshing,
        loadPedidos,
        handleUpdateStatus,
    };
};
const CocineroPage = () => {
    const { pedidos, loading, refreshing, loadPedidos, handleUpdateStatus } = useCocineroDashboard();
    const pedidosCocinero = pedidos.filter(
        (p) => p.estado === EstadoPedido.ABIERTO || p.estado === EstadoPedido.EN_PREPARACION
    );
    const getStatusColor = (status: EstadoPedido) => {
        switch (status) {
            case EstadoPedido.ABIERTO:
                return PEDIDO_PENDIENTE_COLOR;
            case EstadoPedido.EN_PREPARACION:
                return PEDIDO_PREPARANDO_COLOR;
            case EstadoPedido.LISTO_PARA_ENTREGAR:
                return PEDIDO_LISTO_COLOR;
            case EstadoPedido.ENTREGADO:
                return PEDIDO_ENTREGADO_COLOR;
            case EstadoPedido.CANCELADO:
                return PEDIDO_CANCELADO;
            default:
                return COLOR_TEXT_MUTED;
        }
    };
    const getButtonText = (status: EstadoPedido) => {
        switch (status) {
            case EstadoPedido.ABIERTO:
                return 'Empezar Preparación';
            case EstadoPedido.EN_PREPARACION:
                return 'Marcar como Listo';
            case EstadoPedido.LISTO_PARA_ENTREGAR:
                return 'Listo (Esperando Entrega)';
            case EstadoPedido.ENTREGADO:
                return 'Pedido Entregado';
            case EstadoPedido.CANCELADO:
                return 'Pedido Cancelado';
            default:
                return 'Estado Desconocido';
        }
    };
    return (
        <div className="bg-gray-100 min-h-screen p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800 text-center md:text-left mb-2 md:mb-0">Panel de Cocina</h1>
            </div>
            <p className="text-center text-gray-600 mb-8">Pedidos pendientes y en preparación</p>

            {loading && !refreshing && (
                <div className="flex justify-center items-center h-64">
                    <Spinner />
                </div>
            )}
            {!loading && pedidosCocinero.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-12 text-gray-500">
                    <svg className="h-24 w-24 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    <p className="text-xl font-semibold">¡No hay pedidos pendientes!</p>
                    <p className="text-sm mt-2">Es un buen momento para tomar un descanso.</p>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pedidosCocinero.map((pedido: IPedidos) => (
                    <div key={pedido.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <PedidoCocina
                            pedido={pedido}
                            handleAction={() => handleUpdateStatus(pedido.id, pedido.estado as EstadoPedido)}
                            buttonText={getButtonText(pedido.estado as EstadoPedido)}
                            buttonColor={getStatusColor(pedido.estado as EstadoPedido)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};
export default CocineroPage;