import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CierreCajaEntity } from '../../cierre-caja/entities/cierre-caja.entity';
import { UsuarioEntity } from '../../usuarios/entities/usuario.entity';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';

@Entity('ingresos_extra')
export class IngresoExtraEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  monto: number;

  @Column({ type: 'varchar', length: 255 })
  descripcion: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha_hora_ingreso: Date;

  @Column({ type: 'uuid' })
  cierre_caja_id: string;

  @ManyToOne(() => CierreCajaEntity, (cierre) => cierre.ingresosExtra)
  @JoinColumn({ name: 'cierre_caja_id' })
  cierreCaja: CierreCajaEntity;

  @Column({ type: 'uuid' })
  usuario_registro_id: string;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'usuario_registro_id' })
  usuarioRegistro: UsuarioEntity;

  @Column({ type: 'uuid' })
  establecimiento_id: string;

  @ManyToOne(() => EstablecimientoEntity)
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;
}