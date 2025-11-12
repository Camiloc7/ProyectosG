import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsNumber, IsDate, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ItemFacturaDto {
  @ApiProperty({ description: 'ID del ítem de factura', example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ description: 'ID de la factura a la que pertenece el ítem', example: 101 })
  @IsInt()
  factura_id: number;

  @ApiPropertyOptional({ description: 'Descripción del ítem', example: 'Servicios de Consultoría' })
  @IsOptional()
  @IsString()
  descripcion: string | null;

  @ApiPropertyOptional({ description: 'Cantidad del ítem', example: 1.0 })
  @IsOptional()
  @IsNumber()
  cantidad: number | null;

  @ApiPropertyOptional({ description: 'Valor unitario del ítem', example: 100000.0 })
  @IsOptional()
  @IsNumber()
  valor_unitario: number | null;

  @ApiPropertyOptional({ description: 'Valor total del ítem', example: 100000.0 })
  @IsOptional()
  @IsNumber()
  valor_total: number | null;
}

import { SupplierCategory } from '../../suppliers/entities/supplier-category.entity';

export class FacturaDto {
  @ApiProperty({ description: 'ID único de la factura', example: 1 })
  @IsInt()
  id: number;

  @ApiProperty({ description: 'Fecha y hora de procesamiento de la factura', example: '2023-01-15T10:30:00Z' })
  @IsDate()
  @Type(() => Date)
  procesado_en: Date;

  @ApiPropertyOptional({ description: 'Ruta del archivo original de la factura', example: '/path/to/invoice.zip' })
  @IsOptional()
  @IsString()
  ruta_archivo_original: string | null;

  @ApiPropertyOptional({ description: 'Asunto del correo electrónico asociado', example: 'Factura Electrónica Nro. F001' })
  @IsOptional()
  @IsString()
  asunto_correo: string | null;

  @ApiPropertyOptional({ description: 'Remitente del correo electrónico', example: 'facturacion@proveedor.com' })
  @IsOptional()
  @IsString()
  remitente_correo: string | null;

  @ApiPropertyOptional({ description: 'Correo electrónico del cliente asociado', example: 'cliente@tuempresa.com' })
  @IsOptional()
  @IsString()
  correo_cliente_asociado: string | null;

  @ApiPropertyOptional({ description: 'CUFE de la factura', example: 'a1b2c3d4e5f6...' })
  @IsOptional()
  @IsString()
  cufe: string | null;

  @ApiPropertyOptional({ description: 'Número de la factura', example: 'F001' })
  @IsOptional()
  @IsString()
  numero_factura: string | null;

  @ApiPropertyOptional({ description: 'Fecha de emisión de la factura', example: '2023-01-10' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha_emision: Date | null;

  @ApiPropertyOptional({ description: 'Hora de emisión de la factura', example: '14:30:00' })
  @IsOptional()
  @IsString()
  hora_emision: string | null;

  @ApiPropertyOptional({ description: 'Monto subtotal de la factura', example: 100000.0 })
  @IsOptional()
  @IsNumber()
  monto_subtotal: number | null;

  @ApiPropertyOptional({ description: 'Monto de impuesto de la factura', example: 19000.0 })
  @IsOptional()
  @IsNumber()
  monto_impuesto: number | null;

  @ApiPropertyOptional({ description: 'Monto total de la factura', example: 119000.0 })
  @IsOptional()
  @IsNumber()
  monto_total: number | null;

  @ApiPropertyOptional({ description: 'Moneda de la factura', example: 'COP' })
  @IsOptional()
  @IsString()
  moneda: string | null;

  @ApiPropertyOptional({ description: 'Nombre del proveedor', example: 'Empresa XYZ' })
  @IsOptional()
  @IsString()
  nombre_proveedor: string | null;

  @ApiPropertyOptional({ description: 'NIT del proveedor', example: '900123456' })
  @IsOptional()
  @IsString()
  nit_proveedor: string | null;

  @ApiPropertyOptional({ description: 'Email del proveedor', example: 'info@xyz.com' })
  @IsOptional()
  @IsString()
  email_proveedor: string | null;

  @ApiPropertyOptional({ description: 'Nombre del cliente', example: 'Tu Empresa' })
  @IsOptional()
  @IsString()
  nombre_cliente: string | null;

  @ApiPropertyOptional({ description: 'NIT del cliente', example: '800987654' })
  @IsOptional()
  @IsString()
  nit_cliente: string | null;

  @ApiPropertyOptional({ description: 'Fecha de vencimiento de la factura', example: '2023-02-10' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fecha_vencimiento: Date | null;

  @ApiPropertyOptional({ description: 'Método de pago de la factura', example: 'Crédito' })
  @IsOptional()
  @IsString()
  metodo_pago: string | null;

  @ApiPropertyOptional({ description: 'Contenido XML crudo de la factura' })
  @IsOptional()
  @IsString()
  texto_crudo_xml: string | null;

  @ApiPropertyOptional({ description: 'Tipo de documento Dian', example: 'Por revisar' })
  @IsOptional()
  @IsString()
  tipo_documento_dian: string | null;

  @ApiPropertyOptional({ description: 'Indica si la factura fue revisada manualmente', example: false })
  @IsOptional()
  @IsBoolean()
  revisada_manualmente: boolean;

  @ApiPropertyOptional({ description: 'ID del usuario asociado a la factura', example: 1 })
  @IsOptional()
  @IsInt()
  usuario_id: number | null;

  @ApiProperty({ type: [ItemFacturaDto], description: 'Lista de ítems de la factura' })
  @ValidateNested({ each: true })
  @Type(() => ItemFacturaDto)
  items: ItemFacturaDto[];

  @ApiPropertyOptional({ type: SupplierCategory, description: 'Categoría del proveedor (desde NestJS)' })
  @IsOptional()
  @Type(() => SupplierCategory) 
  supplierCategory?: SupplierCategory | null; 
}