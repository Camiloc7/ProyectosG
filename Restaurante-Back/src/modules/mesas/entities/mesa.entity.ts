import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';

export enum EstadoMesa {
  LIBRE = 'LIBRE',
  OCUPADA = 'OCUPADA',
}

@Entity('mesas') 
@Unique(['establecimiento_id', 'numero']) 
export class MesaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  establecimiento_id: string; 

  @Column({ type: 'varchar', length: 50, nullable: false })
  numero: string; 

  @Column({ type: 'int', nullable: true })
  capacidad: number; 

  @Column({ type: 'enum', enum: EstadoMesa, default: EstadoMesa.LIBRE })
  estado: EstadoMesa; 


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