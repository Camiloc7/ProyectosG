import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupplierCausationService } from './supplier-causation.service';
import { SupplierCausationController } from './supplier-causation.controller';
import { SupplierCategory } from './entities/supplier-category.entity';
import { CausationRule } from './entities/causation-rule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SupplierCategory,
      CausationRule,
    ]),
  ],
  controllers: [SupplierCausationController],
  providers: [SupplierCausationService],
  exports: [SupplierCausationService, TypeOrmModule], 
})
export class SupplierCausationModule {}