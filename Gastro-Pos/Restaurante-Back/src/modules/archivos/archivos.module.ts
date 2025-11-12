import { forwardRef, Module } from '@nestjs/common';
import { ArchivosController } from './archivos.controller';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryService } from './cloudinary.service';
import { EstablecimientosModule } from '../establecimientos/establecimientos.module';
import { RolesModule } from '../roles/roles.module';

@Module({
  imports: [ConfigModule   ,
        forwardRef(() => EstablecimientosModule),
    RolesModule, ], 
  controllers: [ArchivosController],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class ArchivosModule {}  
