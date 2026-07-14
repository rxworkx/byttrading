export * from './enums';
export * from './user.entity';
export * from './wallet-account.entity';
export * from './wallet.entity';
export * from './investment-plan.entity';
export * from './subscription.entity';
export * from './investment.entity';
export * from './transaction.entity';
export * from './kyc.entity';
export * from './notification.entity';
export * from './notification-log.entity';
export * from './token.entity';
export * from './referral.entity';
export * from './asset.entity';
export * from './setting.entity';
export * from './asset-deposit-address.entity';
export * from './user-asset-deposit-address.entity';

import { User } from './user.entity';
import { WalletAccount } from './wallet-account.entity';
import { Wallet } from './wallet.entity';
import { InvestmentPlan } from './investment-plan.entity';
import { Subscription } from './subscription.entity';
import { Investment } from './investment.entity';
import { Transaction } from './transaction.entity';
import { Kyc } from './kyc.entity';
import { Notification } from './notification.entity';
import { NotificationLog } from './notification-log.entity';
import { Token } from './token.entity';
import { Referral } from './referral.entity';
import { Asset } from './asset.entity';
import { Setting } from './setting.entity';
import { AssetDepositAddress } from './asset-deposit-address.entity';
import { UserAssetDepositAddress } from './user-asset-deposit-address.entity';

export const entityList = [
  User,
  WalletAccount,
  Wallet,
  InvestmentPlan,
  Subscription,
  Investment,
  Transaction,
  Kyc,
  Notification,
  NotificationLog,
  Token,
  Referral,
  Asset,
  Setting,
  AssetDepositAddress,
  UserAssetDepositAddress,
];
