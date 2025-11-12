import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
  ConflictException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuarioEntity } from './entities/usuario.entity';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Request } from 'express';
import { RoleName } from '../../common/constants/app.constants';
import { RolesService } from '../roles/roles.service';
import { EstablecimientosService } from '../establecimientos/establecimientos.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    establecimiento_id: string;
    rol_id: string;
    username: string;
  };
}

@ApiTags('Usuarios')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(
    private readonly usuariosService: UsuariosService,
    private readonly rolesService: RolesService,
    private readonly establecimientosService: EstablecimientosService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente', type: UsuarioEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Acción no permitida para tu rol o establecimiento' })
  @ApiResponse({ status: 404, description: 'Establecimiento o Rol no encontrado' })
  @ApiResponse({ status: 409, description: 'El nombre de usuario ya existe' })
  @ApiBody({
    description: 'Datos necesarios para crear un nuevo usuario. SuperAdmin puede especificar cualquier establecimiento, Admin solo creará en el suyo.',
    type: CreateUsuarioDto,
    examples: {
      ejemploSuperAdminCreandoAdmin: {
        summary: 'SUPER_ADMIN crea un ADMIN para un establecimiento',
        value: {
          establecimientoName: 'Cafetería Central',
          rolName: 'ADMIN',
          nombre: 'NuevoAdmin',
          apellido: 'App',
          username: 'admin.new',
          password: 'Passw0rd!',
          activo: true
        }
      },
      ejemploAdminCreandoCajero: {
        summary: 'ADMIN crea un CAJERO en su propio establecimiento (establecimientoName ignorado)',
        value: {
          rolName: 'CAJERO',
          nombre: 'JuanCajero',
          apellido: 'Doe',
          username: 'jcajero',
          password: 'Password123!',
          activo: true
        }
      }
    }
  })
  async create(@Body() createUsuarioDto: CreateUsuarioDto, @Req() req: AuthenticatedRequest): Promise<UsuarioEntity> {
    const userRole = await this.rolesService.findOne(req.user.rol_id);
    const targetRole = await this.rolesService.findOneByName(createUsuarioDto.rolName);

    if (!targetRole) {
      throw new NotFoundException(`Rol '${createUsuarioDto.rolName}' no encontrado.`);
    }

    let finalEstablecimientoName: string;

    if (userRole.nombre === RoleName.SUPER_ADMIN) {
      if (!createUsuarioDto.establecimientoName) {
        throw new BadRequestException('Para crear un usuario, el SUPER_ADMIN debe especificar el nombre del establecimiento.');
      }
      finalEstablecimientoName = createUsuarioDto.establecimientoName;

    } else if (userRole.nombre === RoleName.ADMIN) {
      if (targetRole.nombre === RoleName.ADMIN || targetRole.nombre === RoleName.SUPER_ADMIN) {
        throw new BadRequestException(`Un usuario ${userRole.nombre} no puede crear un usuario con el rol ${targetRole.nombre}.`);
      }
      if (req.user.establecimiento_id === null) {
        throw new BadRequestException('El usuario ADMIN debe tener un establecimiento asignado en el token.');
      }
      const adminEstablecimiento = await this.establecimientosService.findOne(req.user.establecimiento_id);
      if (!adminEstablecimiento) {
        throw new NotFoundException('Establecimiento del usuario autenticado no encontrado.');
      }
      finalEstablecimientoName = adminEstablecimiento.nombre;
      if (createUsuarioDto.establecimientoName && createUsuarioDto.establecimientoName !== finalEstablecimientoName) {
        throw new BadRequestException('No puedes crear usuarios en un establecimiento diferente al tuyo.');
      }
    } else {
      throw new BadRequestException('Tu rol no tiene permiso para crear usuarios.');
    }
    const createDtoForService: CreateUsuarioDto = {
      ...createUsuarioDto,
      establecimientoName: finalEstablecimientoName,
    };

    return this.usuariosService.create(createDtoForService);
  }
  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Obtener todos los usuarios (filtrado por establecimiento del usuario si no es ADMIN/SUPER_ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios', type: [UsuarioEntity] })
  async findAll(@Req() req: AuthenticatedRequest): Promise<UsuarioEntity[]> {
    const userRole = await this.rolesService.findOne(req.user.rol_id);

    if (userRole.nombre === RoleName.SUPER_ADMIN) {
      return this.usuariosService.findAll();
    } else if (userRole.nombre === RoleName.ADMIN || userRole.nombre === RoleName.SUPERVISOR) {
      if (req.user.establecimiento_id === null) {
          throw new BadRequestException('Tu rol requiere un establecimiento asignado para ver usuarios.');
      }
      return this.usuariosService.findAll(req.user.establecimiento_id);
    }
    throw new BadRequestException('Tu rol no tiene permiso para ver todos los usuarios.');
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.MESERO, RoleName.CAJERO, RoleName.DOMICILIARIO, RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: UsuarioEntity })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado o acceso denegado' })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)', type: 'string' })
  async findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest): Promise<UsuarioEntity> {
    const userRole = await this.rolesService.findOne(req.user.rol_id);

    if (userRole.nombre === RoleName.SUPER_ADMIN) {
      return this.usuariosService.findOne(id);
    }
    if (req.user.id === id) {
        return this.usuariosService.findOne(id);
    }
    if (userRole.nombre === RoleName.ADMIN || userRole.nombre === RoleName.SUPERVISOR || userRole.nombre === RoleName.MESERO || userRole.nombre === RoleName.CAJERO || userRole.nombre === RoleName.DOMICILIARIO) {
        const usuarioSolicitado = await this.usuariosService.findOne(id);
        if (req.user.establecimiento_id === null) {
            throw new BadRequestException('Tu token no tiene un establecimiento asignado, acceso denegado.');
        }
        if (usuarioSolicitado && usuarioSolicitado.establecimiento_id === req.user.establecimiento_id) {
            return usuarioSolicitado;
        }
    }
    throw new NotFoundException(`Usuario con ID "${id}" no encontrado o acceso denegado.`);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPERVISOR, RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Actualizar un usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado exitosamente', type: UsuarioEntity })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado o acceso denegado' })
  @ApiResponse({ status: 409, description: 'El nombre de usuario ya existe' })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)', type: 'string' })
  @ApiBody({ type: UpdateUsuarioDto })
  async update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto, @Req() req: AuthenticatedRequest): Promise<UsuarioEntity> {
    const userRole = await this.rolesService.findOne(req.user.rol_id);
    const targetUser = await this.usuariosService.findOne(id);

    if (!targetUser) {
        throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }
    if (userRole.nombre === RoleName.SUPER_ADMIN) {
        if (updateUsuarioDto.rolName) {
            const targetUserRole = await this.rolesService.findOne(targetUser.rol_id);
            const newRole = await this.rolesService.findOneByName(updateUsuarioDto.rolName);
            if (targetUserRole.nombre === RoleName.SUPER_ADMIN && newRole.nombre !== RoleName.SUPER_ADMIN) {
                throw new BadRequestException('Un SuperAdmin no puede degradar a otro SuperAdmin.');
            }
            if (targetUser.id === req.user.id && newRole.nombre !== userRole.nombre) {
                throw new BadRequestException('No puedes cambiar tu propio rol.');
            }
        }
        if (updateUsuarioDto.establecimientoName) {
            const newEstablecimiento = await this.establecimientosService.findOne(updateUsuarioDto.establecimientoName);
            if (!newEstablecimiento) {
                throw new NotFoundException(`Establecimiento con nombre "${updateUsuarioDto.establecimientoName}" no encontrado.`);
            }
        }
        return this.usuariosService.update(id, updateUsuarioDto);
    }
    if (userRole.nombre === RoleName.ADMIN || userRole.nombre === RoleName.SUPERVISOR) {
        if (req.user.establecimiento_id === null) {
            throw new BadRequestException('Tu rol requiere un establecimiento asignado para actualizar usuarios.');
        }
        if (targetUser.establecimiento_id !== req.user.establecimiento_id) {
            throw new NotFoundException(`Acceso denegado. No tiene permiso para actualizar este usuario.`);
        }
        if (updateUsuarioDto.rolName) {
            const newRole = await this.rolesService.findOneByName(updateUsuarioDto.rolName);
            if (newRole.nombre === RoleName.ADMIN || newRole.nombre === RoleName.SUPER_ADMIN) {
                throw new BadRequestException(`Un ${userRole.nombre} no puede establecer el rol a ${newRole.nombre}.`);
            }
        }
        const currentEstablecimiento = await this.establecimientosService.findOne(req.user.establecimiento_id);
        if (updateUsuarioDto.establecimientoName && updateUsuarioDto.establecimientoName !== currentEstablecimiento.nombre) {
            throw new BadRequestException('No puedes cambiar el establecimiento de un usuario.');
        }
        return this.usuariosService.update(id, updateUsuarioDto, req.user.establecimiento_id);
    }
    if (req.user.id === id) {
        if (updateUsuarioDto.rolName || updateUsuarioDto.establecimientoName || updateUsuarioDto.activo !== undefined) {
            throw new BadRequestException('No puedes cambiar tu rol, establecimiento o estado de actividad.');
        }
        if (req.user.establecimiento_id === null) {
            throw new BadRequestException('Tu token no tiene un establecimiento asignado, no puedes actualizar tu perfil.');
        }
        return this.usuariosService.update(id, updateUsuarioDto, req.user.establecimiento_id);
    }

    throw new NotFoundException(`Acceso denegado. No tiene permiso para actualizar este usuario.`);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @Roles(RoleName.ADMIN, RoleName.SUPER_ADMIN)
  @ApiOperation({ summary: 'Eliminar un usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado exitosamente' })
  @ApiResponse({ status: 400, description: 'No puedes eliminar tu propio usuario o un SuperAdmin/Admin' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado o acceso denegado' })
  @ApiParam({ name: 'id', description: 'ID del usuario (UUID)', type: 'string' })
  async remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    if (req.user.id === id) {
      throw new BadRequestException('No puedes eliminar tu propio usuario.');
    }

    const userRole = await this.rolesService.findOne(req.user.rol_id);
    const targetUser = await this.usuariosService.findOne(id);

    if (!targetUser) {
        throw new NotFoundException(`Usuario con ID "${id}" no encontrado.`);
    }

    const targetUserRole = await this.rolesService.findOne(targetUser.rol_id);

    if (userRole.nombre === RoleName.SUPER_ADMIN) {
        if (targetUserRole.nombre === RoleName.SUPER_ADMIN) {
            throw new BadRequestException('Un SuperAdmin no puede eliminar a otro SuperAdmin.');
        }
        await this.usuariosService.remove(id);
    } else if (userRole.nombre === RoleName.ADMIN) {
        if (req.user.establecimiento_id === null) {
            throw new BadRequestException('Tu token no tiene un establecimiento asignado, acceso denegado.');
        }
        if (targetUser.establecimiento_id !== req.user.establecimiento_id) {
            throw new NotFoundException(`Acceso denegado. No tiene permiso para eliminar este usuario.`);
        }
        if (targetUserRole.nombre === RoleName.ADMIN) {
            throw new BadRequestException('Un Admin no puede eliminar a otro Admin.');
        }
        await this.usuariosService.remove(id, req.user.establecimiento_id);
    } else {
        throw new BadRequestException('Tu rol no tiene permiso para eliminar usuarios.');
    }
    return { 
      message: 'Usuario eliminado exitosamente', 
      data: null 
    };
  }
}