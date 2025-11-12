import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn  } from 'typeorm'; 
import { CuentaBancariaEntity } from '../../cuentas-banco/entities/cuenta-bancaria.entity';
import { MovimientoTipo } from '../../../common/enums/movimiento-tipo.enum';

@Entity('movimientos_cuentas_bancarias')
export class MovimientoBancarioEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  cuenta_bancaria_id: string;

  @Column({ type: 'enum', enum: MovimientoTipo, nullable: false })
  tipo_movimiento: MovimientoTipo;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  monto: number;

  @Column({ type: 'timestamp', nullable: false })
  fecha_movimiento: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referencia_externa: string;

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

  @ManyToOne(() => CuentaBancariaEntity, cuenta => cuenta.movimientos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cuenta_bancaria_id' })
  cuentaBancaria: CuentaBancariaEntity;
}