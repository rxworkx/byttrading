import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Notification,
  Referral,
  Subscription,
  Transaction,
  Wallet,
} from '../database/entities';
import { PlansModule } from '../plans/plans.module';
import { SettingsModule } from '../settings/settings.module';
import { WalletsModule } from '../wallets/wallets.module';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      Wallet,
      Transaction,
      Referral,
      Notification,
    ]),
    PlansModule,
    SettingsModule,
    WalletsModule,
  ],
  providers: [SubscriptionsService],
  controllers: [SubscriptionsController],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
