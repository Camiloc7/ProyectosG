import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PedidoEntity } from './pedido.entity';
import { ProductoEntity } from '../../productos/entities/producto.entity';
import { ProductoConfigurableEntity } from '../../productos/entities/producto-configurable.entity';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';


export enum EstadoCocina {
  PENDIENTE = 'PENDIENTE',
  EN_PREPARACION = 'EN_PREPARACION',
  ENVIADO_A_COCINA = 'ENVIADO_A_COCINA',
  LISTO = 'LISTO',
  CANCELADO = 'CANCELADO',
}

export enum TipoProductoPedido {
  SIMPLE = 'SIMPLE',
  CONFIGURABLE = 'CONFIGURABLE',
}

@Entity('pedido_items')
export class PedidoItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  pedido_id: string;
  
  @Column({ type: 'char', length: 36, nullable: true })
  producto_id: string | null;

  @Column({ type: 'char', length: 36, nullable: true })
  producto_configurable_id: string | null;

  @Column({ type: 'json', nullable: true })
  configuracion_json: any;

  @Column({ type: 'int', unsigned: true, nullable: false })
  cantidad: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  precio_unitario_al_momento_venta: number;

  @Column({ type: 'text', nullable: true })
  notas_item: string | null;

  @Column({ type: 'enum', enum: EstadoCocina, default: EstadoCocina.PENDIENTE })
  estado_cocina: EstadoCocina;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP(6)', precision: 6, transformer: dateTransformerMySQL })
  fecha_hora_estado_cocina_cambio: Date;

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

  @ManyToOne(() => PedidoEntity, (pedido) => pedido.pedidoItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pedido_id' })
  pedido: PedidoEntity;

  @ManyToOne(() => ProductoEntity, { nullable: true })
  @JoinColumn({ name: 'producto_id' })
  producto: ProductoEntity | null;

  @ManyToOne(() => ProductoConfigurableEntity, { nullable: true })
  @JoinColumn({ name: 'producto_configurable_id' })
  productoConfigurable: ProductoConfigurableEntity | null;
}
