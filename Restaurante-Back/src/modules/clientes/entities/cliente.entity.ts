import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { FacturaPagosCliente } from '../../facturas/entities/factura-pagos-cliente.entity';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';

@Entity('clientes')
export class ClienteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  establecimiento_id: string;

  @ManyToOne(() => EstablecimientoEntity)
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;

  @Column({ type: 'varchar', length: 10, nullable: true })
  tipo_documento_codigo: string | null;
  
  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo_documento: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  numero_documento: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nombre_completo: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  correo_electronico: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 5, nullable: true })
  DV: string | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    precision: 6,
    transformer: dateTransformerMySQL
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    precision: 6,
    transformer: dateTransformerMySQL
  })
  updated_at: Date;

  @OneToMany(() => FacturaPagosCliente, (facturaPago) => facturaPago.cliente)
  pagos: FacturaPagosCliente[];
}