import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, Index } from 'typeorm';
import { FacturaEntity } from './factura.entity';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';

@Entity('facturas_reintentos')
@Index(['factura_id'], { unique: true })
export class FacturaRetryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: 0 })
  intentos_fallidos: number;

  @Column({ type: 'timestamp', transformer: dateTransformerMySQL })
  proximo_intento: Date;

  @Column({ type: 'char', length: 36, nullable: false }) 
  factura_id: string;

  @OneToOne(() => FacturaEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'factura_id' })
  factura: FacturaEntity;
}