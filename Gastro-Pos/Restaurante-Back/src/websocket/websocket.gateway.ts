import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, UnauthorizedException } from "@nestjs/common";
import { AuthService } from "../modules/auth/auth.service";
import { WebSocketEventsService } from "./services/websocket-events.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UsuarioEntity } from "../modules/usuarios/entities/usuario.entity";
@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);
  constructor(
    private authService: AuthService,
    private websocketEventsService: WebSocketEventsService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  afterInit(server: Server) {
    this.logger.log("WebSocket Gateway inicializado.");
    this.websocketEventsService.server = server; 
  }
  async handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
    try {
      const token = client.handshake.auth.token as string;
      const deviceId = client.handshake.auth.deviceId as string; 
      if (!token) {
        throw new UnauthorizedException(
          "Token de autenticación no proporcionado."
        );
      }
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get("JWT_SECRET"),
      });
      const user = await this.authService.findByPayload(payload);
      if (!user || !user.activo) {
        throw new UnauthorizedException("Usuario inactivo o no válido.");
      }
      client["user"] = user;
      this.logger.log(`Cliente ${client.id} autenticado como ${user.username}`);
      if (user.establecimiento_id) {
        client.join(`establecimiento-${user.establecimiento_id}`); 
        this.logger.log(
          `Cliente ${client.id} unido a la sala del establecimiento: establecimiento-${user.establecimiento_id}`
        );
      } else {
        this.logger.warn(
          `Cliente ${client.id} conectado sin establecimiento_id. No se unirá a ninguna sala.`
        );
      }
      if (deviceId) { 
        client.join(`device-${deviceId}`);
        this.logger.log(`Cliente ${client.id} unido a la sala del dispositivo: device-${deviceId}`);
      } else {
        this.logger.warn(`Cliente ${client.id} conectado sin deviceId. No se unirá a la sala de dispositivo.`);
      }
      client.emit("connected", {
        message: "Conectado exitosamente al servidor WebSocket.",
      });
    } catch (error: any) { 
      this.logger.error(
        `Autenticación fallida para el cliente ${client.id}: ${error.message}`
      );
      client.emit("auth_error", {
        message: "Autenticación fallida.",
        error: error.message,
      });
      client.disconnect(true);
    }
  }
  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }
  @SubscribeMessage("ping")
  handlePing(client: Socket, data: string): void {
    client.emit(
      "pong",
      `Hola desde el servidor NestJS WebSocket! Recibí: ${data}`
    );
  }
}