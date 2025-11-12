import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ConfiguracionOpcion } from './configuracion-opcion.entity';
import { OpcionValorPrecio } from './opcion-valor-precio.entity';
import { OpcionValorIngrediente } from './opcion-valor-ingrediente.entity';

@Entity('opcion_valor')
export class OpcionValor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  configuracion_opcion_id: string;
  
  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @ManyToOne(() => ConfiguracionOpcion, configuracionOpcion => configuracionOpcion.valores)
  @JoinColumn({ name: 'configuracion_opcion_id' })
  configuracionOpcion: ConfiguracionOpcion;

  @OneToMany(() => OpcionValorPrecio, precio => precio.opcionValor)
  precios: OpcionValorPrecio[];

  @OneToMany(() => OpcionValorIngrediente, ingrediente => ingrediente.opcionValor)
  ingredientes: OpcionValorIngrediente[];
}