import { Module } from "@nestjs/common";
import { WebsocketGateway } from "./websocket.gateway";
import { WebSocketEventsService } from "./services/websocket-events.service";
import { AuthModule } from "../modules/auth/auth.module";
import { UsuariosModule } from "../modules/usuarios/usuarios.module";

@Module({
  imports: [AuthModule, UsuariosModule],
  providers: [WebsocketGateway, WebSocketEventsService],
  exports: [WebSocketEventsService],
})
export class WebsocketModule {}
