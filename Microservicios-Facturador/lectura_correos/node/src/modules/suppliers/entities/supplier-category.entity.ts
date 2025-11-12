
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Supplier } from './supplier.entity';

@Entity('supplier_categories') 
export class SupplierCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', nullable: true, length: 255 }) 
  imageUrl: string | null; 

  @OneToMany(() => Supplier, (supplier) => supplier.category)
  suppliers: Supplier[];

  @Column()
  tenant_id: string;
}