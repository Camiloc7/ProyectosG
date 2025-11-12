import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { SupplierCategory } from './supplier-category.entity';
import { Factura } from '../../invoices/entities/invoice.entity';


@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  nit: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  contact_person: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  verification_digit: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: false })
  notifications_enabled: boolean;

  @Column({ nullable: true })
  document_type: string;

  @Column({ nullable: true })
  contact_first_name: string;

  @Column({ nullable: true })
  contact_middle_name: string;

  @Column({ nullable: true })
  contact_last_name: string;

  @Column({ nullable: true })
  contact_second_last_name: string;

  @Column({ nullable: true })
  commercial_name: string;

  @Column({ nullable: true })
  bank_account_type: string;

  @Column({ nullable: true })
  bank_account_number: string;

  @Column({ nullable: true })
  bank_name: string;

  @ManyToOne(() => SupplierCategory, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: SupplierCategory | null; 

  @Column({ nullable: true })
  category_id: string | null; 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @OneToMany(() => Factura, (factura) => factura.supplier) 
  facturas_asociadas: Factura[];

  @Column()
  tenant_id: string;
}