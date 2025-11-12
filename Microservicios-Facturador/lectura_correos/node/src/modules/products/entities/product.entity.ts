import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  sku: string; 

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ unique: true, nullable: true })
  barcode: string; 

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  cost_price: number; 

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  sale_price: number; 

  @ManyToOne(() => Category, (category) => category.products, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ nullable: true })
  category_id: string; 

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants: ProductVariant[]; 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}