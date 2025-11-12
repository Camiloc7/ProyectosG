import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OpcionValor } from './opcion-valor.entity';

@Entity('opcion_valor_precio')
export class OpcionValorPrecio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  opcion_valor_id: string;
  
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precio: number;
  
  @ManyToOne(() => OpcionValor, opcionValor => opcionValor.precios)
  @JoinColumn({ name: 'opcion_valor_id' })
  opcionValor: OpcionValor;
}