import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsuariosService } from '../../usuarios/usuarios.service';
import { UsuarioEntity } from '../../usuarios/entities/usuario.entity';
export interface JwtPayload {
  id: string;
  username: string;
  rol: string;
  establecimiento_id: string;
  nombre_establecimiento: string;
  nit: string | null;
} 
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usuariosService: UsuariosService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET no está definido en la configuración.');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }
  /**
   * Valida el token JWT extrayendo el payload y buscando el usuario en la base de datos.
   * @param payload El payload decodificado del token JWT.
   * @returns El objeto de usuario para adjuntarlo al objeto `request` (`req.user`).
   * @throws UnauthorizedException Si el usuario no existe o está inactivo.
   */
  async validate(payload: JwtPayload): Promise<UsuarioEntity> {
    const usuario = await this.usuariosService.findOne(payload.id, payload.establecimiento_id);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('El usuario del token no existe o está inactivo.');
    }
    return usuario;
  }
}