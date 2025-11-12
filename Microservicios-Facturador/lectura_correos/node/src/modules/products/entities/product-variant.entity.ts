import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string; 

  @Column({ unique: true, nullable: true })
  barcode: string; 

  @Column()
  name: string; 

  @Column({ nullable: true })
  attribute1_name: string; 
  @Column({ nullable: true })
  attribute1_value: string; 

  @Column({ nullable: true })
  attribute2_name: string; 
  @Column({ nullable: true })
  attribute2_value: string; 

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  cost_price: number; 

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  sale_price: number; 

  @ManyToOne(() => Product, (product) => product.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string; 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}