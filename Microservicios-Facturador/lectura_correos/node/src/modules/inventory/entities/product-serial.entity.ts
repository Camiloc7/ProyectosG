import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Inventory } from './inventory.entity';

@Entity('product_serials')
export class ProductSerial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  serial_number: string; 

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column()
  product_id: string;

  @Column({ default: 'available' })
  status: string; 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  received_at: Date; 

  @OneToOne(() => Inventory, inventory => inventory.productSerial)
  inventoryItem: Inventory; 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}