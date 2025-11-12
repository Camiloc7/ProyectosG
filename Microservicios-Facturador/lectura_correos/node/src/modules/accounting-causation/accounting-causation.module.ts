import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountingCausationService } from './accounting-causation.service';
import { CausationRule } from '../supplier-causation/entities/causation-rule.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([CausationRule]), 
  ],
  providers: [AccountingCausationService],
  exports: [AccountingCausationService], 
})
export class AccountingCausationModule {}