import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common'; 
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator'; 
import { RoleName } from '../constants/app.constants';
import { RolesService } from '../../modules/roles/roles.service'; 

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly rolesService: RolesService, 
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
    ]);

    if (isPublic) {
        return true; 
    }
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; 
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.rol_id) {
        throw new UnauthorizedException('Usuario no autenticado o sin información de rol en el token.');
    }

    const userRoleEntity = await this.rolesService.findOne(user.rol_id);

    if (!userRoleEntity) {
      throw new UnauthorizedException('El rol asignado al usuario no fue encontrado en la base de datos.');
    }

    const userRoleName = userRoleEntity.nombre;
    const hasRole = requiredRoles.some((role) => userRoleName === role);

    if (!hasRole) {
      throw new ForbiddenException('No tienes permisos para realizar esta acción.');
    }

    return true;
  }
}