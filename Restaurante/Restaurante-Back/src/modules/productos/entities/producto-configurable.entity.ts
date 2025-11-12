import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { CategoriaEntity } from '../../categorias/entities/categoria.entity';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { ConfiguracionOpcion } from './configuracion-opcion.entity';

@Entity('producto_configurable')
export class ProductoConfigurableEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  establecimiento_id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  categoria_id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imagen_url: string; 

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false, default: 0.00 })
  precio_base: number;

  @Column({ type: 'boolean', default: false, nullable: false })
  iva: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  ic: boolean;

  @Column({ type: 'boolean', default: false, nullable: false })
  inc: boolean;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', precision: 6 })
  created_at: Date;
  
  @UpdateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', onUpdate: 'CURRENT_TIMESTAMP(6)', precision: 6 })
   updated_at: Date;

  @ManyToOne(() => EstablecimientoEntity)
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;

  @ManyToOne(() => CategoriaEntity)
  @JoinColumn({ name: 'categoria_id' })
  categoria: CategoriaEntity;
  
  @OneToMany(() => ConfiguracionOpcion, opcion => opcion.productoConfigurable)
  opciones: ConfiguracionOpcion[];
}