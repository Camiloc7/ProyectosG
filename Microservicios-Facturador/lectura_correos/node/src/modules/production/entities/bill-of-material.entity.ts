import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('bills_of_materials')
export class BillOfMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: Product; 

  @Column()
  product_id: string;

  @Column()
  name: string; 

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 1 })
  quantity_produced: number; 

  @OneToMany(() => BillOfMaterialItem, (item) => item.billOfMaterial, { cascade: true })
  items: BillOfMaterialItem[]; 
  
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}

@Entity('bill_of_material_items')
export class BillOfMaterialItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => BillOfMaterial, (bom) => bom.items, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bom_id' })
  billOfMaterial: BillOfMaterial;

  @Column()
  bom_id: string;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'component_product_id' })
  componentProduct: Product; 

  @Column()
  component_product_id: string;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  quantity: number; 

  @Column({ type: 'varchar', length: 50, nullable: false, default: 'unidad' })
  unit: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}