import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Invoice } from './invoice.entity';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { ProductLot } from '../../inventory/entities/product-lot.entity'; // Lote específico vendido
import { ProductSerial } from '../../inventory/entities/product-serial.entity'; // Serial específico vendido

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Invoice, (invoice) => invoice.items, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice;

  @Column()
  invoice_id: string;

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

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  unit_price: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  total_price: number; // Quantity * UnitPrice

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}