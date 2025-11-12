// import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
// import { Customer } from './customer.entity';
// import { InvoiceItem } from './invoice-item.entity';
// import { User } from '../../users/entities/user.entity'; 

// @Entity('invoices')
// export class Invoice {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ unique: true })
//   invoice_number: string;

//   @ManyToOne(() => Customer, (customer) => customer.invoices, { nullable: false })
//   @JoinColumn({ name: 'customer_id' })
//   customer: Customer;

//   @Column()
//   customer_id: string;

//   @Column({ type: 'date', default: () => 'CURRENT_DATE' })
//   invoice_date: Date;

//   @Column({ type: 'decimal', precision: 15, scale: 4 })
//   total_amount: number;

//   @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
//   tax_amount: number;

//   @Column({ type: 'decimal', precision: 15, scale: 4 })
//   sub_total: number;

//   @Column({ default: 'pending' })
//   status: string; 

//   @ManyToOne(() => User, { nullable: true })
//   @JoinColumn({ name: 'created_by_user_id' })
//   createdBy: User;

//   @Column({ nullable: true })
//   created_by_user_id: string;

//   @Column({ nullable: true })
//   notes: string;

//   @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
//   items: InvoiceItem[];

//   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
//   created_at: Date;

//   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
//   updated_at: Date;
// }

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Customer } from './customer.entity';
import { InvoiceItem } from './invoice-item.entity';
import { User } from '../../users/entities/user.entity'; 

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoice_number: string;

  @ManyToOne(() => Customer, (customer) => customer.invoices, { nullable: false })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column()
  customer_id: string;

  // --- CAMBIO AQUÍ ---
  // Elimina la propiedad `default` para `invoice_date`
  @Column({ type: 'date' }) // Asegúrate de que `nullable: false` sea el comportamiento deseado
  invoice_date: Date;
  // Si `invoice_date` puede ser nulo, puedes añadir `nullable: true` aquí.
  // @Column({ type: 'date', nullable: true })

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  total_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 4, default: 0 })
  tax_amount: number;

  @Column({ type: 'decimal', precision: 15, scale: 4 })
  sub_total: number;

  @Column({ default: 'pending' })
  status: string; 

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy: User;

  @Column({ nullable: true })
  created_by_user_id: string;

  @Column({ nullable: true })
  notes: string;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}