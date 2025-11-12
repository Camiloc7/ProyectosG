import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, Unique, OneToMany } from 'typeorm';
import { EstablecimientoConfiguracionPedidoEntity } from './configuracion-pedidos.entity';
import { Exclude } from 'class-transformer';
import { MedioPagoEntity } from 'src/modules/medios-pago/entities/medio-pago.entity';
import { CuentaBancariaEntity } from 'src/modules/cuentas-banco/entities/cuenta-bancaria.entity';

@Entity('establecimientos')
@Unique(['licencia_key'])
export class EstablecimientoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nit: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  id_por_nit: number; 

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo_url: string|null; 

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  codigo_postal: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telefono: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.00, nullable: false })
  impuesto_porcentaje: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  api_key: string;


  @Column({ type: 'varchar', length: 255, nullable: true })
  licencia_key: string;

  @Column({ type: 'date', nullable: true })
  fecha_expiracion: Date;

  @Column({ type: 'date', nullable: true })
  fecha_activacion: Date;

  @Column({ type: 'boolean', default: false })
  licencia_activa: boolean;

  @Column({ type: 'uuid', nullable: true })
  dispositivo_id: string;


  @Column({ type: 'boolean', default: true, nullable: false })
  activo: boolean;

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

  @OneToOne(() => EstablecimientoConfiguracionPedidoEntity, configuracionPedido => configuracionPedido.establecimiento)
  @Exclude()
  configuracionPedido?: EstablecimientoConfiguracionPedidoEntity;

    @OneToMany(() => MedioPagoEntity, (medioPago) => medioPago.establecimiento)
    mediosPago: MedioPagoEntity[];

    @OneToMany(() => CuentaBancariaEntity, (cuentaBancaria) => cuentaBancaria.establecimiento)
    cuentasBancarias: CuentaBancariaEntity[];

}