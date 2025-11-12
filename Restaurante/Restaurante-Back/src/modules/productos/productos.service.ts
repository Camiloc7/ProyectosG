import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner, DeleteResult, Not, In } from 'typeorm';
import { ProductoEntity } from './entities/producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { CategoriaEntity } from '../categorias/entities/categoria.entity';
import { EstablecimientosService } from '../establecimientos/establecimientos.service';
import { RecetaProductoEntity } from './entities/receta-producto.entity';
import { IngredienteEntity } from '../ingredientes/entities/ingrediente.entity';
import { IngredientesService } from '../ingredientes/ingredientes.service';
import { RecetaItemDto } from './dto/receta-item.dto';
import { CreateProductoConfigurableDto } from './dto/create-producto-configurable.dto';
import { ProductoConfigurableEntity } from './entities/producto-configurable.entity';
import { ConfiguracionOpcion } from './entities/configuracion-opcion.entity';
import { OpcionValor } from './entities/opcion-valor.entity';
import { OpcionValorPrecio } from './entities/opcion-valor-precio.entity';
import { OpcionValorIngrediente } from './entities/opcion-valor-ingrediente.entity';
import { UpdateProductoConfigurableDto } from './dto/update-producto-configurable.dto';
import { OpcionSeleccionadaDto } from '../pedidos/dto/create-pedido-item.dto';
import { normalizeIngredientName } from 'src/common/utils/normalization.utils';
import * as xlsx from 'node-xlsx';

export interface ProductListItem {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
  tipo: 'simple' | 'configurable';
}

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(ProductoEntity)
    private readonly productoSimpleRepository: Repository<ProductoEntity>,
    @InjectRepository(ProductoConfigurableEntity)
    private readonly productoConfigurableRepository: Repository<ProductoConfigurableEntity>,
    @InjectRepository(CategoriaEntity)
    private readonly categoriaRepository: Repository<CategoriaEntity>,
    @InjectRepository(RecetaProductoEntity)
    private readonly recetaProductoRepository: Repository<RecetaProductoEntity>,
    @InjectRepository(ConfiguracionOpcion)
    private readonly configuracionOpcionRepository: Repository<ConfiguracionOpcion>,
    @InjectRepository(OpcionValor)
    private readonly opcionValorRepository: Repository<OpcionValor>,
    @InjectRepository(OpcionValorPrecio)
    private readonly opcionValorPrecioRepository: Repository<OpcionValorPrecio>,
    @InjectRepository(OpcionValorIngrediente)
    private readonly opcionValorIngredienteRepository: Repository<OpcionValorIngrediente>,
    private readonly establecimientosService: EstablecimientosService,
    private readonly ingredientesService: IngredientesService,
    private dataSource: DataSource,
  ) {}
private async removeConfiguracionOpcion(opcionId: string, queryRunner: QueryRunner): Promise<void> {
    const valores = await queryRunner.manager.find(OpcionValor, { where: { configuracion_opcion_id: opcionId } });
    for (const valor of valores) {
        await this.removeOpcionValor(valor.id, queryRunner);
    }
    await queryRunner.manager.delete(ConfiguracionOpcion, opcionId);
}

private async removeOpcionValor(valorId: string, queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.delete(OpcionValorPrecio, { opcion_valor_id: valorId });
    await queryRunner.manager.delete(OpcionValorIngrediente, { opcion_valor_id: valorId });
    await queryRunner.manager.delete(OpcionValor, valorId);
}

private async sincronizarRelacionesDeValor(valorId: string, valorDto: any, queryRunner: QueryRunner, establecimientoId: string): Promise<void> {
    await queryRunner.manager.delete(OpcionValorPrecio, { opcion_valor_id: valorId });
    if (valorDto.precio !== undefined) {
        const precio = queryRunner.manager.create(OpcionValorPrecio, {
            opcion_valor_id: valorId,
            precio: valorDto.precio,
        });
        await queryRunner.manager.save(precio);
    }
    await queryRunner.manager.delete(OpcionValorIngrediente, { opcion_valor_id: valorId });
    if (valorDto.receta && valorDto.receta.length > 0) {
        for (const itemReceta of valorDto.receta) {
            const ingrediente = await this.ingredientesService.findOne(itemReceta.ingrediente_id, establecimientoId);
            if (!ingrediente) {
                throw new NotFoundException(`Ingrediente con ID "${itemReceta.ingrediente_id}" no encontrado.`);
            }
            const recetaItem = queryRunner.manager.create(OpcionValorIngrediente, {
                opcion_valor_id: valorId,
                ingrediente_id: itemReceta.ingrediente_id,
                cantidad: itemReceta.cantidad_necesaria,
            });
            await queryRunner.manager.save(recetaItem);
        }
    }
}

  public async create(createProductoDto: CreateProductoDto): Promise<ProductoEntity> {
    const { establecimiento_id, categoria_id, nombre, precio, receta, iva, ic, inc, ...rest } = createProductoDto;
    if (!establecimiento_id) {
      throw new BadRequestException('El ID del establecimiento es obligatorio.');
    }
    const establecimiento = await this.establecimientosService.findOne(establecimiento_id);
    if (!establecimiento) {
      throw new NotFoundException(`Establecimiento con ID "${establecimiento_id}" no encontrado.`);
    }

    const categoria = await this.categoriaRepository.findOneBy({ id: categoria_id, establecimiento_id });
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID "${categoria_id}" no encontrada o no pertenece al establecimiento.`);
    }
    const existingProducto = await this.productoSimpleRepository.findOneBy({ establecimiento_id, nombre });
    if (existingProducto) {
      throw new ConflictException(`El producto con nombre "${nombre}" ya existe en el establecimiento "${establecimiento_id}".`);
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const producto = queryRunner.manager.create(ProductoEntity, {
        establecimiento_id,
        categoria_id,
        nombre,
        precio,
        iva,
        ic,
        inc,
        ...rest,
      });
      const savedProducto = await queryRunner.manager.save(producto);
      if (receta && receta.length > 0) {
        for (const itemReceta of receta) {
          const ingrediente = await this.ingredientesService.findOne(itemReceta.ingrediente_id, establecimiento_id);
          if (!ingrediente) {
            throw new NotFoundException(`Ingrediente con ID "${itemReceta.ingrediente_id}" no encontrado para la receta.`);
          }
          const recetaProducto = queryRunner.manager.create(RecetaProductoEntity, {
            producto_id: savedProducto.id,
            ingrediente_id: itemReceta.ingrediente_id,
            cantidad_necesaria: itemReceta.cantidad_necesaria,
          });
          await queryRunner.manager.save(recetaProducto);
        }
      }
      await queryRunner.commitTransaction();
      return await this.productoSimpleRepository.findOne({
        where: { id: savedProducto.id },
        relations: ['categoria', 'receta', 'receta.ingrediente'],
      }) as ProductoEntity;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  public async findAll(establecimientoId: string): Promise<ProductListItem[]> {
    const establecimiento = await this.establecimientosService.findOne(establecimientoId);
    if (!establecimiento) {
      throw new NotFoundException(`Establecimiento con ID "${establecimientoId}" no encontrado.`);
    }
    const productosSimples = await this.productoSimpleRepository.find({
      where: { establecimiento_id: establecimientoId, activo: true },
      relations: ['categoria'],
      order: { nombre: 'ASC' },
    });

    const productosConfigurables = await this.productoConfigurableRepository.find({
      where: { establecimiento_id: establecimientoId, activo: true },
      relations: ['categoria'],
      order: { nombre: 'ASC' },
    });
    const listaProductos = [
      ...productosSimples.map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion, 
        precio: p.precio,
        categoria: p.categoria ? p.categoria.nombre : 'Sin categoría',
        tipo: 'simple' as 'simple' | 'configurable',
        imagen_url: p.imagen_url,
      })),
      ...productosConfigurables.map(p => ({
        id: p.id,
        nombre: p.nombre,
        descripcion: p.descripcion, 
        precio: 0,
        categoria: p.categoria ? p.categoria.nombre : 'Sin categoría',
        tipo: 'configurable' as 'simple' | 'configurable',
        imagen_url: p.imagen_url,
      })),
    ];
    return listaProductos.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  public async findOne(id: string, establecimientoId?: string): Promise<ProductoEntity | null> {
    const whereCondition: any = { id };
    if (establecimientoId) {
      const establecimiento = await this.establecimientosService.findOne(establecimientoId);
      if (!establecimiento) {
        return null;
      }
      whereCondition.establecimiento_id = establecimientoId;
    }
    const producto = await this.productoSimpleRepository.findOne({
      where: whereCondition,
      relations: ['categoria', 'receta', 'receta.ingrediente'],
    });
    return producto;
  }
  async findByName(nombre: string, establecimientoId: string): Promise<ProductoEntity | null> {
    const establecimiento = await this.establecimientosService.findOne(establecimientoId);
    if (!establecimiento) {
      return null;
    }
    return await this.productoSimpleRepository.findOne({
      where: { nombre, establecimiento_id: establecimientoId },
      relations: ['categoria', 'receta', 'receta.ingrediente'],
    });
  }

public async update(id: string, updateProductoDto: UpdateProductoDto, establecimientoId?: string): Promise<ProductoEntity> {
  const producto = await this.findOne(id, establecimientoId);
  if (!producto) {
    throw new NotFoundException(`Producto con ID "${id}" no encontrado.`);
  }

  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const fieldsToUpdate: { [key: string]: any } = {};

    if (updateProductoDto.categoria_id !== undefined && updateProductoDto.categoria_id !== producto.categoria_id) {
      const categoria = await queryRunner.manager.findOneBy(CategoriaEntity, {
        id: updateProductoDto.categoria_id,
        establecimiento_id: producto.establecimiento_id
      });
      if (!categoria) {
        throw new NotFoundException(`Categoría con ID "${updateProductoDto.categoria_id}" no encontrada o no pertenece al establecimiento.`);
      }
      fieldsToUpdate.categoria_id = updateProductoDto.categoria_id;
    } else if (updateProductoDto.categoria_id === null) {
      fieldsToUpdate.categoria_id = null;
    }

    if (updateProductoDto.nombre !== undefined && updateProductoDto.nombre !== producto.nombre) {
      const existingProducto = await queryRunner.manager.findOneBy(ProductoEntity, {
        establecimiento_id: producto.establecimiento_id,
        nombre: updateProductoDto.nombre,
      });
      if (existingProducto && existingProducto.id !== id) {
        throw new ConflictException(`El producto con nombre "${updateProductoDto.nombre}" ya existe en el establecimiento "${producto.establecimiento_id}".`);
      }
      fieldsToUpdate.nombre = updateProductoDto.nombre;
    }
    if (updateProductoDto.precio !== undefined) {
      fieldsToUpdate.precio = updateProductoDto.precio;
    }

    const otherProps = ['descripcion', 'imagen_url', 'activo', 'iva', 'ic', 'inc'];
    for (const prop of otherProps) {
      if (updateProductoDto[prop] !== undefined && updateProductoDto[prop] !== producto[prop]) {
        fieldsToUpdate[prop] = updateProductoDto[prop];
      }
    }
    if (Object.keys(fieldsToUpdate).length > 0) {
      await queryRunner.manager
        .createQueryBuilder()
        .update(ProductoEntity)
        .set({ ...fieldsToUpdate, updated_at: () => "CURRENT_TIMESTAMP" })
        .where("id = :id", { id: id })
        .execute();
    }
    if (updateProductoDto.receta) {
      await queryRunner.manager.delete(RecetaProductoEntity, { producto_id: producto.id });
      for (const itemReceta of updateProductoDto.receta) {
        const ingrediente = await this.ingredientesService.findOne(itemReceta.ingrediente_id, producto.establecimiento_id);
        if (!ingrediente) {
          throw new NotFoundException(`Ingrediente con ID "${itemReceta.ingrediente_id}" no encontrado para la receta.`);
        }
        const recetaProducto = queryRunner.manager.create(RecetaProductoEntity, {
          producto_id: producto.id,
          ingrediente_id: itemReceta.ingrediente_id,
          cantidad_necesaria: itemReceta.cantidad_necesaria,
        });
        await queryRunner.manager.save(recetaProducto);
      }
    } else if (updateProductoDto.receta === null) {
      await queryRunner.manager.delete(RecetaProductoEntity, { producto_id: producto.id });
    }

    await queryRunner.commitTransaction();

    const updatedProduct = await this.productoSimpleRepository.findOne({
      where: { id: producto.id },
      relations: ['categoria', 'receta', 'receta.ingrediente'],
    }) as ProductoEntity;

    return updatedProduct;

  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
  public async remove(id: string, establecimientoId?: string): Promise<DeleteResult> {
    const producto = await this.findOne(id, establecimientoId);
    if (!producto) {
      throw new NotFoundException(`Producto con ID "${id}" no encontrado para eliminar.`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.delete(RecetaProductoEntity, { producto_id: producto.id });
      const result = await queryRunner.manager.delete(ProductoEntity, id);
      if (result.affected === 0) {
        throw new NotFoundException(`Producto con ID "${id}" no encontrado para eliminar.`);
      }
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }





/**
 * Obtiene la receta consolidada de un producto simple en el formato { ingredienteId: cantidad_necesaria }.
 * Este método es utilizado por el PedidosService para la gestión de inventario.
 * @param productoId ID del producto simple.
 * @param establecimientoId ID del establecimiento.
 * @returns Objeto { ingredienteId: cantidad_necesaria }.
 */
public async obtenerRecetaDeProductoSimple(
    productoId: string, 
    establecimientoId: string
): Promise<{ [ingredienteId: string]: number }> {
    const producto = await this.productoSimpleRepository.findOne({
        where: { id: productoId, establecimiento_id: establecimientoId },
        relations: ['receta'], 
    });

    if (!producto) {
        return {}; 
    }

    const recetaConsolidada: { [ingredienteId: string]: number } = {};

    if (producto.receta) {
        for (const recetaItem of producto.receta) {
            recetaConsolidada[recetaItem.ingrediente_id] = Number(recetaItem.cantidad_necesaria);
        }
    }

    return recetaConsolidada;
}






async resolveConfigurableProductInfo(
  id: string,
  establecimientoId: string,
  configuracion_json: any, 
) {
  const productoConfigurable = await this.findOneConfigurableWithRelations(id, establecimientoId);
  if (!productoConfigurable) {
    throw new NotFoundException(`Producto configurable con ID "${id}" no encontrado.`);
  }
  let precioTotal = Number(productoConfigurable.precio_base);
  const recetaConsolidada: { [ingredienteId: string]: number } = {};
  for (const opcionId in configuracion_json) {
    if (Object.prototype.hasOwnProperty.call(configuracion_json, opcionId)) {
      const valoresSeleccionadosIds: string[] = configuracion_json[opcionId];

      const opcion = productoConfigurable.opciones.find((o) => o.id === opcionId);
      if (!opcion) {
        throw new BadRequestException(`Opción de configuración con ID "${opcionId}" no es válida.`);
      }
      for (const valorId of valoresSeleccionadosIds) {
        const valor = opcion.valores.find((v) => v.id === valorId);
        if (!valor) {
          throw new BadRequestException(`Valor de opción con ID "${valorId}" no es válido para la opción "${opcion.nombre}".`);
        }
        if (valor.precios && valor.precios.length > 0) {
          precioTotal += Number(valor.precios[0].precio);
        } else {
          throw new BadRequestException(`No se encontró un precio para el valor de opción "${valor.nombre}".`);
        }

        if (valor.ingredientes) {
          for (const ingredienteItem of valor.ingredientes) {
            const cantidadActual = recetaConsolidada[ingredienteItem.ingrediente_id] || 0;
            recetaConsolidada[ingredienteItem.ingrediente_id] = cantidadActual + Number(ingredienteItem.cantidad);
          }
        }
      }
    }
  }
  return { precio: precioTotal, receta: recetaConsolidada };
}

  async addRecetaItem(productoId: string, createRecetaItemDto: RecetaItemDto): Promise<RecetaProductoEntity> {
    const { ingrediente_id, cantidad_necesaria } = createRecetaItemDto;
    const producto = await this.productoSimpleRepository.findOneBy({ id: productoId });
    if (!producto) {
      throw new NotFoundException(`Producto con ID "${productoId}" no encontrado.`);
    }
    const ingrediente = await this.ingredientesService.findOne(ingrediente_id, producto.establecimiento_id);
    if (!ingrediente) {
      throw new NotFoundException(`Ingrediente con ID "${ingrediente_id}" no encontrado.`);
    }
    const existingRecetaItem = await this.recetaProductoRepository.findOneBy({
      producto_id: productoId,
      ingrediente_id: ingrediente_id,
    });

    if (existingRecetaItem) {
      throw new ConflictException(`El ingrediente "${ingrediente.nombre}" ya existe en la receta del producto "${producto.nombre}".`);
    }
    const recetaItem = this.recetaProductoRepository.create({
      producto_id: productoId,
      ingrediente_id: ingrediente_id,
      cantidad_necesaria,
    });
    return await this.recetaProductoRepository.save(recetaItem);
  }
  async updateRecetaItem(productoId: string, recetaItemId: string, updateRecetaItemDto: Partial<RecetaItemDto>): Promise<RecetaProductoEntity> {
    const recetaItem = await this.recetaProductoRepository.findOneBy({ id: recetaItemId, producto_id: productoId });
    if (!recetaItem) {
      throw new NotFoundException(`Ítem de receta con ID "${recetaItemId}" no encontrado para el producto "${productoId}".`);
    }

    if (updateRecetaItemDto.ingrediente_id && updateRecetaItemDto.ingrediente_id !== recetaItem.ingrediente_id) {
      const existingIngrediente = await this.recetaProductoRepository.findOneBy({
        producto_id: productoId,
        ingrediente_id: updateRecetaItemDto.ingrediente_id,
      });

      if (existingIngrediente) {
        throw new ConflictException(`El ingrediente con ID "${updateRecetaItemDto.ingrediente_id}" ya está en la receta de este producto.`);
      }
      const producto = await this.productoSimpleRepository.findOneBy({ id: productoId });
      if (!producto) {
        throw new NotFoundException(`Producto con ID "${productoId}" no encontrado para actualizar ítem de receta.`);
      }
      const nuevoIngrediente = await this.ingredientesService.findOne(updateRecetaItemDto.ingrediente_id, producto.establecimiento_id);
      if (!nuevoIngrediente) {
        throw new NotFoundException(`Nuevo ingrediente con ID "${updateRecetaItemDto.ingrediente_id}" no encontrado.`);
      }
      recetaItem.ingrediente_id = updateRecetaItemDto.ingrediente_id;
    }

    if (updateRecetaItemDto.cantidad_necesaria !== undefined) {
      recetaItem.cantidad_necesaria = updateRecetaItemDto.cantidad_necesaria;
    }

    return await this.recetaProductoRepository.save(recetaItem);
  }
  async removeRecetaItem(productoId: string, recetaItemId: string): Promise<DeleteResult> {
    const recetaItem = await this.recetaProductoRepository.findOneBy({ id: recetaItemId, producto_id: productoId });
    if (!recetaItem) {
      throw new NotFoundException(`Ítem de receta con ID "${recetaItemId}" no encontrado para el producto "${productoId}".`);
    }
    return await this.recetaProductoRepository.delete(recetaItemId);
  }
  public async createConfigurable(
  createDto: CreateProductoConfigurableDto,
  establecimientoId: string, 
): Promise<ProductoConfigurableEntity> {
  const { categoria_id, nombre, descripcion, precio_base, opciones, imagen_url } = createDto;
  const establecimiento = await this.establecimientosService.findOne(establecimientoId);
  if (!establecimiento) {
    throw new NotFoundException(`Establecimiento con ID "${establecimientoId}" no encontrado.`);
  }
  const categoria = await this.categoriaRepository.findOneBy({ id: categoria_id, establecimiento_id: establecimientoId });
  if (!categoria) {
    throw new NotFoundException(`Categoría con ID "${categoria_id}" no encontrada o no pertenece al establecimiento.`);
  }
  const existingProducto = await this.productoConfigurableRepository.findOneBy({ establecimiento_id: establecimientoId, nombre });
  if (existingProducto) {
    throw new ConflictException(`El producto configurable con nombre "${nombre}" ya existe en el establecimiento.`);
  }
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const productoConfigurable = queryRunner.manager.create(ProductoConfigurableEntity, {
      establecimiento_id: establecimientoId, 
      categoria_id,
      nombre,
      descripcion,
      precio_base,
      imagen_url,
    });
    const savedProducto = await queryRunner.manager.save(productoConfigurable);

    for (const opcionDto of opciones) {
      const nuevaOpcion = queryRunner.manager.create(ConfiguracionOpcion, {
        producto_configurable_id: savedProducto.id,
        nombre: opcionDto.nombre,
        es_multiple: opcionDto.es_multiple,
      });
      const savedOpcion = await queryRunner.manager.save(nuevaOpcion);

      for (const valorDto of opcionDto.valores) {
        const nuevoValor = queryRunner.manager.create(OpcionValor, {
          configuracion_opcion_id: savedOpcion.id,
          nombre: valorDto.nombre,
        });
        const savedValor = await queryRunner.manager.save(nuevoValor);

        if (valorDto.precio !== undefined) {
          const precio = queryRunner.manager.create(OpcionValorPrecio, {
            opcion_valor_id: savedValor.id,
            precio: valorDto.precio,
          });
          await queryRunner.manager.save(precio);
        }
        if (valorDto.receta && valorDto.receta.length > 0) {
          for (const itemReceta of valorDto.receta) {
            const ingrediente = await this.ingredientesService.findOne(itemReceta.ingrediente_id, establecimientoId);
            if (!ingrediente) {
              throw new NotFoundException(`Ingrediente con ID "${itemReceta.ingrediente_id}" no encontrado para la receta.`);
            }
            const recetaItem = queryRunner.manager.create(OpcionValorIngrediente, {
              opcion_valor_id: savedValor.id,
              ingrediente_id: itemReceta.ingrediente_id,
              cantidad: itemReceta.cantidad_necesaria,
            });
            await queryRunner.manager.save(recetaItem);
          }
        }
      }
    }
    await queryRunner.commitTransaction();
    const productoCreado = await this.findOneConfigurableWithRelations(savedProducto.id, establecimientoId);
    if (!productoCreado) {
      throw new NotFoundException(`Error al recuperar el producto creado con ID: ${savedProducto.id}`);
    }
    return productoCreado;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
}
  public async findOneConfigurable(id: string, establecimientoId: string): Promise<ProductoConfigurableEntity | null> {
    const producto = await this.productoConfigurableRepository.findOne({
      where: { id, establecimiento_id: establecimientoId },
      relations: ['categoria', 'opciones', 'opciones.valores'],
    });
    return producto;
  }
  public async findOneConfigurableWithRelations(id: string, establecimientoId: string): Promise<ProductoConfigurableEntity | null> {
    const producto = await this.productoConfigurableRepository.findOne({
      where: { id, establecimiento_id: establecimientoId },
      relations: ['opciones', 'opciones.valores', 'opciones.valores.precios', 'opciones.valores.ingredientes', 'opciones.valores.ingredientes.ingrediente'],
    });
    return producto;
  }
  async getProductsAndConfig(establecimientoId: string) {
    const productosSimples = await this.productoSimpleRepository.find({
      where: { establecimiento_id: establecimientoId },
      relations: ['receta', 'receta.ingrediente'],
    });

    const productosConfigurables = await this.productoConfigurableRepository.find({
      where: { establecimiento_id: establecimientoId },
      relations: ['opciones', 'opciones.valores', 'opciones.valores.precios', 'opciones.valores.ingredientes', 'opciones.valores.ingredientes.ingrediente'],
    });

    return { productosSimples, productosConfigurables };
  }
  public async getProductsList(establecimientoId: string): Promise<ProductListItem[]> {
  const establecimiento = await this.establecimientosService.findOne(establecimientoId);
  if (!establecimiento) {
    throw new NotFoundException(`Establecimiento con ID "${establecimientoId}" no encontrado.`);
  }
  const productosSimples = await this.productoSimpleRepository.find({
    where: { establecimiento_id: establecimientoId, activo: true },
    relations: ['categoria'],
    select: ['id', 'nombre', 'precio', 'descripcion', 'categoria_id'],
    order: { nombre: 'ASC' },
  });
  const productosConfigurables = await this.productoConfigurableRepository.find({
    where: { establecimiento_id: establecimientoId, activo: true },
    relations: ['categoria'],
    select: ['id', 'nombre', 'categoria_id'],
    order: { nombre: 'ASC' },
  });
  const listaProductos = [
    ...productosSimples.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: p.precio,
      descripcion: p.descripcion,
      categoria: p.categoria ? p.categoria.nombre : 'Sin categoría',
      tipo: 'simple' as 'simple' | 'configurable',
    })),
    ...productosConfigurables.map(p => ({
      id: p.id,
      nombre: p.nombre,
      precio: 0, 
      categoria: p.categoria ? p.categoria.nombre : 'Sin categoría',
      tipo: 'configurable' as 'simple' | 'configurable',
    })),
  ];
  return listaProductos.sort((a, b) => a.nombre.localeCompare(b.nombre));
}
public async updateConfigurable(
    id: string,
    updateDto: UpdateProductoConfigurableDto,
    establecimientoId: string,
): Promise<ProductoConfigurableEntity> {
    const producto = await this.productoConfigurableRepository.findOne({
        where: { id, establecimiento_id: establecimientoId },
    });

    if (!producto) {
        throw new NotFoundException(`Producto configurable con ID "${id}" no encontrado.`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const updatedProducto = queryRunner.manager.merge(ProductoConfigurableEntity, producto!, updateDto);
        await queryRunner.manager.save(updatedProducto);
        const opcionesExistentes = await queryRunner.manager.find(ConfiguracionOpcion, { where: { producto_configurable_id: id }, relations: ['valores'] });
        const opcionesActualizadas = updateDto.opciones || [];
        const opcionesAEliminar = opcionesExistentes.filter(op => !opcionesActualizadas.some(updOp => updOp.id === op.id));
        for (const opcion of opcionesAEliminar) {
            await this.removeConfiguracionOpcion(opcion.id, queryRunner);
        }

        for (const opcionDto of opcionesActualizadas) {
            if (opcionDto.id) {
                const opcionExistente = opcionesExistentes.find(op => op.id === opcionDto.id);
                if (!opcionExistente) {
                    throw new NotFoundException(`Opción de configuración con ID "${opcionDto.id}" no encontrada.`);
                }
                opcionExistente.nombre = opcionDto.nombre ?? opcionExistente.nombre;
                opcionExistente.es_multiple = opcionDto.es_multiple ?? opcionExistente.es_multiple;
                await queryRunner.manager.save(opcionExistente);
                const valoresExistentes = opcionExistente.valores || [];
                const valoresActualizados = opcionDto.valores || [];
                const valoresAEliminar = valoresExistentes.filter(val => !valoresActualizados.some(updVal => updVal.id === val.id));
                for (const valor of valoresAEliminar) {
                    await this.removeOpcionValor(valor.id, queryRunner);
                }
                for (const valorDto of valoresActualizados) {
                    if (valorDto.id) {
                        const valorExistente = valoresExistentes.find(val => val.id === valorDto.id);
                        if (!valorExistente) {
                            throw new NotFoundException(`Valor de opción con ID "${valorDto.id}" no encontrado.`);
                        }
                        valorExistente.nombre = valorDto.nombre ?? valorExistente.nombre;
                        await queryRunner.manager.save(valorExistente);

                        await this.sincronizarRelacionesDeValor(valorExistente.id, valorDto, queryRunner, establecimientoId);
                    } else {
                        const nuevoValor = queryRunner.manager.create(OpcionValor, {
                            configuracion_opcion_id: opcionExistente.id,
                            nombre: valorDto.nombre,
                        });
                        const savedValor = await queryRunner.manager.save(nuevoValor);
                        await this.sincronizarRelacionesDeValor(savedValor.id, valorDto, queryRunner, establecimientoId);
                    }
                }
            } else {
                const nuevaOpcion = queryRunner.manager.create(ConfiguracionOpcion, {
                    producto_configurable_id: id,
                    nombre: opcionDto.nombre,
                    es_multiple: opcionDto.es_multiple,
                });
                const savedOpcion = await queryRunner.manager.save(nuevaOpcion);
                if (opcionDto.valores) {
                    for (const valorDto of opcionDto.valores) {
                        const nuevoValor = queryRunner.manager.create(OpcionValor, {
                            configuracion_opcion_id: savedOpcion.id,
                            nombre: valorDto.nombre,
                        });
                        const savedValor = await queryRunner.manager.save(nuevoValor);
                        await this.sincronizarRelacionesDeValor(savedValor.id, valorDto, queryRunner, establecimientoId);
                    }
                }
            }
        }

        await queryRunner.commitTransaction();
          return (await this.findOneConfigurableWithRelations(id, establecimientoId))!; 
    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
}

public async removeConfigurable(id: string, establecimientoId: string): Promise<DeleteResult> {
    const producto = await this.productoConfigurableRepository.findOne({ where: { id, establecimiento_id: establecimientoId } });

    if (!producto) {
        throw new NotFoundException(`Producto configurable con ID "${id}" no encontrado.`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const opciones = await queryRunner.manager.find(ConfiguracionOpcion, { where: { producto_configurable_id: id } });
        for (const opcion of opciones) {
            await this.removeConfiguracionOpcion(opcion.id, queryRunner);
        }
        const result = await queryRunner.manager.delete(ProductoConfigurableEntity, id);     
        await queryRunner.commitTransaction();
        return result;
    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
    } finally {
        await queryRunner.release();
    }
}


  public async processExcel(fileBuffer: Buffer, establecimientoId: string) {
    const workSheetsFromBuffer = xlsx.parse(fileBuffer);
    const getSheetByName = (name: string) => workSheetsFromBuffer.find(sheet => sheet.name === name);

    const productosSheet = getSheetByName('Productos');
    const recetasSheet = getSheetByName('Recetas');
    const configurablesSheet = getSheetByName('Configurables');
    const opcionesSheet = getSheetByName('Opciones');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    const errors: { tipo: string; fila: number; error: string }[] = [];
    const createdProductMap = new Map<string, ProductoEntity | ProductoConfigurableEntity>();
    const categoriaCache = new Map<string, CategoriaEntity>();
    const opcionCache = new Map<string, ConfiguracionOpcion>();
    const opcionValorCache = new Map<string, OpcionValor>();

    const convertToJson = (sheet) => {
      if (!sheet || !sheet.data || sheet.data.length === 0) {
        return [];
      }
      const headers = sheet.data[0];
      const data = sheet.data.slice(1);
      return data.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] !== undefined ? row[index] : null;
        });
        return obj;
      });
    };

    try {
      await queryRunner.startTransaction();

      if (!productosSheet || !recetasSheet) {
        throw new BadRequestException('El archivo debe contener las hojas "Productos" y "Recetas".');
      }
      const productosData = convertToJson(productosSheet).filter(row => row.nombre?.toString().trim() !== '');
      const recetasData = convertToJson(recetasSheet).filter(row => row.nombre_producto?.toString().trim() !== '');
      const configurablesData = configurablesSheet ? convertToJson(configurablesSheet).filter(row => row.nombre?.toString().trim() !== '') : [];
      const opcionesData = opcionesSheet ? convertToJson(opcionesSheet).filter(row => row.nombre_producto_configurable?.toString().trim() !== '') : [];

      const categoriasEnExcel: string[] = [...new Set(
        [...productosData.map((p: any) => p.categoria_nombre), ...configurablesData.map((p: any) => p.categoria_nombre)]
      )].filter(nombre => nombre);

      for (const nombre of categoriasEnExcel) {
        let categoria = await queryRunner.manager.findOne(CategoriaEntity, {
          where: { nombre, establecimiento_id: establecimientoId }
        });
        if (!categoria) {
          categoria = queryRunner.manager.create(CategoriaEntity, { nombre, establecimiento_id: establecimientoId });
          categoria = await queryRunner.manager.save(categoria);
        }
        categoriaCache.set(nombre, categoria);
      }

      const requiredSimpleHeaders = ['nombre', 'precio', 'categoria_nombre', 'descripcion'];
      const simpleHeaders = productosData.length > 0 ? Object.keys(productosData[0] as object) : [];
      const missingSimpleHeaders = requiredSimpleHeaders.filter(header => !simpleHeaders.includes(header));
      if (missingSimpleHeaders.length > 0) {
        throw new BadRequestException(`La hoja "Productos" debe contener las columnas: ${requiredSimpleHeaders.join(', ')}. Faltan: ${missingSimpleHeaders.join(', ')}`);
      }

      for (const [index, row] of productosData.entries()) {
        const rowNumber = index + 2;
        try {
          const { nombre, precio, categoria_nombre, descripcion, imagen_url, iva, ic, inc } = row as any;
          if (!nombre) throw new BadRequestException('El nombre del producto simple es obligatorio.');
          if (precio === null || precio === undefined) throw new BadRequestException('El precio del producto simple es obligatorio.');
          if (isNaN(Number(precio)) || Number(precio) < 0) throw new BadRequestException('El precio del producto simple debe ser un número positivo.');
          if (!categoria_nombre) throw new BadRequestException('El nombre de la categoría es obligatorio para productos simples.');

          const categoria = categoriaCache.get(categoria_nombre);
          if (!categoria) {
            throw new BadRequestException(`Categoría "${categoria_nombre}" no encontrada en la hoja de productos.`);
          }
          let producto = await queryRunner.manager.findOne(ProductoEntity, {
            where: { nombre, establecimiento_id: establecimientoId }
          });
          if (producto) {
            await queryRunner.manager.update(ProductoEntity, producto.id, {
              precio: Number(precio),
              categoria_id: categoria.id,
              descripcion,
              imagen_url,
              iva: iva !== undefined ? Boolean(iva) : producto.iva,
              ic: ic !== undefined ? Boolean(ic) : producto.ic,
              inc: inc !== undefined ? Boolean(inc) : producto.inc,
              updated_at: new Date(),
            });
            producto = (await queryRunner.manager.findOneBy(ProductoEntity, { id: producto.id }))!;
          } else {
            producto = queryRunner.manager.create(ProductoEntity, {
              nombre,
              precio: Number(precio),
              categoria_id: categoria.id,
              establecimiento_id: establecimientoId,
              descripcion,
              imagen_url,
              iva: Boolean(iva),
              ic: Boolean(ic),
              inc: Boolean(inc),
            });
            producto = await queryRunner.manager.save(producto);
          }
          createdProductMap.set(nombre.trim().toLowerCase(), producto);
        } catch (error) {
          errors.push({ tipo: 'producto', fila: rowNumber, error: error.message });
        }
      }

      if (configurablesData.length > 0) {
        const requiredConfigurableHeaders = ['nombre', 'precio_base', 'categoria_nombre', 'descripcion'];
        const configurableHeaders = Object.keys(configurablesData[0] as object);
        const missingConfigurableHeaders = requiredConfigurableHeaders.filter(header => !configurableHeaders.includes(header));
        if (missingConfigurableHeaders.length > 0) {
          throw new BadRequestException(`La hoja "Configurables" debe contener las columnas: ${requiredConfigurableHeaders.join(', ')}. Faltan: ${missingConfigurableHeaders.join(', ')}`);
        }
        for (const [index, row] of configurablesData.entries()) {
          const rowNumber = index + 2;
          try {
            const { nombre, precio_base, categoria_nombre, descripcion, imagen_url, iva, ic, inc } = row as any;

            const isIva = iva?.toString().toUpperCase() === 'SI';
            const isIc = ic?.toString().toUpperCase() === 'SI';
            const isInc = inc?.toString().toUpperCase() === 'SI';

            if (!nombre) throw new BadRequestException('El nombre del producto configurable es obligatorio.');
            if (precio_base === null || precio_base === undefined) throw new BadRequestException('El precio base del producto configurable es obligatorio.');
            if (isNaN(Number(precio_base)) || Number(precio_base) < 0) throw new BadRequestException('El precio base del producto configurable debe ser un número positivo.');
            if (!categoria_nombre) throw new BadRequestException('El nombre de la categoría es obligatorio para productos configurables.');

            const categoria = categoriaCache.get(categoria_nombre);
            if (!categoria) {
              throw new BadRequestException(`Categoría "${categoria_nombre}" no encontrada en la hoja de configurables.`);
            }
            let producto = await queryRunner.manager.findOne(ProductoConfigurableEntity, {
              where: { nombre, establecimiento_id: establecimientoId }
            });

            if (producto) {
              await queryRunner.manager.update(ProductoConfigurableEntity, producto.id, {
                precio_base: Number(precio_base),
                categoria_id: categoria.id,
                descripcion,
                imagen_url,
                iva: isIva,
                ic: isIc,
                inc: isInc,
                updated_at: new Date(),
              });
              producto = (await queryRunner.manager.findOneBy(ProductoConfigurableEntity, { id: producto.id }))!;
            } else {
              producto = queryRunner.manager.create(ProductoConfigurableEntity, {
                nombre,
                precio_base: Number(precio_base),
                categoria_id: categoria.id,
                establecimiento_id: establecimientoId,
                descripcion,
                imagen_url,
                iva: isIva,
                ic: isIc,
                inc: isInc,
              });
              producto = await queryRunner.manager.save(producto);
            }
            createdProductMap.set(nombre.trim().toLowerCase(), producto);
          } catch (error) {
            errors.push({ tipo: 'configurable', fila: rowNumber, error: error.message });
          }
        }
      }

      const requiredRecetaHeaders = ['nombre_producto', 'nombre_ingrediente', 'cantidad_necesaria'];
      const recetaHeaders = recetasData.length > 0 ? Object.keys(recetasData[0] as object) : [];
      const missingRecetaHeaders = requiredRecetaHeaders.filter(header => !recetaHeaders.includes(header));
      if (missingRecetaHeaders.length > 0) {
        throw new BadRequestException(`La hoja "Recetas" debe contener las columnas: ${requiredRecetaHeaders.join(', ')}. Faltan: ${missingRecetaHeaders.join(', ')}`);
      }

      const simpleProductIdsForRecetas = [...createdProductMap.values()]
        .filter((p): p is ProductoEntity => p instanceof ProductoEntity)
        .map(p => p.id);

      if (simpleProductIdsForRecetas.length > 0) {
        await queryRunner.manager.delete(RecetaProductoEntity, {
          producto_id: In(simpleProductIdsForRecetas)
        });
      }

      for (const [index, row] of recetasData.entries()) {
        const rowNumber = index + 2;
        try {
          const { nombre_producto, nombre_ingrediente, cantidad_necesaria } = row as any;
          if (!nombre_producto) throw new BadRequestException('El nombre del producto es obligatorio en la receta.');
          if (!nombre_ingrediente) throw new BadRequestException('El nombre del ingrediente es obligatorio en la receta.');
          if (cantidad_necesaria === undefined || cantidad_necesaria === null) throw new BadRequestException('La cantidad necesaria es obligatoria en la receta.');
          if (isNaN(Number(cantidad_necesaria)) || Number(cantidad_necesaria) <= 0) throw new BadRequestException('La cantidad necesaria debe ser un número positivo.');

          const producto = createdProductMap.get(nombre_producto.trim().toLowerCase());
          if (!producto || !(producto instanceof ProductoEntity)) {
            throw new NotFoundException(`Producto simple "${nombre_producto}" no encontrado o no es un producto simple.`);
          }

          const normalizedNombreIngrediente = normalizeIngredientName(nombre_ingrediente);
          const ingredienteExistente = await this.ingredientesService.findByName(normalizedNombreIngrediente, establecimientoId);

          if (!ingredienteExistente) {
            throw new NotFoundException(`Ingrediente "${nombre_ingrediente}" no encontrado.`);
          }

          const recetaItem = queryRunner.manager.create(RecetaProductoEntity, {
            producto_id: producto.id,
            ingrediente_id: ingredienteExistente.id,
            cantidad_necesaria: Number(cantidad_necesaria),
          });
          await queryRunner.manager.save(recetaItem);
        } catch (error) {
          errors.push({ tipo: 'receta', fila: rowNumber, error: error.message });
        }
      }
      if (opcionesData.length > 0) {
        const requiredOpcionesHeaders = ['nombre_producto_configurable', 'nombre_opcion', 'es_multiple', 'nombre_valor', 'precio_adicional', 'nombre_ingrediente', 'cantidad_necesaria'];
        const opcionesHeaders = Object.keys(opcionesData[0] as object);
        const missingOpcionesHeaders = requiredOpcionesHeaders.filter(header => !opcionesHeaders.includes(header));
        if (missingOpcionesHeaders.length > 0) {
          throw new BadRequestException(`La hoja "Opciones" debe contener las columnas: ${requiredOpcionesHeaders.join(', ')}. Faltan: ${missingOpcionesHeaders.join(', ')}`);
        }
        const productosConfigurablesIds = [...createdProductMap.values()]
          .filter((p): p is ProductoConfigurableEntity => p instanceof ProductoConfigurableEntity)
          .map(p => p.id);
        if (productosConfigurablesIds.length > 0) {
          await queryRunner.manager.delete(OpcionValorIngrediente, {
            opcion_valor: {
              configuracion_opcion: {
                producto_configurable_id: In(productosConfigurablesIds)
              }
            }
          });
          await queryRunner.manager.delete(OpcionValorPrecio, {
            opcion_valor: {
              configuracion_opcion: {
                producto_configurable_id: In(productosConfigurablesIds)
              }
            }
          });
          await queryRunner.manager.delete(OpcionValor, {
            configuracion_opcion: {
              producto_configurable_id: In(productosConfigurablesIds)
            }
          });
          await queryRunner.manager.delete(ConfiguracionOpcion, { producto_configurable_id: In(productosConfigurablesIds) });
        }

        for (const [index, row] of opcionesData.entries()) {
          const rowNumber = index + 2;
          try {
            const { nombre_producto_configurable, nombre_opcion, es_multiple, nombre_valor, precio_adicional, nombre_ingrediente, cantidad_necesaria } = row as any;
            if (!nombre_producto_configurable) throw new BadRequestException('El nombre del producto configurable es obligatorio en la hoja Opciones.');
            if (!nombre_opcion) throw new BadRequestException('El nombre de la opción es obligatorio en la hoja Opciones.');
            if (!nombre_valor) throw new BadRequestException('El nombre del valor es obligatorio en la hoja Opciones.');

            const productoConfigurable = createdProductMap.get(nombre_producto_configurable.trim().toLowerCase());
            if (!productoConfigurable || !(productoConfigurable instanceof ProductoConfigurableEntity)) {
              throw new NotFoundException(`Producto configurable "${nombre_producto_configurable}" no encontrado.`);
            }
            const opcionCacheKey = `${productoConfigurable.id}-${nombre_opcion.trim().toLowerCase()}`;
            let opcion = opcionCache.get(opcionCacheKey);
            if (!opcion) {
              opcion = queryRunner.manager.create(ConfiguracionOpcion, {
                producto_configurable_id: productoConfigurable.id,
                nombre: nombre_opcion,
                es_multiple: es_multiple === true || es_multiple === 'true' || es_multiple === '1',
              });
              opcion = await queryRunner.manager.save(opcion);
              opcionCache.set(opcionCacheKey, opcion);
            }

            const valorCacheKey = `${opcion.id}-${nombre_valor.trim().toLowerCase()}`;
            let valor = opcionValorCache.get(valorCacheKey);

            if (!valor) {
              valor = queryRunner.manager.create(OpcionValor, {
                configuracion_opcion_id: opcion.id,
                nombre: nombre_valor,
              });
              valor = await queryRunner.manager.save(valor);
              opcionValorCache.set(valorCacheKey, valor);
            }

            if (precio_adicional !== undefined && precio_adicional !== null) {
              if (isNaN(Number(precio_adicional)) || Number(precio_adicional) < 0) throw new BadRequestException('El precio adicional debe ser un número positivo.');
              const precio = queryRunner.manager.create(OpcionValorPrecio, {
                opcion_valor_id: valor.id,
                precio: Number(precio_adicional),
              });
              await queryRunner.manager.save(precio);
            }
            if (nombre_ingrediente && cantidad_necesaria !== undefined && cantidad_necesaria !== null) {
              if (isNaN(Number(cantidad_necesaria)) || Number(cantidad_necesaria) <= 0) throw new BadRequestException('La cantidad necesaria para la opción debe ser un número positivo.');
              const normalizedNombreIngrediente = normalizeIngredientName(nombre_ingrediente);
              const ingredienteExistente = await this.ingredientesService.findByName(normalizedNombreIngrediente, establecimientoId);
              if (!ingredienteExistente) {
                throw new NotFoundException(`Ingrediente "${nombre_ingrediente}" no encontrado para la opción.`);
              }
              const recetaItem = queryRunner.manager.create(OpcionValorIngrediente, {
                opcion_valor_id: valor.id,
                ingrediente_id: ingredienteExistente.id,
                cantidad: Number(cantidad_necesaria),
              });
              await queryRunner.manager.save(recetaItem);
            }
          } catch (error) {
            errors.push({ tipo: 'opcion', fila: rowNumber, error: error.message });
          }
        }
      }

      if (errors.length > 0) {
        await queryRunner.rollbackTransaction();
        throw new BadRequestException({
          message: 'Ocurrieron errores al procesar el archivo. Ningún cambio ha sido guardado.',
          errors,
        });
      }
      await queryRunner.commitTransaction();
      return { message: 'Archivo procesado exitosamente.' };

    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
