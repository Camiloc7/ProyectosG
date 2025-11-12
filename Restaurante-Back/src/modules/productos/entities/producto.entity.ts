import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { CategoriaEntity } from '../../categorias/entities/categoria.entity';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { RecetaProductoEntity } from './receta-producto.entity';
import { Exclude } from 'class-transformer';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';

@Entity('productos')
@Unique(['establecimiento_id', 'nombre'])
export class ProductoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  establecimiento_id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  categoria_id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precio: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imagen_url: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  iva: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  ic: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  inc: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', precision: 6, transformer: dateTransformerMySQL })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)', precision: 6, transformer: dateTransformerMySQL })
  updated_at: Date;

  @ManyToOne(() => EstablecimientoEntity)
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;

  @ManyToOne(() => CategoriaEntity)
  @JoinColumn({ name: 'categoria_id' })
  @Exclude()
  categoria: CategoriaEntity;

  @OneToMany(() => RecetaProductoEntity, receta => receta.producto, { cascade: true }) 
  receta: RecetaProductoEntity[];
}