import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { EstablecimientoEntity } from '../../establecimientos/entities/establecimiento.entity';
import { RolEntity } from '../../roles/entities/rol.entity';
import { dateTransformerMySQL } from '../../../common/utils/date-transformer.util';

@Entity('usuarios') 
@Unique(['username']) 
export class UsuarioEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  establecimiento_id: string ; 

  @Column({ type: 'char', length: 36, nullable: false })
  rol_id: string; 

  @Column({ type: 'varchar', length: 100, nullable: false })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  apellido: string;

  @Column({ type: 'varchar', length: 50, nullable: false })
  username: string; 
  
  @Column({ type: 'varchar', length: 50, nullable: true }) 
  telefono: string; 

  @Column({ type: 'varchar', length: 255, nullable: false, select: false }) 
  password_hash: string; 

  @Column({ type: 'boolean', default: true })
  activo: boolean;

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
  
  @ManyToOne(() => EstablecimientoEntity, { eager: true })
  @JoinColumn({ name: 'establecimiento_id' })
  establecimiento: EstablecimientoEntity;

  @ManyToOne(() => RolEntity, { eager: true })
  @JoinColumn({ name: 'rol_id' })
  rol: RolEntity;

}