import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity'; 
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs'; 

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>, 
  ) {}

  async create(createUserDto: CreateUserDto, roleId: string): Promise<User> {
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException(`Role with ID "${roleId}" not found.`);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const newUser = this.userRepository.create({
      username: createUserDto.username,
      password_hash: hashedPassword,
      role: role, 
      role_id: role.id, 
    });

    try {
      return await this.userRepository.save(newUser);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Username already exists.');
      }
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ relations: ['role'] }); 
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id }, relations: ['role'] });
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { username }, relations: ['role'] });
    if (!user) {
      throw new NotFoundException(`User with username "${username}" not found`);
    }
    return user;
  }

  async createRole(name: string, description?: string): Promise<Role> {
    const newRole = this.roleRepository.create({ name, description });
    try {
      return await this.roleRepository.save(newRole);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new BadRequestException('Role name already exists.');
      }
      throw error;
    }
  }

  async findRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });
    if (!role) throw new NotFoundException(`Role with ID "${id}" not found.`);
    return role;
  }

  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find();
  }
}