import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { validate } from './config/env.validation';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { WalletsModule } from './wallets/wallets.module';
import { PricesModule } from './prices/prices.module';
import { SettingsModule } from './settings/settings.module';
import { TransactionsModule } from './transactions/transactions.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { InvestmentsModule } from './investments/investments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { KycModule } from './kyc/kyc.module';
import { ReferralsModule } from './referrals/referrals.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ApprovedGuard } from './common/guards/approved.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    ScheduleModule.forRoot(),
    DatabaseModule,
    MailModule,
    UsersModule,
    PricesModule,
    SettingsModule,
    WalletsModule,
    TransactionsModule,
    PlansModule,
    SubscriptionsModule,
    InvestmentsModule,
    NotificationsModule,
    KycModule,
    ReferralsModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ApprovedGuard },
  ],
})
export class AppModule {}
