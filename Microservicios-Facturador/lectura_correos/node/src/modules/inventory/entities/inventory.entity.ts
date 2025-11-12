import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, OneToOne } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Location } from './location.entity';
import { ProductLot } from './product-lot.entity';
import { ProductSerial } from './product-serial.entity';

@Entity('inventory')
@Unique(['product_id', 'location_id', 'product_lot_id', 'product_serial_id', 'product_variant_id'])
export class Inventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ length: 100 })
  product_id: string;

  @ManyToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'product_variant_id' })
  productVariant: ProductVariant;

  @Column({ nullable: true })
  product_variant_id: string;

  @ManyToOne(() => Location, { nullable: false })
  @JoinColumn({ name: 'location_id' })
  location: Location;

  @Column({ length: 100 })
  location_id: string;

  @ManyToOne(() => ProductLot, { nullable: true })
  @JoinColumn({ name: 'product_lot_id' })
  productLot: ProductLot;

  @Column({ length:100, nullable: true })
  product_lot_id: string;

  @OneToOne(() => ProductSerial, { nullable: true })
  @JoinColumn({ name: 'product_serial_id' })
  productSerial: ProductSerial;

  @Column({ length:100, nullable: true })
  product_serial_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  quantity: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}





