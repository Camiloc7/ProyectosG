import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UsuarioEntity } from '../../usuarios/entities/usuario.entity';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { CierreCajaEntity } from '../../cierre-caja/entities/cierre-caja.entity';

@Entity('gastos')
export class GastoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  establecimiento_id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  usuario_registro_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  monto: number;

  @Column({ type: 'varchar', length: 255, nullable: false })
  descripcion: string;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  fecha_hora_gasto: Date;

  @Column({ type: 'char', length: 36, nullable: true })
  cierre_caja_id: string | null;

  @ManyToOne(() => EstablecimientoEntity)
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;

  @ManyToOne(() => UsuarioEntity)
  @JoinColumn({ name: 'usuario_registro_id' })
  usuario: UsuarioEntity;
  
  @ManyToOne(() => CierreCajaEntity, cierreCaja => cierreCaja.gastos, { nullable: true })
  @JoinColumn({ name: 'cierre_caja_id' })
  cierreCaja: CierreCajaEntity | null;
}