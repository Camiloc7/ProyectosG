
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { UsuarioEntity } from '../../usuarios/entities/usuario.entity';
import { FacturaPedidoEntity } from './factura-pedido.entity';
import { CierreCajaEntity } from '../../cierre-caja/entities/cierre-caja.entity';
import { FacturaPagosCliente } from './factura-pagos-cliente.entity'; 

export enum TipoFactura {
  TOTAL = 'TOTAL',
  PARCIAL = 'PARCIAL',
}

export enum EstadoEnvioFactura {
  PENDIENTE = 'PENDIENTE',
  ENVIADO = 'ENVIADO',
  FALLIDO = 'FALLIDO',
}

export enum EstadoFactura {
  PENDIENTE_PAGO = 'PENDIENTE_PAGO',
  PAGADA = 'PAGADA',
  CANCELADA = 'CANCELADA',
}

@Entity('facturas')
export class FacturaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  establecimiento_id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  usuario_cajero_id: string;

  @Column({ type: 'enum', enum: TipoFactura, nullable: false })
  tipo_factura: TipoFactura;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  impuestos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  descuentos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  propina: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  total_factura: number;

  @Column({ type: 'varchar', length: 20, nullable: false })
  sales_code: string;

  @Column({
    type: 'enum',
    enum: EstadoEnvioFactura,
    default: EstadoEnvioFactura.PENDIENTE,
  })
  estado_envio_api: EstadoEnvioFactura;

  @Column({ type: 'longblob', nullable: true })
  pdf_factura_data: Buffer | null;

  @Column({ type: 'text', nullable: true })
  error_envio_api: string | null;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @Column({
    type: 'enum',
    enum: EstadoFactura,
    default: EstadoFactura.PENDIENTE_PAGO,
  })
  estado: EstadoFactura;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    precision: 6
  })
  fecha_hora_factura: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    precision: 6
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    precision: 6
  })
  updated_at: Date;

  @Column({ type: 'char', length: 36, nullable: true })
  cierre_caja_id: string | null;

  @ManyToOne(() => EstablecimientoEntity)
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'usuario_cajero_id' })
  usuarioCajero: UsuarioEntity;

  @ManyToOne(() => CierreCajaEntity, cierreCaja => cierreCaja.facturas, { nullable: true })
  @JoinColumn({ name: 'cierre_caja_id' })
  cierreCaja: CierreCajaEntity | null;

  @OneToMany(() => FacturaPedidoEntity, facturaPedido => facturaPedido.factura, { cascade: true })
  facturaPedidos: FacturaPedidoEntity[];

  @OneToMany(() => FacturaPagosCliente, facturaPagoCliente => facturaPagoCliente.factura, { cascade: true })
  pagos: FacturaPagosCliente[];
}
