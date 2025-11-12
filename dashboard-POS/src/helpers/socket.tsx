import { io, Socket } from "socket.io-client";
import { RUTA } from "./rutas";
import { useAuthStore } from "@/stores/authStore";
import { useCajaStore } from "@/stores/cierreDeCajaStore";

let socket: Socket | undefined; 
let pluginSocket: Socket | undefined; 
const PLUGIN_URL = "http://127.0.0.1:8000";
const sendPrintJobToPlugin = (payload: any) => {
  if (pluginSocket && pluginSocket.connected) {
    pluginSocket.emit('printJob', payload);    
  } else {
    console.error("[WS - PLUGIN]  No se pudo reenviar la tarea: El Socket del Plugin Local no está conectado.");
  }
};
const connectPluginSocket = (id: string) => {
    if (pluginSocket && pluginSocket.connected) return;

    if (!pluginSocket) {
        pluginSocket = io(PLUGIN_URL, {
            transports: ["websocket"],
            reconnection: true,
        });
        pluginSocket.on("connect", () => {
            console.warn("[WS - PLUGIN] Conectado al Plugin Local.");
            pluginSocket!.emit("joinEstablecimiento", id); 
        });
        pluginSocket.on("connect_error", (err) => {
            console.error("[WS - PLUGIN] Error de conexión al Plugin Local. Asegúrese de que el Plugin esté en ejecución.", err.message);
        });
        pluginSocket.on("disconnect", (reason) => {
            console.warn("[WS - PLUGIN] Desconectado del Plugin Local:", reason);
        });
    }
}
export const conectarSocket = async (
  establecimientoId: string
): Promise<Socket> => {
  const token = useAuthStore.getState().token;
  if (!socket || !socket.connected) {
    socket = io(RUTA, {
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
    });
    socket.on("connect", () => {
      console.warn("[WS - CLOUD] Conectado al servidor Cloud (NestJS)");
      socket!.emit("joinEstablecimiento", establecimientoId);
      connectPluginSocket(establecimientoId); 
    });
    socket.on('printJob', (payload: any) => {
        sendPrintJobToPlugin(payload);
    });
    socket.on('mesaUpdated', (data: any) => {
    });
    socket.on('cajaStatusUpdated', (data: {usuarioCajeroId: string, cajaAbierta: boolean}) => {
        console.log('[WS - CLOUD] Evento cajaStatusUpdated recibido:', data);
        useCajaStore.getState().handleCajaStatusUpdate(data.cajaAbierta); 
    });
    socket.on("connect_error", (err) => {
      console.error("[WS - CLOUD] Error de conexión:", err);
    });
    socket.on("error", (err) => {
      console.error("[WS - CLOUD] Error general:", err);
    });
    socket.on("disconnect", (reason) => {
      console.warn("[WS - CLOUD] Desconectado:", reason);
    });
  }
  return socket;
};
export const getSocket = () => socket;