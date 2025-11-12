import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { MedioPagoEntity } from '../../medios-pago/entities/medio-pago.entity';
import {  MovimientoBancarioEntity } from '../../movimientos-bancarios/entities/movimiento-bancario.entity';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';

@Entity('cuentas_bancarias')
@Unique(['establecimiento_id', 'numero_cuenta'])
@Unique(['establecimiento_id', 'codigo_puc'])
export class CuentaBancariaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  establecimiento_id: string;

  @Column({ type: 'char', length: 36, nullable: true })
  medio_pago_asociado_id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre_banco: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  tipo_cuenta: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  numero_cuenta: string;

  @Column({ type: 'varchar', length: 20, nullable: false })
  codigo_puc: string;

  @Column({ type: 'boolean', default: true })
  activa: boolean;

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

  @ManyToOne(() => EstablecimientoEntity)
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;

  @ManyToOne(() => MedioPagoEntity, { nullable: true })
  @JoinColumn({ name: 'medio_pago_asociado_id' })
  medio_pago_asociado: MedioPagoEntity;

  @OneToMany(() =>  MovimientoBancarioEntity, movimiento => movimiento.cuentaBancaria)
  movimientos:  MovimientoBancarioEntity[];
}
