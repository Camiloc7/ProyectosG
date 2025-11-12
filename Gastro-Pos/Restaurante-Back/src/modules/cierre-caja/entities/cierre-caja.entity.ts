import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { UsuarioEntity } from '../../usuarios/entities/usuario.entity';
import { FacturaEntity } from '../../facturas/entities/factura.entity';
import { PagoEntity } from '../../pagos/entities/pago.entity';
import { GastoEntity } from '../../../modules/gastos/entities/gasto.entity';
import { IngresoExtraEntity } from 'src/modules/ingresos-extra/entities/ingreso-extra.entity';
import { PedidoEntity } from 'src/modules/pedidos/entities/pedido.entity';

@Entity('cierres_caja')
export class CierreCajaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  establecimiento_id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  usuario_cajero_id: string;

  @Column({ type: 'timestamp', precision: 6, nullable: false })
  fecha_hora_apertura: Date;

  @Column({ type: 'timestamp', precision: 6, nullable: true })
  fecha_hora_cierre: Date | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  saldo_inicial_caja: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  saldo_final_contado: number;


  @Column({ type: 'json', nullable: true })
  denominaciones_apertura: object;

  @Column({ type: 'json', nullable: true })
  denominaciones_cierre: object;


  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_ventas_brutas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_descuentos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_impuestos: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_propina: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_neto_ventas: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_pagos_efectivo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_pagos_tarjeta: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_pagos_otros: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  total_recaudado: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  gastos_operacionales: number; 

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00, nullable: false })
  diferencia_caja: number;

  @Column({ type: 'boolean', default: false, nullable: false })
  cerrado: boolean;

  @Column({ type: 'text', nullable: true })
  observaciones: string | null;

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

  @ManyToOne(() => EstablecimientoEntity)
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'usuario_cajero_id' })
  usuarioCajero: UsuarioEntity;

  @OneToMany(() => FacturaEntity, factura => factura.cierreCaja)
  facturas: FacturaEntity[];

  @OneToMany(() => PedidoEntity, pedido => pedido.cierreCaja)
pedidos: PedidoEntity[];

  @OneToMany(() => PagoEntity, pago => pago.cierreCaja)
  pagos: PagoEntity[];

  @OneToMany(() => GastoEntity, gasto => gasto.cierreCaja)
  gastos: GastoEntity[]; 

  @OneToMany(() => IngresoExtraEntity ,  ingresosExtra => ingresosExtra.cierreCaja)
  ingresosExtra: IngresoExtraEntity []; 
}
