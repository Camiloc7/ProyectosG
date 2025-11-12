import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { FacturaEntity } from './factura.entity';
import { PedidoEntity } from '../../pedidos/entities/pedido.entity';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';

@Entity('factura_pedidos') 
export class FacturaPedidoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string; 

  @Column({ type: 'char', length: 36, nullable: false })
  factura_id: string; 

  @Column({ type: 'char', length: 36, nullable: false })
  pedido_id: string; 

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  monto_aplicado: number; 

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

  @ManyToOne(() => FacturaEntity, factura => factura.facturaPedidos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'factura_id' })
  factura: FacturaEntity;

  @ManyToOne(() => PedidoEntity)
  @JoinColumn({ name: 'pedido_id' })
  pedido: PedidoEntity;
}