import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { CompraIngredienteEntity } from './entities/compra-ingrediente.entity';
import { CreateCompraDto } from './dto/create-compra.dto';
import { UpdateCompraDto } from './dto/update-compra.dto';
import { IngredientesService } from '../ingredientes/ingredientes.service';
import { ProveedoresService } from '../proveedores/proveedores.service';

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(CompraIngredienteEntity)
    private readonly compraIngredienteRepository: Repository<CompraIngredienteEntity>,
    private readonly ingredientesService: IngredientesService,
    private readonly proveedoresService: ProveedoresService,
  ) {}

  /**
   * Registra una nueva compra de ingrediente y actualiza el stock y costo del ingrediente.
   * @param createCompraDto Datos de la compra.
   * @returns La compra de ingrediente registrada.
   * @throws NotFoundException Si el ingrediente o proveedor no existen.
   */
  public async create(createCompraDto: CreateCompraDto): Promise<CompraIngredienteEntity> {
    const { establecimiento_id, ingrediente_id, proveedor_id, cantidad_comprada, unidad_medida_compra, costo_unitario_compra, fecha_compra, numero_factura, notas } = createCompraDto;
    const ingrediente = await this.ingredientesService.findOne(ingrediente_id, establecimiento_id);
    if (!ingrediente) {
      throw new NotFoundException(`Ingrediente con ID "${ingrediente_id}" no encontrado en este establecimiento.`);
    }
    const proveedor = await this.proveedoresService.findOne(proveedor_id);
    if (!proveedor) {
      throw new NotFoundException(`Proveedor con ID "${proveedor_id}" no encontrado.`);
    }
    const costo_total = cantidad_comprada * costo_unitario_compra;
    const compra = this.compraIngredienteRepository.create({
      establecimiento_id,
      ingrediente_id,
      proveedor_id,
      cantidad_comprada,
      unidad_medida_compra,
      costo_unitario_compra,
      costo_total,
      fecha_compra: fecha_compra ? new Date(fecha_compra) : new Date(),
      numero_factura,
      notas,
    });

    const savedCompra = await this.compraIngredienteRepository.save(compra);
    await this.ingredientesService.addStockAndCostFromPurchase(
      ingrediente.id,
      ingrediente.establecimiento_id,
      cantidad_comprada,
      unidad_medida_compra, 
      costo_unitario_compra,
      savedCompra.fecha_compra,
    );

    return savedCompra;
  }

  /**
   * Obtiene todas las compras de ingredientes para un establecimiento, opcionalmente filtradas.
   * @param establecimientoId ID del establecimiento.
   * @param ingredienteId Opcional: filtra por ID de ingrediente.
   * @param proveedorId Opcional: filtra por ID de proveedor.
   * @returns Lista de compras de ingredientes.
   */
  public async findAll(
    establecimientoId: string,
    ingredienteId?: string,
    proveedorId?: string,
  ): Promise<CompraIngredienteEntity[]> {
    const whereCondition: any = { establecimiento_id: establecimientoId };
    if (ingredienteId) {
      whereCondition.ingrediente_id = ingredienteId;
    }
    if (proveedorId) {
      whereCondition.proveedor_id = proveedorId;
    }

    return await this.compraIngredienteRepository.find({
      where: whereCondition,
      relations: ['ingrediente', 'proveedor'],
      order: { fecha_compra: 'DESC' },
    });
  }

  /**
   * Obtiene una compra de ingrediente por su ID y establecimiento.
   * Retorna null si la compra no se encuentra, lo que es útil para la lógica del seeder.
   * @param id ID de la compra.
   * @param establecimientoId ID del establecimiento (para seguridad).
   * @returns La compra encontrada o null.
   */
  public async findOne(id: string, establecimientoId: string): Promise<CompraIngredienteEntity | null> {
    const compra = await this.compraIngredienteRepository.findOne({
      where: { id, establecimiento_id: establecimientoId },
      relations: ['ingrediente', 'proveedor'],
    });
    return compra;
  }



 /**
   * Actualiza una compra de ingrediente existente.
   * @param id ID de la compra a actualizar.
   * @param updateCompraDto Datos para actualizar la compra.
   * @param establecimientoId ID del establecimiento (para seguridad).
   * @returns La compra actualizada.
   * @throws NotFoundException Si la compra no se encuentra.
   */
  public async update(id: string, updateCompraDto: UpdateCompraDto, establecimientoId: string): Promise<CompraIngredienteEntity> {
    const compra = await this.findOne(id, establecimientoId);
    if (!compra) {
      throw new NotFoundException(`Compra de ingrediente con ID "${id}" no encontrada.`);
    }
    const originalCantidad = compra.cantidad_comprada;
    const originalCostoUnitario = compra.costo_unitario_compra;
    const originalUnidadMedida = compra.unidad_medida_compra;
    Object.assign(compra, updateCompraDto);
    compra.costo_total = compra.cantidad_comprada * compra.costo_unitario_compra;
    const updatedCompra = await this.compraIngredienteRepository.save(compra);

    const { convertedQuantity: oldConvertedQuantity } = this.ingredientesService.convertQuantityAndCost(
      originalCantidad,
      originalCostoUnitario,
      originalUnidadMedida,
      compra.ingrediente.unidad_medida,
      compra.ingrediente.volumen_por_unidad,
    );
    
    const { convertedQuantity: newConvertedQuantity } = this.ingredientesService.convertQuantityAndCost(
      compra.cantidad_comprada,
      compra.costo_unitario_compra,
      compra.unidad_medida_compra,
      compra.ingrediente.unidad_medida,
      compra.ingrediente.volumen_por_unidad,
    );

    const stockChange = newConvertedQuantity - oldConvertedQuantity;
    await this.ingredientesService.updateStock(compra.ingrediente.id, stockChange, establecimientoId);
    return updatedCompra;
  }




  /**
   * Elimina una compra de ingrediente.
   * @param id ID de la compra a eliminar.
   * @param establecimientoId ID del establecimiento (para seguridad).
   * @returns Resultado de la eliminación.
   * @throws NotFoundException Si la compra no se encuentra.
   */
  public async remove(id: string, establecimientoId: string): Promise<DeleteResult> {
    const compra = await this.findOne(id, establecimientoId);
    if (!compra) {
      throw new NotFoundException(`Compra de ingrediente con ID "${id}" no encontrada para eliminar.`);
    }
    const result = await this.compraIngredienteRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Compra de ingrediente con ID "${id}" no encontrada para eliminar.`);
    }
    return result;
  }
}

