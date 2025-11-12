import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ProductionOrder } from './production-order.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductLot } from '../../inventory/entities/product-lot.entity';
import { ProductSerial } from '../../inventory/entities/product-serial.entity';
import { Location } from '../../inventory/entities/location.entity'; // Desde dónde se consume

@Entity('production_inputs')
export class ProductionInput {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductionOrder, (order) => order.inputs, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'production_order_id' })
  productionOrder: ProductionOrder;

  @Column()
  production_order_id: string;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'material_product_id' })
  materialProduct: Product;

  @Column()
  material_product_id: string;

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

  @ManyToOne(() => Location, { nullable: false })
  @JoinColumn({ name: 'from_location_id' })
  fromLocation: Location; 
  
  @Column()
  from_location_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity_consumed: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  consumption_date: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}