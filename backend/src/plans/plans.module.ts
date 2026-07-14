import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvestmentPlan } from '../database/entities';
import { PlansService } from './plans.service';
import { PlansController } from './plans.controller';

@Module({
  imports: [TypeOrmModule.forFeature([InvestmentPlan])],
  providers: [PlansService],
  controllers: [PlansController],
  exports: [PlansService],
})
export class PlansModule {}
