import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosService } from '../usuarios.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioEntity } from '../entities/usuario.entity';
import { RolEntity } from '../../roles/entities/rol.entity';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { CreateUsuarioDto } from '../dto/create-usuario.dto';
import { UpdateUsuarioDto } from '../dto/update-usuario.dto';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

// Mock de bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password) => `hashed_${password}`),
  genSalt: jest.fn(() => 'salt'),
}));

describe('UsuariosService', () => {
  let service: UsuariosService;
  let usuarioRepository: Repository<UsuarioEntity>;
  let rolRepository: Repository<RolEntity>;
  let establecimientoRepository: Repository<EstablecimientoEntity>;

  // Datos de mock
  const mockRol = { id: 'rol-1', nombre: 'CAJERO' } as RolEntity;
  const mockEstablecimiento = { id: 'est-1', nombre: 'Restaurante POS' } as EstablecimientoEntity;
  const mockUser: UsuarioEntity = {
    id: 'user-1',
    nombre: 'Test',
    apellido: 'User',
    username: 'testuser',
    password_hash: 'hashed_password123',
    activo: true,
    rol_id: mockRol.id,
    establecimiento_id: mockEstablecimiento.id,
    rol: mockRol,
    establecimiento: mockEstablecimiento,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: getRepositoryToken(UsuarioEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(RolEntity),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(EstablecimientoEntity),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    usuarioRepository = module.get<Repository<UsuarioEntity>>(getRepositoryToken(UsuarioEntity));
    rolRepository = module.get<Repository<RolEntity>>(getRepositoryToken(RolEntity));
    establecimientoRepository = module.get<Repository<EstablecimientoEntity>>(getRepositoryToken(EstablecimientoEntity));

    // Resetear los mocks antes de cada prueba
    // Es buena práctica espiar TODOS los métodos del repositorio que tu servicio va a usar.
    // Esto asegura que Jest los pueda rastrear.
    jest.clearAllMocks();
    jest.spyOn(usuarioRepository, 'create').mockImplementation((entity) => entity as any); // Asegura que create retorne el objeto que espera save
    jest.spyOn(usuarioRepository, 'save').mockResolvedValue(mockUser);
    jest.spyOn(usuarioRepository, 'findOne').mockResolvedValue(mockUser);
    jest.spyOn(usuarioRepository, 'findOneBy').mockResolvedValue(null); // Default para que no existan usuarios al inicio
    jest.spyOn(usuarioRepository, 'find').mockResolvedValue([]);
    jest.spyOn(usuarioRepository, 'delete').mockResolvedValue({ affected: 1, raw: {} });

    jest.spyOn(rolRepository, 'findOneBy').mockResolvedValue(mockRol); // Default rol existente
    jest.spyOn(establecimientoRepository, 'findOneBy').mockResolvedValue(mockEstablecimiento); // Default establecimiento existente

  });

  it('debería ser definido', () => {
    expect(service).toBeDefined();
  });

  // --- Pruebas para create ---
  describe('create', () => {
    const createDto: CreateUsuarioDto = {
      establecimientoName: 'Restaurante POS',
      rolName: 'CAJERO',
      nombre: 'Nuevo',
      apellido: 'Usuario',
      username: 'nuevouser',
      password: 'password123',
      activo: true,
    };

    it('debería crear un usuario válido con todos los campos obligatorios y hashear la contraseña', async () => {

      const result = await service.create(createDto);

      expect(rolRepository.findOneBy).toHaveBeenCalledWith({ nombre: createDto.rolName });
      expect(establecimientoRepository.findOneBy).toHaveBeenCalledWith({ nombre: createDto.establecimientoName });
      expect(usuarioRepository.findOneBy).toHaveBeenCalledWith({ username: createDto.username });
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 'salt');
      expect(usuarioRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        username: createDto.username,
        password_hash: `hashed_${createDto.password}`,
        rol_id: mockRol.id,
        establecimiento_id: mockEstablecimiento.id,
      }));
      expect(usuarioRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('no debería crear un usuario si el correo ya está registrado y lanzar ConflictException', async () => {
      jest.spyOn(usuarioRepository, 'findOneBy').mockResolvedValue(mockUser); // Usuario ya existe

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
      expect(usuarioRepository.save).not.toHaveBeenCalled();
    });

    it('no debería crear un usuario si el rol no existe y lanzar NotFoundException', async () => {
      jest.spyOn(rolRepository, 'findOneBy').mockResolvedValue(null); // Rol no encontrado

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(usuarioRepository.save).not.toHaveBeenCalled();
    });

    it('no debería crear un usuario si el establecimiento no existe y lanzar NotFoundException', async () => {
      jest.spyOn(establecimientoRepository, 'findOneBy').mockResolvedValue(null); // Establecimiento no encontrado

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
      expect(usuarioRepository.save).not.toHaveBeenCalled();
    });

    it('no debería crear un usuario sin nombre de establecimiento (establecimientoName) y lanzar BadRequestException', async () => {
      const dtoWithoutEstablecimiento = { ...createDto, establecimientoName: undefined };

      await expect(service.create(dtoWithoutEstablecimiento)).rejects.toThrow(BadRequestException);
      expect(usuarioRepository.save).not.toHaveBeenCalled();
    });

    it('no debería crear un usuario sin rolName y lanzar NotFoundException', async () => {
      const dtoWithoutRolName = { ...createDto, rolName: undefined as any };

      jest.spyOn(rolRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.create(dtoWithoutRolName)).rejects.toThrow(NotFoundException);
      expect(usuarioRepository.save).not.toHaveBeenCalled();
    });
  });

  // --- Pruebas para update ---
  describe('update', () => {
    const updateDto: UpdateUsuarioDto = {
      nombre: 'Updated',
      apellido: 'User',
    };
    const updatedUser = { ...mockUser, nombre: 'Updated', apellido: 'User' } as UsuarioEntity;

    it('debería actualizar un usuario existente con datos válidos', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser); // Retorna el usuario a actualizar
      jest.spyOn(usuarioRepository, 'save').mockResolvedValue(updatedUser); // save devuelve el usuario actualizado
      jest.spyOn(usuarioRepository, 'findOne').mockResolvedValue(updatedUser); // findOne final devuelve el usuario actualizado

      const result = await service.update(mockUser.id, updateDto);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(usuarioRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUser.id,
        nombre: updateDto.nombre,
        apellido: updateDto.apellido,
      }));
      expect(result).toEqual(updatedUser);
    });

    it('debería actualizar la contraseña si se proporciona password_nueva', async () => {
      const dtoWithNewPassword: UpdateUsuarioDto = { password_nueva: 'newPassword123' };
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(usuarioRepository, 'save').mockResolvedValue({ ...mockUser, password_hash: 'hashed_newPassword123' });
      jest.spyOn(usuarioRepository, 'findOne').mockResolvedValue({ ...mockUser, password_hash: 'hashed_newPassword123' });

      const result = await service.update(mockUser.id, dtoWithNewPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(dtoWithNewPassword.password_nueva, 'salt');
      expect(usuarioRepository.save).toHaveBeenCalledWith(expect.objectContaining({
        id: mockUser.id,
        password_hash: 'hashed_newPassword123',
      }));
      expect(result.password_hash).toBe('hashed_newPassword123');
    });

    it('no debería actualizar si el usuario no existe y lanzar NotFoundException', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException()); // findOne arroja error

      await expect(service.update('non-existent-id', updateDto)).rejects.toThrow(NotFoundException);
      expect(usuarioRepository.save).not.toHaveBeenCalled();
    });

    it('no debería actualizar si el nuevo username ya está en uso por otro usuario y lanzar ConflictException', async () => {
      const dtoWithConflictUsername: UpdateUsuarioDto = { username: 'existinguser' };
      const anotherUser = { ...mockUser, id: 'user-2', username: 'existinguser' };

      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(usuarioRepository, 'findOneBy').mockResolvedValue(anotherUser); 

      await expect(service.update(mockUser.id, dtoWithConflictUsername)).rejects.toThrow(ConflictException);
      expect(usuarioRepository.save).not.toHaveBeenCalled();
    });

    it('no debería permitir cambiar el rolName a través de update si el rol de destino no existe', async () => {
        const dtoWithInvalidRolName: UpdateUsuarioDto = { rolName: 'ROL_INEXISTENTE' };
        jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
        jest.spyOn(rolRepository, 'findOneBy').mockResolvedValue(null);

        await expect(service.update(mockUser.id, dtoWithInvalidRolName)).rejects.toThrow(NotFoundException);
        expect(usuarioRepository.save).not.toHaveBeenCalled();
    });

    it('no debería permitir cambiar el rol de un usuario directamente a través de esta operación si los ids no coinciden', async () => {
        const otroRol = { id: 'rol-2', nombre: 'SUPERVISOR' } as RolEntity;
        const dtoWithNewRol: UpdateUsuarioDto = { rolName: otroRol.nombre };
        jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
        jest.spyOn(rolRepository, 'findOneBy').mockResolvedValue(otroRol);

        await expect(service.update(mockUser.id, dtoWithNewRol)).rejects.toThrow(BadRequestException);
        expect(usuarioRepository.save).not.toHaveBeenCalled();
    });

    it('no debería permitir cambiar el establecimientoName a través de update si el establecimiento de destino no existe', async () => {
        const dtoWithInvalidEstablecimientoName: UpdateUsuarioDto = { establecimientoName: 'EST_INEXISTENTE' };
        jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
        jest.spyOn(establecimientoRepository, 'findOneBy').mockResolvedValue(null);

        await expect(service.update(mockUser.id, dtoWithInvalidEstablecimientoName)).rejects.toThrow(NotFoundException);
        expect(usuarioRepository.save).not.toHaveBeenCalled();
    });

    it('no debería permitir cambiar el establecimiento de un usuario directamente a través de esta operación si los ids no coinciden', async () => {
        const otroEstablecimiento = { id: 'est-2', nombre: 'Otro Lugar' } as EstablecimientoEntity;
        const dtoWithNewEstablecimiento: UpdateUsuarioDto = { establecimientoName: otroEstablecimiento.nombre };
        jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
        // Mock establecimientoRepository.findOneBy para que devuelva el 'otroEstablecimiento', pero el ID de mockUser.establecimiento_id es diferente
        jest.spyOn(establecimientoRepository, 'findOneBy').mockResolvedValue(otroEstablecimiento);

        await expect(service.update(mockUser.id, dtoWithNewEstablecimiento)).rejects.toThrow(BadRequestException);
        expect(usuarioRepository.save).not.toHaveBeenCalled();
    });
  });

  // --- Pruebas para remove ---
  describe('remove', () => {
    it('debería eliminar un usuario existente', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(usuarioRepository, 'delete').mockResolvedValue({ affected: 1, raw: {} });

      const result = await service.remove(mockUser.id);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.id, undefined);
      expect(usuarioRepository.delete).toHaveBeenCalledWith(mockUser.id);
      expect(result.affected).toBe(1);
    });

    it('no debería eliminar si el usuario no existe y lanzar NotFoundException', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());

      await expect(service.remove('non-existent-id')).rejects.toThrow(NotFoundException);
      expect(usuarioRepository.delete).not.toHaveBeenCalled();
    });

    it('debería lanzar BadRequestException si el usuario tiene registros asociados', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      const foreignKeyError: any = new Error('Foreign key constraint failed');
      foreignKeyError.code = 'ER_ROW_IS_REFERENCED';

      jest.spyOn(usuarioRepository, 'delete').mockRejectedValue(foreignKeyError);

      await expect(service.remove(mockUser.id)).rejects.toThrow(BadRequestException);
      expect(usuarioRepository.delete).toHaveBeenCalledWith(mockUser.id);
    });

    it('debería lanzar NotFoundException si el usuario no es encontrado para eliminar (affected 0)', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser);
      jest.spyOn(usuarioRepository, 'delete').mockResolvedValue({ affected: 0, raw: {} });

      await expect(service.remove(mockUser.id)).rejects.toThrow(NotFoundException);
      expect(usuarioRepository.delete).toHaveBeenCalledWith(mockUser.id);
    });
  });

  // --- Pruebas para findOne y findAll ---
  describe('findOne', () => {
    it('debería retornar un usuario por ID', async () => {
      jest.spyOn(usuarioRepository, 'findOne').mockResolvedValue(mockUser);
      const result = await service.findOne(mockUser.id);
      expect(result).toEqual(mockUser);
      expect(usuarioRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: mockUser.id } }));
    });

    it('debería lanzar NotFoundException si el usuario no es encontrado en findOne', async () => {
      jest.spyOn(usuarioRepository, 'findOne').mockResolvedValue(null);
      await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
    });

    it('debería retornar un usuario por ID y establecimiento', async () => {
      jest.spyOn(usuarioRepository, 'findOne').mockResolvedValue(mockUser);
      const result = await service.findOne(mockUser.id, mockEstablecimiento.id);
      expect(result).toEqual(mockUser);
      expect(usuarioRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { id: mockUser.id, establecimiento_id: mockEstablecimiento.id } }));
    });
  });

  describe('findAll', () => {
    it('debería retornar todos los usuarios sin filtro de establecimiento', async () => {
      const mockUsers = [mockUser, { ...mockUser, id: 'user-2', username: 'anotheruser' }];
      jest.spyOn(usuarioRepository, 'find').mockResolvedValue(mockUsers);
      const result = await service.findAll();
      expect(result).toEqual(mockUsers);
      expect(usuarioRepository.find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    });

    it('debería retornar usuarios filtrados por ID de establecimiento', async () => {
      const mockUsers = [mockUser];
      jest.spyOn(usuarioRepository, 'find').mockResolvedValue(mockUsers);
      const result = await service.findAll(mockEstablecimiento.id);
      expect(result).toEqual(mockUsers);
      expect(usuarioRepository.find).toHaveBeenCalledWith(expect.objectContaining({ where: { establecimiento_id: mockEstablecimiento.id } }));
    });
  });
});