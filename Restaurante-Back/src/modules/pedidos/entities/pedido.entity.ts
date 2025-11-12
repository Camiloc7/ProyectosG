import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { MesaEntity } from '../../mesas/entities/mesa.entity';
import { UsuarioEntity } from '../../usuarios/entities/usuario.entity';
import { PedidoItemEntity } from './pedido-item.entity';
import { FacturaPedidoEntity } from '../../facturas/entities/factura-pedido.entity'; 
import { CierreCajaEntity } from 'src/modules/cierre-caja/entities/cierre-caja.entity';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';

export enum EstadoPedido {
  ABIERTO = 'ABIERTO',
  ENVIADO_A_COCINA = 'ENVIADO_A_COCINA',
  EN_PREPARACION = 'EN_PREPARACION',
  LISTO_PARA_ENTREGAR = 'LISTO_PARA_ENTREGAR',
  EN_REPARTO= 'EN_REPARTO',
  CERRADO = 'CERRADO',
  PAGADO = 'PAGADO',
  CANCELADO = 'CANCELADO',
  ENTREGADO = 'ENTREGADO',
  LISTO = 'LISTO',
  PENDIENTE_PAGO= 'PENDIENTE_PAGO',
}

export enum TipoPedido {
  MESA = 'MESA',
  PARA_LLEVAR = 'PARA_LLEVAR',
  DOMICILIO = 'DOMICILIO',
}

@Entity('pedidos')
export class PedidoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  establecimiento_id: string;

  @Column({ type: 'int', nullable: true })
  numero_secuencial_diario: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  codigo_pedido: string;

  @Column({ type: 'char', length: 36, nullable: true })
  mesa_id: string | null;

  @Column({ type: 'char', length: 36, nullable: false })
  usuario_creador_id: string;

  @Column({ type: 'char', length: 36, nullable: true })
  usuario_domiciliario_id: string | null;

  @Column({ type: 'char', length: 36, nullable: true })
  usuario_cancelador_id: string | null;

  @Column({ type: 'enum', enum: EstadoPedido, default: EstadoPedido.ABIERTO })
  estado: EstadoPedido;

  @Column({ type: 'enum', enum: TipoPedido, default: TipoPedido.MESA })
  tipo_pedido: TipoPedido;

  @Column({ type: 'varchar', length: 255, nullable: true })
  cliente_nombre: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  cliente_telefono: string | null;

  @Column({ type: 'text', nullable: true })
  cliente_direccion: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  total_estimado: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0.00 })
  descuentos_aplicados: number;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    precision: 6,
    transformer: dateTransformerMySQL
  })
  fecha_hora_pedido: Date;

  @Column({ type: 'timestamp', nullable: true, precision: 6, transformer: dateTransformerMySQL })
  fecha_hora_cierre: Date | null;

  @Column({ type: 'timestamp', nullable: true, precision: 6, transformer: dateTransformerMySQL })
  fecha_cancelacion: Date | null;

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

  @Column({ type: 'timestamp', nullable: true, precision: 6, transformer: dateTransformerMySQL })
  fecha_ultima_actualizacion_relevante_cocina: Date | null;

  @ManyToOne(() => EstablecimientoEntity)
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;

  @ManyToOne(() => MesaEntity)
  @JoinColumn({ name: 'mesa_id' })
  mesa: MesaEntity | null;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'usuario_creador_id' })
  usuarioCreador: UsuarioEntity | null;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'usuario_domiciliario_id' })
  usuarioDomiciliario: UsuarioEntity | null;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'usuario_cancelador_id' })
  usuarioCancelador: UsuarioEntity | null;

  @OneToMany(() => PedidoItemEntity, pedidoItem => pedidoItem.pedido, { cascade: true, onDelete: 'CASCADE' })
  pedidoItems: PedidoItemEntity[];

  @OneToMany(() => FacturaPedidoEntity, facturaPedido => facturaPedido.pedido)
  facturaPedidos: FacturaPedidoEntity[];

  @Column({ type: 'char', length: 36, nullable: true })
cierre_caja_id: string | null;

@ManyToOne(() => CierreCajaEntity, cierreCaja => cierreCaja.pedidos)
@JoinColumn({ name: 'cierre_caja_id' })
cierreCaja: CierreCajaEntity | null;
}