import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { CompraIngredienteEntity } from '../../compras/entities/compra-ingrediente.entity';

@Entity('ingredientes')
@Unique(['establecimiento_id', 'nombre'])
export class IngredienteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  establecimiento_id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo_barras: string | null;

  @Column({ type: 'varchar', length: 20, nullable: false })
  unidad_medida: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  stock_actual: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  stock_minimo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  costo_unitario: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  volumen_por_unidad?: number;

  @Column({ type: 'timestamp', nullable: true })
  fecha_ultima_compra: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  fecha_ultima_conciliacion: Date | null; 

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cantidad_ultima_compra: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  observaciones: string | null;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)', precision: 6 })
  updated_at: Date;

  @ManyToOne(() => EstablecimientoEntity)
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;

  @OneToMany(() => CompraIngredienteEntity, compra => compra.ingrediente)
  compras: CompraIngredienteEntity[];
}