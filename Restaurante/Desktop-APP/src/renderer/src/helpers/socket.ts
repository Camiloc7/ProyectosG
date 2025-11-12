import { io, Socket } from 'socket.io-client'
import { RUTA } from './rutas'
import { getTokenFromStore } from './getTokenFromStore'
let socket: Socket | undefined
export const conectarSocket = async (establecimientoId: string): Promise<Socket> => {
  const token = await getTokenFromStore()
  const deviceId = await window.electron.storeGet('deviceId')
  console.log('[Socket Helper] Intentando conectar con deviceId:', deviceId); 

  if (!socket || !socket.connected) {
    socket = io(RUTA, {
      transports: ['websocket'],
      auth: { token, deviceId }, 
      reconnection: true
    })
    socket.on('connect', () => {
      console.warn('[WS] Conectado al servidor WebSocket')
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