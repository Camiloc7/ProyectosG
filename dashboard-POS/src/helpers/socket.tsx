import { io, Socket } from 'socket.io-client'
import { RUTA } from './rutas'
import { useAuthStore } from '@/stores/authStore';

let socket: Socket | undefined

export const conectarSocket = async (establecimientoId: string): Promise<Socket> => {
    const token = useAuthStore.getState().token; 

  if (!socket || !socket.connected) {
    socket = io(RUTA, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true
    })
 
    socket.on('connect', () => {
      console.log('[WS] Conectado al servidor WebSocket')
      socket!.emit('joinEstablecimiento', establecimientoId)
    })

    socket.on('connect_error', (err) => {
      console.error('[WS] Error de conexión:', err)
    })

    socket.on('error', (err) => {
      console.error('[WS] Error general:', err)
    })

    socket.on('disconnect', (reason) => {
      console.warn('[WS] Desconectado:', reason)
    })
  }

  return socket
}

export const getSocket = () => socket
