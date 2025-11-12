import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { CausationRule } from './causation-rule.entity';

@Entity('supplier_categories')
export class SupplierCategory {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl: string;

  @OneToMany(() => CausationRule, (rule) => rule.supplierCategory)
  causationRules: CausationRule[];

  @Column() 
  tenant_id: string;

}