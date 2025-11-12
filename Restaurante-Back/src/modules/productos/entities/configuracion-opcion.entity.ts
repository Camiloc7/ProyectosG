import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProductoConfigurableEntity } from './producto-configurable.entity';
import { OpcionValor } from './opcion-valor.entity';

@Entity('configuracion_opcion')
export class ConfiguracionOpcion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  producto_configurable_id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @Column({ type: 'boolean', default: false })
  es_multiple: boolean;

  @ManyToOne(() => ProductoConfigurableEntity, productoConfigurable => productoConfigurable.opciones)
  @JoinColumn({ name: 'producto_configurable_id' })
  productoConfigurable: ProductoConfigurableEntity;
  
  @OneToMany(() => OpcionValor, opcionValor => opcionValor.configuracionOpcion)
  valores: OpcionValor[];
}