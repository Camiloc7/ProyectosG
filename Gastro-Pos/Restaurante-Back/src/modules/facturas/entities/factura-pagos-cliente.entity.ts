import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { FacturaEntity } from './factura.entity';
import { ClienteEntity } from '../../clientes/entities/cliente.entity';
import { CuentaBancariaEntity } from '../../cuentas-banco/entities/cuenta-bancaria.entity';
import { PagoEntity } from '../../pagos/entities/pago.entity';




@Entity('factura_pagos_cliente')
export class FacturaPagosCliente {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  factura_id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  cliente_id: string;

  @Column({ type: 'char', length: 36, nullable: false })
  cuenta_bancaria_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: false })
  monto_pagado: number; 

  @Column({ type: 'varchar', length: 100, nullable: false })
  metodo_pago: string; 

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
  @ManyToOne(() => FacturaEntity, factura => factura.pagos)
  @JoinColumn({ name: 'factura_id' })
  factura: FacturaEntity;

  @ManyToOne(() => ClienteEntity)
  @JoinColumn({ name: 'cliente_id' })
  cliente: ClienteEntity;

  @ManyToOne(() => CuentaBancariaEntity)
  @JoinColumn({ name: 'cuenta_bancaria_id' })
  cuentaBancaria: CuentaBancariaEntity;

   @OneToOne(() => PagoEntity, pago => pago.facturaPagosCliente)
  pago: PagoEntity;
}
