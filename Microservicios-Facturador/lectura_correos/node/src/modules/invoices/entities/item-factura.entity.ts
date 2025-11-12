import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
  } from 'typeorm';
  import { Factura } from './invoice.entity';
  
  @Entity('items_factura') 
  export class ItemFactura {
    @PrimaryGeneratedColumn()
    id: number;
  
    @Column({ type: 'int' })
    factura_id: number;
  
    @Column({ type: 'varchar', length: 500, nullable: true })
    descripcion: string | null;
  
    @Column({ type: 'float', nullable: true })
    cantidad: number | null;
  
    @Column({ type: 'float', nullable: true })
    valor_unitario: number | null;
  
    @Column({ type: 'float', nullable: true })
    valor_total: number | null;
  
    @ManyToOne(() => Factura, (factura) => factura.items)
    @JoinColumn({ name: 'factura_id' })
    factura: Factura;

    @Column()
    tenant_id: string;
  }