import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Asset,
  AssetDepositAddress,
  Transaction,
  User,
  UserAssetDepositAddress,
  Wallet,
  WalletAccount,
} from '../database/entities';
import { PricesModule } from '../prices/prices.module';
import { SettingsModule } from '../settings/settings.module';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Wallet,
      WalletAccount,
      Transaction,
      AssetDepositAddress,
      UserAssetDepositAddress,
      User,
      Asset,
    ]),
    PricesModule,
    SettingsModule,
  ],
  providers: [WalletsService],
  controllers: [WalletsController],
  exports: [WalletsService],
})
export class WalletsModule {}
