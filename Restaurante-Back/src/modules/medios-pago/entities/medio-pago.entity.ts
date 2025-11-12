import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';

@Entity('medios_pago') 
@Unique(['establecimiento_id', 'nombre']) 
export class MedioPagoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  establecimiento_id: string; 
  
  @Column({ type: 'varchar', length: 50, nullable: false })
  nombre: string; 
  
  @Column({ type: 'boolean', default: true })
  activo: boolean; 

  @Column({ type: 'boolean', default: false })
  es_efectivo: boolean; 
  
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
}