import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IngredienteEntity } from '../../ingredientes/entities/ingrediente.entity';
import { ProveedorEntity } from '../../proveedores/entities/proveedor.entity';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';

@Entity('compras_ingredientes')
export class CompraIngredienteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  establecimiento_id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  ingrediente_id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  proveedor_id: string;

 @Column({ type: 'decimal', precision: 50, scale: 2, nullable: false })
cantidad_comprada: number;

  @Column({ type: 'varchar', length: 50, nullable: false }) 
  unidad_medida_compra: string;

@Column({ type: 'decimal', precision: 50, scale: 2, nullable: false })
costo_unitario_compra: number;

@Column({ type: 'decimal', precision: 50, scale: 2, nullable: false })
costo_total: number; 

  @Column({ type: 'timestamp', nullable: false, transformer: dateTransformerMySQL })
  fecha_compra: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  numero_factura: string | null;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

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

  @ManyToOne(() => IngredienteEntity, ingrediente => ingrediente.compras)
  @JoinColumn({ name: 'ingrediente_id' })
  ingrediente: IngredienteEntity;

  @ManyToOne(() => ProveedorEntity, proveedor => proveedor.compras)
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: ProveedorEntity;
}