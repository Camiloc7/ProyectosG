import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Supplier } from '../../suppliers/entities/supplier.entity';
import { Inventory } from './inventory.entity';

@Entity('product_lots')
export class ProductLot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  lot_number: string; 

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => Supplier, { nullable: true }) 
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier | null;

  @Column({ nullable: true })
  supplier_id: string;

  @Column({ type: 'date', nullable: true })
  manufacture_date: Date; 

  @Column({ type: 'date', nullable: true })
  expiration_date: Date; 

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  initial_quantity: number; 

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  current_quantity: number; 

  @Column({ default: 'available' })
  status: string; 

  @OneToMany(() => Inventory, (inventory) => inventory.productLot)
  inventoryItems: Inventory[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  received_at: Date; 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}