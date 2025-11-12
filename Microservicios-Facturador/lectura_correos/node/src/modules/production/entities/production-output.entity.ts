import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProductionOrder } from './production-order.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductLot } from '../../inventory/entities/product-lot.entity'; 
import { ProductSerial } from '../../inventory/entities/product-serial.entity';
import { Location } from '../../inventory/entities/location.entity';

@Entity('production_outputs')
export class ProductionOutput {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductionOrder, (order) => order.outputs, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'production_order_id' })
  productionOrder: ProductionOrder;

  @Column()
  production_order_id: string;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'produced_product_id' })
  producedProduct: Product;

  @Column()
  produced_product_id: string;

  @ManyToOne(() => ProductLot, { nullable: true }) 
  @JoinColumn({ name: 'product_lot_id' })
  productLot: ProductLot;

  @Column({ nullable: true })
  product_lot_id: string;

  @ManyToOne(() => ProductSerial, { nullable: true })
  @JoinColumn({ name: 'product_serial_id' })
  productSerial: ProductSerial;

  @Column({ nullable: true })
  product_serial_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity_produced: number;

  @ManyToOne(() => Location, { nullable: false })
  @JoinColumn({ name: 'to_location_id' })
  toLocation: Location; 
  
  @Column()
  to_location_id: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  output_date: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}