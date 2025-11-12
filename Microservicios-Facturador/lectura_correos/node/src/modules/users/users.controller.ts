// // src/modules/users/users.controller.ts
// import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
// import { UsersService } from './users.service';
// import { CreateUserDto } from './dto/create-user.dto';
// import { CreateRoleDto } from './dto/create-role.dto'; 

// @Controller('users')
// @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
// export class UsersController {
//   constructor(private readonly usersService: UsersService) {}

//   @Post()
//   @HttpCode(HttpStatus.CREATED)
//   create(@Body() createUserDto: CreateUserDto, @Body('role_id') roleId: string) { 
//     return this.usersService.create(createUserDto, roleId);
//   }

//   @Get()
//   findAll() {
//     return this.usersService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.usersService.findOne(id);
//   }

//   @Post('roles')
//   @HttpCode(HttpStatus.CREATED)
//   createRole(@Body() createRoleDto: CreateRoleDto) {
//     return this.usersService.createRole(createRoleDto.name, createRoleDto.description);
//   }

//   @Get('roles')
//   findAllRoles() {
//     return this.usersService.findAllRoles();
//   }

//   @Get('roles/:id')
//   findRoleById(@Param('id') id: string) {
//     return this.usersService.findRoleById(id);
//   }
// }

import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateRoleDto } from './dto/create-role.dto';
@Controller('users')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createUserDto: CreateUserDto, @Body('role_id') roleId: string) {
    return this.usersService.create(createUserDto, roleId);
  }
  @Get()
  findAll() {
    return this.usersService.findAll();
  }
  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.usersService.createRole(createRoleDto.name, createRoleDto.description);
  }
  @Get('roles') 
  findAllRoles() {
    return this.usersService.findAllRoles();
  }
  @Get('roles/:id')
  findRoleById(@Param('id') id: string) {
    return this.usersService.findRoleById(id);
  }
  @Get(':id') 
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}