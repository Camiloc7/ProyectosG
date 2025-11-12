import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';
import { SyncableEntity } from '../../common/interfaces/syncable-entity.interface';
import { v4 as uuidv4 } from 'uuid';

@Entity('sync_changelog')
export class SyncChangelogEntity {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string;

  @Column({ type: 'varchar', length: 100, nullable: false })
  entity_name: string;

  @Column({ type: 'char', length: 36, nullable: false })
  entity_uuid: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  operation_type: 'INSERT' | 'UPDATE' | 'DELETE';

  @Column({ type: 'timestamp', precision: 6, nullable: false })
  changed_at: Date;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    precision: 6,
  })
  recorded_at: Date;

  @Column({ type: 'boolean', default: false, nullable: false })
  synced_to_cloud: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  error_message: string | null; 

  @Column({ type: 'json', nullable: true })
  data: SyncableEntity | null;

  constructor() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}