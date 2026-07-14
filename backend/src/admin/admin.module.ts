import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Asset,
  AssetDepositAddress,
  Investment,
  InvestmentPlan,
  Kyc,
  NotificationLog,
  Referral,
  Subscription,
  Transaction,
  User,
  UserAssetDepositAddress,
  Wallet,
} from '../database/entities';
import { KycModule } from '../kyc/kyc.module';
import { WalletsModule } from '../wallets/wallets.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { InvestmentsModule } from '../investments/investments.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Kyc,
      Wallet,
      Subscription,
      Investment,
      InvestmentPlan,
      Transaction,
      AssetDepositAddress,
      UserAssetDepositAddress,
      Referral,
      Asset,
      NotificationLog,
    ]),
    KycModule,
    WalletsModule,
    SubscriptionsModule,
    InvestmentsModule,
    TransactionsModule,
    NotificationsModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
