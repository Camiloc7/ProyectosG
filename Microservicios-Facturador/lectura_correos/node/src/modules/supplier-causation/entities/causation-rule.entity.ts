import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SupplierCategory } from './supplier-category.entity';

@Entity('causation_rules')
export class CausationRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, name: 'supplier_category_id' })
  supplierCategoryId: string;

  @ManyToOne(() => SupplierCategory, (category) => category.causationRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'supplier_category_id' }) 
  supplierCategory: SupplierCategory;

  @Column({ type: 'varchar', length: 255 })
  pucCode: string;

  @Column({ type: 'varchar', length: 255 })
  pucDescription: string;

  @Column({ type: 'varchar', length: 255 })
  electronicDocumentType: string;

  @Column({ type: 'varchar', length: 255 })
  targetTable: string;

  @Column({ type: 'varchar', length: 255 })
  processType: string;

  @Column({ type: 'varchar', length: 255 })
  accountingType: string;

  @Column({ type: 'varchar', length: 255 })
  firstOperandFrontendName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  firstOperandDbColumn: string;

  @Column({ type: 'varchar', length: 10 })
  operation: string;

  @Column({ type: 'varchar', length: 50 })
  secondOperandSource: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  secondOperandFrontendName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  secondOperandDbColumn: string;

  @Column({ type: 'float', nullable: true })
  secondOperandValue: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'created_at' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP', name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 }) 
  tenant_id: string;
}