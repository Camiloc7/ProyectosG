import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { EstablecimientoEntity } from './establecimiento.entity';
import { Exclude } from 'class-transformer';

@Entity('establecimientos_configuracion_pedido')
export class EstablecimientoConfiguracionPedidoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, unique: true, nullable: false })
  establecimiento_id: string;

  @Column({ type: 'int', default: 10, nullable: false, comment: 'Minutos límite para cancelar un pedido en estado EN_PREPARACION' })
  limite_cancelacion_preparacion_minutos: number;

  @Column({ type: 'int', default: 5, nullable: false, comment: 'Minutos límite para cancelar un pedido en estado ENVIADO_A_COCINA' })
  limite_cancelacion_enviado_cocina_minutos: number;

  @Column({ type: 'int', default: 15, nullable: false, comment: 'Minutos límite para editar cualquier aspecto de un pedido (fuera de estado ABIERTO)' })
  limite_edicion_pedido_minutos: number;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    precision: 6
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    precision: 6
  })
  updated_at: Date;

  @OneToOne(() => EstablecimientoEntity, establecimiento => establecimiento.configuracionPedido, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'establecimiento_id' })
  @Exclude()
  establecimiento?: EstablecimientoEntity; 
}