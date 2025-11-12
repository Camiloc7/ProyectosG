import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OpcionValor } from './opcion-valor.entity';
import { IngredienteEntity } from '../../ingredientes/entities/ingrediente.entity';

@Entity('opcion_valor_ingrediente')
export class OpcionValorIngrediente {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  
  @Column({ type: 'char', length: 36, nullable: false })
  opcion_valor_id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  ingrediente_id: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  cantidad: number;
  
  @ManyToOne(() => OpcionValor, opcionValor => opcionValor.ingredientes)
  @JoinColumn({ name: 'opcion_valor_id' })
  opcionValor: OpcionValor;
  
  @ManyToOne(() => IngredienteEntity)
  @JoinColumn({ name: 'ingrediente_id' })
  ingrediente: IngredienteEntity;
}