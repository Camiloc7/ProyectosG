import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto'; 
import { UsuariosService } from '../usuarios/usuarios.service';
import { LoginDto } from './dto/login.dto';
import { UsuarioEntity } from '../usuarios/entities/usuario.entity';
import { JwtPayload } from './strategies/jwt.strategy';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SyncService } from '../../sync/sync.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usuariosService: UsuariosService,
    private jwtService: JwtService,
    private httpService: HttpService,
    private configService: ConfigService,
    private syncService: SyncService,
  ) {}

  async validateUser(username: string, pass: string): Promise<UsuarioEntity> {
    const dbEngine = this.configService.get<string>('DB_ENGINE');
    const isElectronApp = dbEngine === 'sqlite';
    const cloudApiUrl = this.configService.get<string>('CLOUD_API_URL');

    let user: UsuarioEntity | null = null;
    let localAuthSuccess = false;

    try {
      user = await this.usuariosService.findOneByUsername(username);

      if (user) {
        if (user.password_hash === null || user.password_hash === undefined) {
        } else {
          const isPasswordValid = await bcrypt.compare(pass, user.password_hash);
          if (isPasswordValid && user.activo) {
            localAuthSuccess = true;
          } else {
            this.logger.debug(`Autenticación local fallida`);
          }
        }
      } else {
        this.logger.debug(`Autenticación local fallida`);
      }
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes("Cannot read properties of undefined (reading 'length')")) {
      } else {
        throw error;
      }
    }

    if (localAuthSuccess && user) {
      const { password_hash, ...result } = user;
      return result as UsuarioEntity;
    }

    if (isElectronApp && cloudApiUrl) {
      try {
        const awsLoginResponse = await firstValueFrom(
          this.httpService.post(`${cloudApiUrl}/auth/login`, { username, password: pass })
        );

        const awsData = awsLoginResponse.data.data;
        const awsUser = awsData.user;
        const awsAccessToken = awsData.access_token;

        if (awsUser && awsAccessToken) {
          const importedUser = await this.usuariosService.importUserFromCloud(awsUser);
          this.syncService.setAuthToken(awsAccessToken);
          const { password_hash, ...result } = importedUser;
          return result as UsuarioEntity;
        }
      } catch (error: any) {
        throw new UnauthorizedException('Credenciales inválidas en la nube.');
      }
    }
    throw new UnauthorizedException('Credenciales inválidas.');
  }

  private encryptNIT(nit: string, secretKey: string): string {
    const encodedNit = Buffer.from(nit).toString('base64');
    const iv = crypto.randomBytes(16); 
    const key = Buffer.from(secretKey, 'base64'); 
    if (key.length !== 32) {
      throw new Error("La clave secreta debe ser de 32 bytes para AES-256.");
    }
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(encodedNit, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted;
  }
  async login(loginDto: LoginDto): Promise<{ access_token: string, user: UsuarioEntity }> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    const nitDelEstablecimiento = user.establecimiento?.nit;
    const nitSecretKey = this.configService.get<string>('NIT_SECRET_KEY');  
    let encryptedNit: string | null = null;
    if (nitDelEstablecimiento && nitSecretKey) {
      encryptedNit = this.encryptNIT(nitDelEstablecimiento, nitSecretKey);
    }
    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      rol: user.rol.nombre,
      establecimiento_id: user.establecimiento_id,
      nombre_establecimiento: user.establecimiento.nombre,
      nit: encryptedNit, 
    };
    const accessToken = this.jwtService.sign(payload);
    const dbEngine = this.configService.get<string>('DB_ENGINE');
    if (dbEngine === 'sqlite') {
      await this.syncService.bulkSyncAllRelevantData();
    }
    return {
      access_token: accessToken,
      user: user
    };
  }

  async findByPayload(payload: JwtPayload): Promise<UsuarioEntity> {
    const user = await this.usuariosService.findOneByUsername(payload.username);

    if (!user || !user.activo) {
      throw new UnauthorizedException("Usuario inactivo o no válido.");
    }
    return user;
  }
}
