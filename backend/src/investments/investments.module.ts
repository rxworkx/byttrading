import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Investment,
  Notification,
  Referral,
  Subscription,
  Transaction,
  Wallet,
} from '../database/entities';
import { PlansModule } from '../plans/plans.module';
import { SettingsModule } from '../settings/settings.module';
import { WalletsModule } from '../wallets/wallets.module';
import { InvestmentsService } from './investments.service';
import { InvestmentsController } from './investments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Investment,
      Subscription,
      Wallet,
      Transaction,
      Notification,
      Referral,
    ]),
    PlansModule,
    SettingsModule,
    WalletsModule,
  ],
  providers: [InvestmentsService],
  controllers: [InvestmentsController],
  exports: [InvestmentsService],
})
export class InvestmentsModule {}
