import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { FacturaEntity } from '../../facturas/entities/factura.entity';
import { CierreCajaEntity } from '../../../modules/cierre-caja/entities/cierre-caja.entity';
import { CuentaBancariaEntity } from '../../../modules/cuentas-banco/entities/cuenta-bancaria.entity';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity'; 
import { FacturaPagosCliente } from '../../../modules/facturas/entities/factura-pagos-cliente.entity';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';

@Entity('pagos')
export class PagoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  factura_id: string;

  @Column({ type: 'uuid', nullable: false })
  establecimiento_id: string;

  @ManyToOne(() => EstablecimientoEntity)
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;

  @Column({ type: 'char', length: 36, nullable: true }) 
  cuenta_bancaria_id: string | null; 


  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  monto_recibido: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  referencia_transaccion: string | null;

  @Column({ type: 'json', nullable: true })
  denominaciones_efectivo: object | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    precision: 6,
    transformer: dateTransformerMySQL
  })
  fecha_hora_pago: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    precision: 6,
    transformer: dateTransformerMySQL
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    precision: 6,
    transformer: dateTransformerMySQL
  })
  updated_at: Date;

  @Column({ type: 'char', length: 36, nullable: true })
  cierre_caja_id: string | null;

  @ManyToOne(() => FacturaEntity)
  @JoinColumn({ name: 'factura_id' })
  factura: FacturaEntity;

  @ManyToOne(() => CuentaBancariaEntity) 
  @JoinColumn({ name: 'cuenta_bancaria_id' })
  cuentaBancaria: CuentaBancariaEntity;

  @ManyToOne(() => CierreCajaEntity, cierreCaja => cierreCaja.pagos, { nullable: true })
  @JoinColumn({ name: 'cierre_caja_id' })
  cierreCaja: CierreCajaEntity | null;

  @Column({ type: 'char', length: 36, nullable: true })
  factura_pagos_cliente_id: string | null;

  @OneToOne(() => FacturaPagosCliente, facturaPagosCliente => facturaPagosCliente.pago, { nullable: true })
  @JoinColumn({ name: 'factura_pagos_cliente_id' }) 
  facturaPagosCliente: FacturaPagosCliente | null; 
}

