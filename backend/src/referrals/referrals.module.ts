import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Referral } from '../database/entities';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Referral])],
  providers: [ReferralsService],
  controllers: [ReferralsController],
})
export class ReferralsModule {}
