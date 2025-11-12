import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('impresoras')
export class ImpresoraEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true})
  nombre: string; 

  @Column()
  descripcion: string; 
  
  @Column()
  tipo_impresion: string; 

 @Column({ nullable: true })
 tipo_conexion_tecnico: string; 

  @Column({ default: true })
  activa: boolean;

  @Column()
  establecimiento_id: string;
}
