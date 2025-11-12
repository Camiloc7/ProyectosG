import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Location } from '../../inventory/entities/location.entity';
import { ProductLot } from '../../inventory/entities/product-lot.entity';
import { ProductSerial } from '../../inventory/entities/product-serial.entity';
import { User } from '../../users/entities/user.entity'; 

@Entity('movements')
export class Movement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  movement_type: string; 

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => ProductVariant, { nullable: true })
  @JoinColumn({ name: 'product_variant_id' })
  productVariant: ProductVariant;

  @Column({ nullable: true })
  product_variant_id: string;

  @ManyToOne(() => Location, { nullable: false })
  @JoinColumn({ name: 'from_location_id' })
  fromLocation: Location; 

  @Column()
  from_location_id: string;

  @ManyToOne(() => Location, { nullable: true }) 
  @JoinColumn({ name: 'to_location_id' })
  toLocation: Location; 

  @Column({ nullable: true })
  to_location_id: string;

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
  quantity: number;

  @Column({ nullable: true })
  reference_document_id: string; 
  
  @Column({ nullable: true })
  reference_document_type: string;

  @Column({ nullable: true })
  notes: string;


  @ManyToOne(() => User, { nullable: true })
@JoinColumn({ name: 'created_by_user_id' })
createdBy: User | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  movement_date: Date; 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}