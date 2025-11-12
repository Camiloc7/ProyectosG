import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, EntityManager } from 'typeorm';
import { EstablecimientosService } from '../establecimientos/establecimientos.service';
import { IngredienteEntity } from './entities/ingrediente.entity';
import { CreateIngredienteDto } from './dto/create-ingrediente.dto';
import { UpdateIngredienteDto } from './dto/update-ingrediente.dto';
import { normalizeIngredientName } from 'src/common/utils/normalization.utils';
import * as xlsx from 'node-xlsx';

const MASS_UNITS_TO_GRAMS = {
  'miligramos': 0.001,
  'gramos': 1,
  'kilogramos': 1000,
  'libras': 453.592,
  'onzas': 28.3495,
  'pizca': 0.5,
  'cucharadita': 5,
  'cucharada': 15,
  'taza': 240,
};
const VOLUME_UNITS_TO_MILLILITERS = {
  'mililitros': 1,
  'litros': 1000,
  'galones': 3785.41,
  'onzas_liquidas': 29.5735,
  'cucharadita_liquida': 5,
  'cucharada_liquida': 15,
  'taza_liquida': 240,
};
const COUNT_UNITS_TO_UNITS = {
  'unidades': 1,
  'piezas': 1,
  'paquetes': 1,
  'cajas': 1,
  'botellas': 1,
  'latas': 1,
  'sacos': 1,
  'bultos': 1,
  'bolsas': 1,
  'atados': 1,
};
type UnitCategory = 'mass' | 'volume' | 'count';
@Injectable()
export class IngredientesService {
  constructor(
    @InjectRepository(IngredienteEntity)
    private readonly ingredienteRepository: Repository<IngredienteEntity>,
    private readonly establecimientosService: EstablecimientosService,
  ) { }
  /**
   * Redondea un número a un número específico de decimales para evitar problemas de precisión.
   * @param value El número a redondear.
   * @param decimals El número de decimales.
   * @returns El valor redondeado.
   */
  private round(value: number, decimals: number): number {
    if (isNaN(value)) return 0;
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
  private getUnitCategory(unit: string): UnitCategory | null {
    if (MASS_UNITS_TO_GRAMS.hasOwnProperty(unit)) return 'mass';
    if (VOLUME_UNITS_TO_MILLILITERS.hasOwnProperty(unit)) return 'volume';
    if (COUNT_UNITS_TO_UNITS.hasOwnProperty(unit)) return 'count';
    return null;
  }
  public convertQuantityAndCost(
    quantity: number,
    costPerUnit: number,
    fromUnit: string,
    toUnit: string,
    volumenPorUnidad?: number,
  ): { convertedQuantity: number; convertedCostPerUnit: number } {
    if (fromUnit === toUnit) {
      return { convertedQuantity: quantity, convertedCostPerUnit: costPerUnit };
    }
    const fromCategory = this.getUnitCategory(fromUnit);
    const toCategory = this.getUnitCategory(toUnit);
    if (fromCategory === 'count' && toCategory === 'volume' && volumenPorUnidad) {
      const quantityInBaseUnit = quantity * volumenPorUnidad;
      const totalCost = quantity * costPerUnit;
      const costPerBaseUnit = totalCost / quantityInBaseUnit;
      const convertedQuantity = quantityInBaseUnit / VOLUME_UNITS_TO_MILLILITERS[toUnit];
      const convertedCostPerUnit = costPerBaseUnit * VOLUME_UNITS_TO_MILLILITERS[toUnit];
      return {
        convertedQuantity: this.round(convertedQuantity, 6),
        convertedCostPerUnit: this.round(convertedCostPerUnit, 6),
      };
    }
    if (fromCategory !== toCategory || fromCategory === null) {
      throw new BadRequestException(`No se puede convertir de "${fromUnit}" a "${toUnit}". Las unidades no son compatibles o no están definidas.`);
    }
    let fromFactorToBase: number;
    let toFactorToBase: number;
    switch (fromCategory) {
      case 'mass':
        fromFactorToBase = MASS_UNITS_TO_GRAMS[fromUnit];
        toFactorToBase = MASS_UNITS_TO_GRAMS[toUnit];
        break;
      case 'volume':
        fromFactorToBase = VOLUME_UNITS_TO_MILLILITERS[fromUnit];
        toFactorToBase = VOLUME_UNITS_TO_MILLILITERS[toUnit];
        break;
      case 'count':
        fromFactorToBase = COUNT_UNITS_TO_UNITS[fromUnit];
        toFactorToBase = COUNT_UNITS_TO_UNITS[toUnit];
        break;
      default:
        throw new BadRequestException(`Tipo de unidad desconocido para "${fromUnit}" o "${toUnit}".`);
    }
    if (!fromFactorToBase || !toFactorToBase) {
      throw new BadRequestException(`Factor de conversión no encontrado para "${fromUnit}" o "${toUnit}".`);
    }
    const quantityInBaseUnit = quantity * fromFactorToBase;
    const convertedQuantity = quantityInBaseUnit / toFactorToBase;
    const costPerBaseUnit = costPerUnit / fromFactorToBase;
    const convertedCostPerUnit = costPerBaseUnit * toFactorToBase;
    return {
      convertedQuantity: this.round(convertedQuantity, 6),
      convertedCostPerUnit: this.round(convertedCostPerUnit, 6),
    };
  }
  public async create(createIngredienteDto: CreateIngredienteDto): Promise<IngredienteEntity> {
    const { establecimiento_id, nombre, ...rest } = createIngredienteDto;
    const normalizedNombre = normalizeIngredientName(nombre);
    const establecimiento = await this.establecimientosService.findOne(establecimiento_id!);
    if (!establecimiento) {
      throw new NotFoundException(`Establecimiento con ID "${establecimiento_id}" no encontrado.`);
    }
    const existingIngrediente = await this.ingredienteRepository.findOneBy({ establecimiento_id, nombre: normalizedNombre });
    if (existingIngrediente) {
      throw new ConflictException(`El ingrediente con nombre "${normalizedNombre}" ya existe en el establecimiento "${establecimiento_id}".`);
    }
    if (rest.unidad_medida === 'unidades' && rest.volumen_por_unidad === undefined) {
      throw new BadRequestException('Para unidades de medida tipo "unidades", el volumen_por_unidad es obligatorio.');
    }
    const ingrediente = this.ingredienteRepository.create({
      ...rest,
      establecimiento_id,
      nombre: normalizedNombre,
    });
    return await this.ingredienteRepository.save(ingrediente);
  }
  public async findAll(establecimientoId: string): Promise<IngredienteEntity[]> {
    return await this.ingredienteRepository.find({
      where: { establecimiento_id: establecimientoId },
      order: { nombre: 'ASC' },
      relations: ['establecimiento'],
    });
  }
  public async findOne(id: string, establecimientoId?: string): Promise<IngredienteEntity | null> {
    const whereCondition: any = { id };
    if (establecimientoId) {
      whereCondition.establecimiento_id = establecimientoId;
    }
    const ingrediente = await this.ingredienteRepository.findOne({
      where: whereCondition,
      relations: ['establecimiento'],
    });
    return ingrediente;
  }
  async findByName(nombre: string, establecimientoId: string): Promise<IngredienteEntity | null> {
    const normalizedNombre = normalizeIngredientName(nombre);
    const establecimiento = await this.establecimientosService.findOne(establecimientoId);
    if (!establecimiento) {
      return null;
    }
    return await this.ingredienteRepository.findOne({
      where: { nombre: normalizedNombre, establecimiento_id: establecimientoId },
    });
  }
  public async update(id: string, updateIngredienteDto: UpdateIngredienteDto, establecimientoId?: string): Promise<IngredienteEntity> {
    const ingrediente = await this.findOne(id, establecimientoId);
    if (!ingrediente) {
      throw new NotFoundException(`Ingrediente con ID "${id}" no encontrado.`);
    }
    if (updateIngredienteDto.nombre) {
      const normalizedNombre = normalizeIngredientName(updateIngredienteDto.nombre);
      updateIngredienteDto.nombre = normalizedNombre;
    }
    if (updateIngredienteDto.nombre && updateIngredienteDto.nombre !== ingrediente.nombre) {
      const existingIngrediente = await this.ingredienteRepository.findOneBy({
        establecimiento_id: ingrediente.establecimiento_id,
        nombre: updateIngredienteDto.nombre,
      });
      if (existingIngrediente && existingIngrediente.id !== id) {
        throw new ConflictException(`El ingrediente con nombre "${updateIngredienteDto.nombre}" ya existe en el establecimiento "${ingrediente.establecimiento_id}".`);
      }
    }
    if (updateIngredienteDto.unidad_medida && updateIngredienteDto.unidad_medida === 'unidades' && updateIngredienteDto.volumen_por_unidad === undefined && ingrediente.volumen_por_unidad === undefined) {
      throw new BadRequestException('Para unidades de medida tipo "unidades", el volumen_por_unidad es obligatorio al actualizar si no estaba definido.');
    }
    Object.assign(ingrediente, updateIngredienteDto);
    return await this.ingredienteRepository.save(ingrediente);
  }
  public async remove(id: string, establecimientoId?: string): Promise<DeleteResult> {
    const ingrediente = await this.findOne(id, establecimientoId);
    if (!ingrediente) {
      throw new NotFoundException(`Ingrediente con ID "${id}" no encontrado para eliminar.`);
    }
    const result = await this.ingredienteRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Ingrediente con ID "${id}" no encontrado para eliminar.`);
    }
    return result;
  }
  public async updateStock(id: string, cantidad: number, establecimientoId: string): Promise<IngredienteEntity> {
    const ingrediente = await this.findOne(id, establecimientoId);
    if (!ingrediente) {
      throw new NotFoundException(`Ingrediente con ID "${id}" no encontrado para actualizar stock.`);
    }

    const newStock = this.round(ingrediente.stock_actual + cantidad, 6);
    if (newStock < 0) {
      throw new BadRequestException(`No hay suficiente stock para ajustar ${cantidad} de ${ingrediente.nombre}. Stock actual: ${ingrediente.stock_actual}.`);
    }

    ingrediente.stock_actual = newStock;
    return await this.ingredienteRepository.save(ingrediente);
  }
  public async addStockAndCostFromPurchase(
    ingredienteId: string,
    establecimientoId: string,
    cantidadComprada: number,
    unidadMedidaCompra: string,
    costoUnitarioCompra: number,
    fechaCompra: Date,
  ): Promise<IngredienteEntity> {
    const ingrediente = await this.findOne(ingredienteId, establecimientoId);
    if (!ingrediente) {
      throw new NotFoundException(`Ingrediente con ID "${ingredienteId}" no encontrado para actualizar stock desde compra.`);
    }
    const cantidadCompradaNumerica = Number(cantidadComprada);
    const costoUnitarioCompraNumerico = Number(costoUnitarioCompra);
    const { convertedQuantity, convertedCostPerUnit } = this.convertQuantityAndCost(
      cantidadCompradaNumerica,
      costoUnitarioCompraNumerico,
      unidadMedidaCompra,
      ingrediente.unidad_medida,
      ingrediente.volumen_por_unidad,
    );
    const valorTotalActual = this.round(ingrediente.stock_actual * ingrediente.costo_unitario, 6);
    const valorNuevaCompra = this.round(convertedQuantity * convertedCostPerUnit, 6);
    const nuevoStockTotal = this.round(Number(ingrediente.stock_actual) + Number(convertedQuantity), 6);
    if (nuevoStockTotal > 0) {
      ingrediente.costo_unitario = this.round((valorTotalActual + valorNuevaCompra) / nuevoStockTotal, 6);
    } else {
      ingrediente.costo_unitario = convertedCostPerUnit;
    }
    ingrediente.stock_actual = nuevoStockTotal;
    ingrediente.fecha_ultima_compra = fechaCompra;
    ingrediente.cantidad_ultima_compra = convertedQuantity;
    return await this.ingredienteRepository.save(ingrediente);
  }
  public async processExcelFile(fileBuffer: Buffer, establecimientoId: string) {
    const workSheetsFromBuffer = xlsx.parse(fileBuffer);
    const firstWorkSheet = workSheetsFromBuffer[0];
    if (!firstWorkSheet || !firstWorkSheet.data || firstWorkSheet.data.length < 2) {
      throw new BadRequestException('El archivo de Excel está vacío o no contiene datos válidos.');
    }
    const headers = firstWorkSheet.data[0];
    const rawIngredientesData = firstWorkSheet.data.slice(1);
    const ingredientesData = rawIngredientesData.filter(row => {
      return row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
    }).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    if (!ingredientesData || ingredientesData.length === 0) {
      throw new BadRequestException('El archivo de Excel está vacío o no contiene datos válidos.');
    }

    const requiredHeaders = ['nombre', 'unidad_medida', 'stock_actual', 'stock_minimo', 'costo_unitario', 'observaciones'];
    const firstRow = ingredientesData[0] as object;
    const currentHeaders = Object.keys(firstRow);
    const missingHeaders = requiredHeaders.filter(header => !currentHeaders.includes(header));
    if (missingHeaders.length > 0) {
      throw new BadRequestException(`El archivo de Excel debe contener las siguientes columnas: ${requiredHeaders.join(', ')}. Faltan: ${missingHeaders.join(', ')}`);
    }

    const processedIngredients: IngredienteEntity[] = [];
    const errors: { row: number; data: any; error: string }[] = [];
    for (let i = 0; i < ingredientesData.length; i++) {
      const row = ingredientesData[i] as any;
      const rowNumber = i + 2;

      try {
        const createIngredienteDto: CreateIngredienteDto = {
          nombre: normalizeIngredientName(row.nombre),
          unidad_medida: String(row.unidad_medida).toLowerCase().trim(),
          stock_actual: row.stock_actual !== undefined ? Number(row.stock_actual) : 0,
          stock_minimo: row.stock_minimo !== undefined ? Number(row.stock_minimo) : 0,
          costo_unitario: row.costo_unitario !== undefined ? Number(row.costo_unitario) : 0,
          observaciones: row.observaciones || null,
          establecimiento_id: establecimientoId,
          volumen_por_unidad: row.volumen_por_unidad !== undefined ? Number(row.volumen_por_unidad) : undefined,
        };
        if (isNaN(createIngredienteDto.costo_unitario) || createIngredienteDto.costo_unitario < 0) {
          throw new BadRequestException(`El costo unitario en la fila ${rowNumber} no es un número positivo válido.`);
        }

        const unitCategory = this.getUnitCategory(createIngredienteDto.unidad_medida);
        if (unitCategory === 'count' && createIngredienteDto.volumen_por_unidad === undefined) {
          throw new BadRequestException(`La unidad de medida de conteo "${createIngredienteDto.unidad_medida}" en la fila ${rowNumber} requiere un volumen por unidad.`);
        }

        const existingIngrediente = await this.findByName(createIngredienteDto.nombre, establecimientoId);

        if (existingIngrediente) {
          const updateIngredienteDto: UpdateIngredienteDto = {
            ...createIngredienteDto,
            nombre: existingIngrediente.nombre,
          };
          const updated = await this.update(existingIngrediente.id, updateIngredienteDto, establecimientoId);
          processedIngredients.push(updated);
        } else {
          const created = await this.create(createIngredienteDto);
          processedIngredients.push(created);
        }
      } catch (error) {
        errors.push({
          row: rowNumber,
          data: row,
          error: error.message,
        });
      }
    }
    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Algunos ingredientes no pudieron ser procesados.',
        errors,
      });
    }
    return { message: 'Ingredientes procesados exitosamente.', data: processedIngredients };
  }



public async reducirStockPorReceta(
    recetaConsolidada: { [ingredienteId: string]: number },
    cantidadPedido: number,
    entityManager: EntityManager, 
    establecimientoId: string
): Promise<void> {
    for (const ingredienteId in recetaConsolidada) {
        if (recetaConsolidada.hasOwnProperty(ingredienteId)) {
            const cantidadNecesariaUnidad = Number(recetaConsolidada[ingredienteId]);
            const cantidadTotalRequerida = this.round(cantidadNecesariaUnidad * cantidadPedido, 6);

            const ingrediente = await entityManager.findOne(IngredienteEntity, {
                where: { id: ingredienteId, establecimiento_id: establecimientoId }
            });

            if (!ingrediente) {
                throw new NotFoundException(`Ingrediente con ID "${ingredienteId}" no encontrado.`);
            }

            const stockActual = Number(ingrediente.stock_actual);

            if (stockActual < cantidadTotalRequerida) {
                throw new BadRequestException(
                    `Stock insuficiente para el ingrediente "${ingrediente.nombre}". ` + 
                    `Requerido: ${cantidadTotalRequerida} ${ingrediente.unidad_medida}, ` + 
                    `Disponible: ${stockActual} ${ingrediente.unidad_medida}.`
                );
            }
            ingrediente.stock_actual = this.round(stockActual - cantidadTotalRequerida, 6);
            await entityManager.save(IngredienteEntity, ingrediente);
        }
    }
}

public async revertirStockPorReceta(
    recetaConsolidada: { [ingredienteId: string]: number },
    cantidadPedido: number,
    entityManager: EntityManager,
    establecimientoId: string
): Promise<void> {
    for (const ingredienteId in recetaConsolidada) {
        if (recetaConsolidada.hasOwnProperty(ingredienteId)) {
            const cantidadNecesariaUnidad = Number(recetaConsolidada[ingredienteId]);
            const cantidadTotalARevertir = this.round(cantidadNecesariaUnidad * cantidadPedido, 6);
            const ingrediente = await entityManager.findOne(IngredienteEntity, {
                where: { id: ingredienteId, establecimiento_id: establecimientoId }
            });

            if (!ingrediente) {
                console.warn(`[REVERTIR STOCK] Ingrediente con ID "${ingredienteId}" no encontrado.`);
                continue; 
            }
            const stockActual = Number(ingrediente.stock_actual);
            ingrediente.stock_actual = this.round(stockActual + cantidadTotalARevertir, 6);
            await entityManager.save(IngredienteEntity, ingrediente);
        }
    }
}
  public getAvailableUnits(): { [key: string]: Array<{ key: string; display: string }> } {
    return {
      'masa': [
        { key: 'miligramos', display: 'Miligramos' },
        { key: 'gramos', display: 'Gramos' },
        { key: 'kilogramos', display: 'Kilogramos' },
        { key: 'libras', display: 'Libras' },
        { key: 'onzas', display: 'Onzas' },
        { key: 'pizca', display: 'Pizca' },
        { key: 'cucharadita', display: 'Cucharadita (sólido)' },
        { key: 'cucharada', display: 'Cucharada (sólido)' },
        { key: 'taza', display: 'Taza (sólido)' },
      ],
      'volumen': [
        { key: 'mililitros', display: 'Mililitros' },
        { key: 'litros', display: 'Litros' },
        { key: 'galones', display: 'Galones' },
        { key: 'onzas_liquidas', display: 'Onzas Líquidas' },
        { key: 'cucharadita_liquida', display: 'Cucharadita (líquido)' },
        { key: 'cucharada_liquida', display: 'Cucharada (líquido)' },
        { key: 'taza_liquida', display: 'Taza (líquido)' },
      ],
      'conteo': [
        { key: 'unidades', display: 'Unidades' },
        { key: 'piezas', display: 'Piezas' },
        { key: 'paquetes', display: 'Paquetes' },
        { key: 'cajas', display: 'Cajas' },
        { key: 'botellas', display: 'Botellas' },
        { key: 'latas', display: 'Latas' },
        { key: 'sacos', display: 'Sacos' },
        { key: 'bultos', display: 'Bultos' },
        { key: 'bolsas', display: 'Bolsas' },
        { key: 'atados', display: 'Atados' },
      ],
    };
  }
}