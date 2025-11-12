import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { EstablecimientosService } from '../establecimientos/establecimientos.service';
import { CategoriaEntity } from './entities/categoria.entity';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(CategoriaEntity)
    private readonly categoriaRepository: Repository<CategoriaEntity>,
    private readonly establecimientosService: EstablecimientosService,
  ) {}

  async create(createCategoriaDto: CreateCategoriaDto): Promise<CategoriaEntity> {
    const { establecimiento_id, nombre, ...restOfDto } = createCategoriaDto;

    const existingCategoria = await this.categoriaRepository.findOneBy({ establecimiento_id, nombre });
    if (existingCategoria) {
      throw new ConflictException(`La categoría con nombre "${nombre}" ya existe en el establecimiento "${establecimiento_id}".`);
    }

    const categoriaToCreate: Partial<CategoriaEntity> = {
      establecimiento_id,
      nombre,
      ...restOfDto,
    };

    if (nombre.toLowerCase() === 'bebidas') {
      categoriaToCreate.es_bebida = true;
    } else {
      categoriaToCreate.es_bebida = createCategoriaDto.es_bebida ?? false;
    }

    const categoria = this.categoriaRepository.create(categoriaToCreate);
    return await this.categoriaRepository.save(categoria);
  }

  async findAll(establecimientoId: string): Promise<CategoriaEntity[]> {
    return await this.categoriaRepository.find({
      where: { establecimiento_id: establecimientoId },
      order: { nombre: 'ASC' }, 
      relations: ['establecimiento'],
    });
  }

  async findOne(id: string, establecimientoId?: string): Promise<CategoriaEntity> {
    const whereCondition: any = { id };
    if (establecimientoId) {
      whereCondition.establecimiento_id = establecimientoId;
    }
    const categoria = await this.categoriaRepository.findOne({
      where: whereCondition,
      relations: ['establecimiento'],
    });
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID "${id}" no encontrada.`);
    }
    return categoria;
  }

  /**
   * Busca una categoría por su nombre y establecimiento.
   * @param nombre Nombre de la categoría.
   * @param establecimientoId ID del establecimiento al que pertenece la categoría.
   * @returns La categoría encontrada o null si no existe.
   */
  async findByName(nombre: string, establecimientoId: string): Promise<CategoriaEntity | null> {
    return await this.categoriaRepository.findOne({
      where: { nombre, establecimiento_id: establecimientoId },
    });
  }

  async update(id: string, updateCategoriaDto: UpdateCategoriaDto, establecimientoId?: string): Promise<CategoriaEntity> {
    const { nombre, ...restOfDto } = updateCategoriaDto; 
    const categoria = await this.findOne(id, establecimientoId);

    if (nombre && nombre !== categoria.nombre) {
      const existingCategoria = await this.categoriaRepository.findOneBy({
        establecimiento_id: categoria.establecimiento_id,
        nombre,
      });
      if (existingCategoria && existingCategoria.id !== id) {
        throw new ConflictException(`La categoría con nombre "${nombre}" ya existe en el establecimiento "${categoria.establecimiento_id}".`);
      }
      categoria.nombre = nombre;
    }
    
    if (updateCategoriaDto.es_bebida !== undefined) {
      categoria.es_bebida = updateCategoriaDto.es_bebida;
    }

    Object.assign(categoria, restOfDto); 
    return await this.categoriaRepository.save(categoria);
  }

  async remove(id: string, establecimientoId?: string): Promise<DeleteResult> {
    await this.findOne(id, establecimientoId);
    const result = await this.categoriaRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Categoría con ID "${id}" no encontrada para eliminar.`);
    }
    return result;
  }
}