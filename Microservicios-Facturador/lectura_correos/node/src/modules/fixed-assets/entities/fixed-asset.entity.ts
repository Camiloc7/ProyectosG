import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('fixed_assets')
export class FixedAsset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 100, unique: true, nullable: true })
  barcode: string;

  @Column({ type: 'varchar', length: 50 })
  location: string; 

  @Column({ type: 'varchar', length: 50, nullable: true })
  responsible: string; 

  @Column({ type: 'date' })
  purchase_date: Date; 

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  purchase_value: number; 

  @Column({ type: 'int' })
  useful_life_years: number; 

  @Column({ type: 'varchar', length: 50 })
  depreciation_method: string; 

  @Column({ type: 'varchar', length: 50, nullable: true })
  puc_code: string; 

  @Column({ type: 'varchar', length: 50, nullable: true })
  classification: string; 

  @Column('text', { nullable: true })
  accounting_note: string; 

  
  @Column({ type: 'varchar', length: 50, nullable: false, select: false })
  tenant_id: string;
  
  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
