import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProductionOrder } from './production-order.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity('quality_checks')
export class QualityCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductionOrder, (order) => order.qualityChecks, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'production_order_id' })
  productionOrder: ProductionOrder | null; // Si el QC está asociado a una orden de producción

  @Column({ nullable: true })
  production_order_id: string;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product; // El producto que se inspecciona

  @Column()
  product_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity_inspected: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity_accepted: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity_rejected: number;

  @Column()
  result: string; // 'passed', 'failed', 'partial_pass'

  @Column({ nullable: true })
  failure_reason: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'checked_by_user_id' })
  checkedBy: User | null;

  @Column({ nullable: true })
  checked_by_user_id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  check_date: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}