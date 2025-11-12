import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Factura } from './entities/invoice.entity';
import { SuppliersService } from '../suppliers/suppliers.service';
import { SupplierCategory } from '../suppliers/entities/supplier-category.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Factura)
    private readonly facturaRepository: Repository<Factura>,
    private readonly suppliersService: SuppliersService,
  ) {}

  async findAllInvoices(tenantId: string): Promise<(Factura & { supplierCategory: SupplierCategory | null })[]> {
    const invoices = await this.facturaRepository.find({
      where: { tenant_id: tenantId }, 
      relations: ['items'],
      select: [
        'id',
        'procesado_en',
        'ruta_archivo_original',
        'asunto_correo',
        'remitente_correo',
        'correo_cliente_asociado',
        'cufe',
        'numero_factura',
        'fecha_emision',
        'hora_emision',
        'monto_subtotal',
        'monto_impuesto',
        'monto_total',
        'moneda',
        'nombre_proveedor',
        'nit_proveedor',
        'email_proveedor',
        'nombre_cliente',
        'nit_cliente',
        'fecha_vencimiento',
        'metodo_pago',
        'tipo_documento_dian',
        'revisada_manualmente',
        'usuario_id',
        'proveedor_id',
        'tenant_id'
      ],
    });

    const invoicesWithCategories = await Promise.all(
      invoices.map(async (factura) => {
        let supplierCategory: SupplierCategory | null = null;
        if (factura.nit_proveedor) {
          const supplier = await this.suppliersService.findByNit(factura.nit_proveedor, tenantId); 
          if (supplier && supplier.category) {
            supplierCategory = supplier.category;
          }
        }
        return { ...factura, supplierCategory: supplierCategory };
      }),
    );
    return invoicesWithCategories;
  }

  async findInvoiceById(id: number, tenantId: string): Promise<Factura & { supplierCategory: SupplierCategory | null }> {
    const factura = await this.facturaRepository.findOne({
      where: { 
        id, 
        tenant_id: tenantId
      },
      relations: ['items'],
    });

    if (!factura) {
      throw new NotFoundException(`Factura con ID "${id}" no encontrada o no pertenece a tu inquilino.`);
    }

    let supplierCategory: SupplierCategory | null = null;
    if (factura.nit_proveedor) {
      const supplier = await this.suppliersService.findByNit(factura.nit_proveedor, tenantId); 
      if (supplier && supplier.category) {
        supplierCategory = supplier.category;
      }
    }
    return { ...factura, supplierCategory: supplierCategory };
  }

  async findInvoicesBySupplierId(
    proveedorId: string, 
    includeXml: boolean = false, 
    includePdf: boolean = false, 
    tenantId: string,
  ): Promise<Factura[]> {
    const selectFields: (keyof Factura)[] = [
      'id',
      'procesado_en',
      'numero_factura',
      'cufe',
      'fecha_emision',
      'monto_subtotal',
      'monto_impuesto',
      'monto_total',
      'moneda',
      'nombre_proveedor',
      'nit_proveedor',
      'nombre_cliente',
      'metodo_pago',
      'revisada_manualmente',
      'proveedor_id',
      'tenant_id'
    ];

    if (includeXml) {
      selectFields.push('texto_crudo_xml');
    }
    if (includePdf) {
      selectFields.push('contenido_pdf_binario');
    }

    const invoices = await this.facturaRepository.find({
      where: { 
        proveedor_id: proveedorId, 
        tenant_id: tenantId
      },
      select: selectFields,
    });
    return invoices;
  }

  async getInvoiceXml(id: number, tenantId: string): Promise<string | null> {
    const factura = await this.facturaRepository.findOne({
      where: { 
        id, 
        tenant_id: tenantId
      },
      select: ['texto_crudo_xml'],
    });
    if (!factura) {
      throw new NotFoundException(`Factura con ID "${id}" no encontrada.`);
    }
    return factura.texto_crudo_xml;
  }

  async getInvoicePdf(id: number, tenantId: string): Promise<Buffer | null> {
    const factura = await this.facturaRepository.findOne({
      where: { 
        id, 
        tenant_id: tenantId
      },
      select: ['contenido_pdf_binario'],
    });
    if (!factura) {
      throw new NotFoundException(`Factura con ID "${id}" no encontrada.`);
    }
    return factura.contenido_pdf_binario;
  }


 async findClassifiedInvoices(
  tenantId: string,
  userNit: string,
  page: number = 1,
  limit: number = 100
): Promise<{ data: Factura[], count: number }> {
  const skip = (page - 1) * limit;
  const [invoices, count] = await this.facturaRepository.findAndCount({
    where: { tenant_id: tenantId },
    relations: ['items'],
    select: [
      'id', 'procesado_en', 'ruta_archivo_original', 'asunto_correo',
      'remitente_correo', 'correo_cliente_asociado', 'cufe', 'numero_factura',
      'fecha_emision', 'hora_emision', 'monto_subtotal', 'monto_impuesto',
      'monto_total', 'moneda', 'nombre_proveedor', 'nit_proveedor',
      'email_proveedor', 'nombre_cliente', 'nit_cliente', 'fecha_vencimiento',
      'metodo_pago', 'tipo_documento_dian', 'revisada_manualmente',
      'usuario_id', 'proveedor_id', 'tenant_id'
    ],
    take: limit,
    skip: skip,
  });
const classifiedInvoices = invoices.map(factura => {
  let documentType: string;
  console.log('Factura NIT:', factura.nit_proveedor, ' | User NIT:', userNit); 
  console.log('¿Son iguales?:', factura.nit_proveedor === userNit);
  if (factura.nit_proveedor && factura.nit_proveedor !== userNit) {
    documentType = 'Factura de compra'; 
  } else if (factura.nit_proveedor && factura.nit_proveedor === userNit) {
    documentType = 'Factura de venta'; 
  } else {
    documentType = 'Documento de terceros'; 
  }
  (factura as any).documentType = documentType;
  return factura;
});
  return {
    data: classifiedInvoices,
    count,
  };
}
}