import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne, 
  JoinColumn,
} from 'typeorm';
import { ItemFactura } from './item-factura.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';

@Entity('facturas')
export class Factura {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  procesado_en: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  ruta_archivo_original: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  asunto_correo: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  remitente_correo: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  correo_cliente_asociado: string | null;

  @Column({ type: 'varchar', length: 200, unique: true, nullable: true })
  cufe: string | null;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  numero_factura: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_emision: Date | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  hora_emision: string | null;

  @Column({ type: 'float', nullable: true })
  monto_subtotal: number | null;

  @Column({ type: 'float', nullable: true })
  monto_impuesto: number | null;

  @Column({ type: 'float', nullable: true })
  monto_total: number | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  moneda: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombre_proveedor: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nit_proveedor: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email_proveedor: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nombre_cliente: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  nit_cliente: string | null;

  @Column({ type: 'date', nullable: true })
  fecha_vencimiento: Date | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  metodo_pago: string | null;

  @Column({ type: 'longtext', nullable: true })
  texto_crudo_xml: string | null;

  @Column({ type: 'longblob', nullable: true })
  contenido_pdf_binario: Buffer | null;

  @Column({ type: 'varchar', length: 100, nullable: true, default: 'Por revisar' })
  tipo_documento_dian: string | null;

  @Column({ type: 'boolean', default: false, nullable: true })
  revisada_manualmente: boolean;

  @Column({ type: 'int', nullable: true })
  usuario_id: number | null;

  @Column({ type: 'varchar', length: 36, nullable: true })
  proveedor_id: string | null;

  @ManyToOne(() => Supplier, (supplier) => supplier.facturas_asociadas)
  @JoinColumn({ name: 'proveedor_id' })
  supplier: Supplier;

  @OneToMany(() => ItemFactura, (itemFactura) => itemFactura.factura)
  items: ItemFactura[];

  @Column()
  tenant_id: string;
}