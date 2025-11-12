import { CompraIngredienteEntity } from '../../compras/entities/compra-ingrediente.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';

@Entity('proveedores')
@Unique(['establecimiento_id', 'nombre']) 
@Unique(['establecimiento_id', 'nit']) 
export class ProveedorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false }) 
  establecimiento_id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @Column({ type: 'varchar', length: 20, nullable: false, unique: false }) 
  nit: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contacto: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  telefono: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', precision: 6, transformer: dateTransformerMySQL })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)', precision: 6, transformer: dateTransformerMySQL })
  updated_at: Date;

  @OneToMany(() => CompraIngredienteEntity, compra => compra.proveedor)
  compras: CompraIngredienteEntity[];

  @ManyToOne(() => EstablecimientoEntity) 
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;
}
