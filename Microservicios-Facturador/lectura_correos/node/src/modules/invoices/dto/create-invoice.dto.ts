import { Type } from 'class-transformer';
import {
    IsString,
    IsNumber,
    IsDateString,
    IsBoolean,
    IsOptional,
    IsUUID,
    IsBase64,
    IsArray,
    ValidateNested,
  } from 'class-validator';
import { ItemFacturaDto } from './invoice.dto';
  
  export class CreateInvoiceDto {
    @IsOptional()
    @IsString()
    cufe?: string; 
    
    @IsOptional()
    @IsString()
    numero_factura?: string; 

    @IsOptional()
    @IsDateString()
    fecha_emision?: string; 
  
    @IsOptional()
    @IsString()
    hora_emision?: string;
  
    @IsOptional()
    @IsNumber()
    monto_subtotal?: number;
  
    @IsOptional()
    @IsNumber()
    monto_impuesto?: number;
  
    @IsOptional()
    @IsNumber()
    monto_total?: number;
  
    @IsOptional()
    @IsString()
    moneda?: string;
  
    @IsOptional()
    @IsString()
    nombre_proveedor: string;
  
    @IsString()
    nit_proveedor: string; 
  
    @IsOptional()
    @IsString()
    email_proveedor?: string;
  
    @IsOptional()
    @IsString()
    nombre_cliente?: string;
  
    @IsOptional()
    @IsString()
    nit_cliente?: string;
  
    @IsOptional()
    @IsDateString()
    fecha_vencimiento?: string;
  
    @IsOptional()
    @IsString()
    metodo_pago?: string;
  
    @IsOptional()
    @IsString()
    texto_crudo_xml?: string;

    @IsOptional()
    @IsString()
    @IsBase64() 
    contenido_pdf_binario?: string; 
  
    @IsOptional()
    @IsString()
    tipo_documento_dian?: string; 

    @IsOptional()
    @IsBoolean()
    revisada_manualmente?: boolean;
  
    @IsOptional()
    @IsString()
    ruta_archivo_original?: string;
  
    @IsOptional()
    @IsString()
    asunto_correo?: string;
  
    @IsOptional()
    @IsString()
    remitente_correo?: string;
  
    @IsOptional()
    @IsString()
    correo_cliente_asociado?: string;
  
    @IsOptional()
    @IsNumber()
    usuario_id?: number;
  
    @IsUUID('4')
    @IsOptional() 
    proveedor_id?: string;
  
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true }) 
    @Type(() =>   ItemFacturaDto ) 
    items?:   ItemFacturaDto [];
  }
