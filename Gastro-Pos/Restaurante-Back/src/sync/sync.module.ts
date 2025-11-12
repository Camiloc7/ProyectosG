import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncService } from './sync.service';
import { SyncChangelogEntity } from './entities/sync-changelog.entity';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WebsocketModule } from '../websocket/websocket.module';
import { SyncController } from './sync.controller'; 
import { GenericSyncSubscriber } from './subscribers/generic-sync.subscriber';
import { RolesModule } from 'src/modules/roles/roles.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([SyncChangelogEntity]),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get('HTTP_TIMEOUT') || 5000,
        maxRedirects: configService.get('HTTP_MAX_REDIRECTS') || 5,
      }),
      inject: [ConfigService],
    }),
    RolesModule, 
    WebsocketModule,
  ],
  controllers: [
    SyncController, 
  ],
  providers: [
    SyncService,
    GenericSyncSubscriber,
  ],
  exports: [
    SyncService,
    HttpModule,
  ],
})
export class SyncModule {}