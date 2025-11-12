import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { BillOfMaterial } from './bill-of-material.entity';
import { User } from '../../users/entities/user.entity';
import { ProductionInput } from './production-input.entity';
import { ProductionOutput } from './production-output.entity';
import { QualityCheck } from './quality-check.entity';
import { Location } from '../../inventory/entities/location.entity';

export enum ProductionOrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('production_orders')
export class ProductionOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 }) 
  order_number: string;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => BillOfMaterial, { nullable: true })
  @JoinColumn({ name: 'bom_id' })
  billOfMaterial: BillOfMaterial | null;

  @Column({ nullable: true })
  bom_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity_to_produce: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantity_produced: number;

  @Column({
    type: 'enum', 
    enum: ProductionOrderStatus, 
    default: ProductionOrderStatus.PENDING,
  })
  status: ProductionOrderStatus;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'production_location_id' })
  productionLocation: Location | null;

  @Column({ nullable: true })
  production_location_id: string;

  @Column({ type: 'timestamp', nullable: true })
  start_date: Date;

  @Column({ type: 'timestamp', nullable: true })
  end_date: Date;

  @Column({ type: 'text', nullable: true }) 
  notes: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User | null;

  @Column({ nullable: true })
  created_by_user_id: string;

  @OneToMany(() => ProductionInput, (input) => input.productionOrder)
  inputs: ProductionInput[];

  @OneToMany(() => ProductionOutput, (output) => output.productionOrder)
  outputs: ProductionOutput[];

  @OneToMany(() => QualityCheck, (check) => check.productionOrder)
  qualityChecks: QualityCheck[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}