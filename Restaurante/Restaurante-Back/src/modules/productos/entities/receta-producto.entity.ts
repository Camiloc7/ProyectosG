import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm'; 
import { ProductoEntity } from './producto.entity';
import { IngredienteEntity } from '../../ingredientes/entities/ingrediente.entity';

@Entity('recetas_productos') 
@Unique(['producto_id', 'ingrediente_id']) 
export class RecetaProductoEntity {
  @PrimaryGeneratedColumn('uuid') 
  id: string;

  @Column({ type: 'uuid' })
  producto_id: string;

  @Column({ type: 'uuid' }) 
  ingrediente_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  cantidad_necesaria: number; 

  @ManyToOne(() => ProductoEntity, producto => producto.receta, { onDelete: 'CASCADE' }) 
  @JoinColumn({ name: 'producto_id' })
  producto: ProductoEntity;

  @ManyToOne(() => IngredienteEntity)
  @JoinColumn({ name: 'ingrediente_id' })
  ingrediente: IngredienteEntity;
}