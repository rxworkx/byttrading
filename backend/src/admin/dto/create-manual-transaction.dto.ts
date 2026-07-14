import { IsIn, IsOptional, IsString } from 'class-validator';
import { PlanTerm } from '../../database/entities';

export const MANUAL_TRANSACTION_ACTION_TYPES = [
  'DEPOSIT',
  'WITHDRAWAL',
  'PLACE_TRADE',
  'BUY_SUBSCRIPTION',
  'ADJUSTMENT',
] as const;

export type ManualTransactionActionType =
  (typeof MANUAL_TRANSACTION_ACTION_TYPES)[number];

export class CreateManualTransactionDto {
  @IsString()
  userId: string;

  @IsIn(MANUAL_TRANSACTION_ACTION_TYPES)
  actionType: ManualTransactionActionType;

  // DEPOSIT, WITHDRAWAL, ADJUSTMENT: the wallet asset symbol.
  @IsOptional()
  @IsString()
  symbol?: string;

  // DEPOSIT, WITHDRAWAL, PLACE_TRADE: unsigned amount.
  // ADJUSTMENT: signed, positive credits the wallet, negative debits it.
  @IsOptional()
  @IsString()
  amount?: string;

  // PLACE_TRADE, BUY_SUBSCRIPTION
  @IsOptional()
  @IsString()
  planId?: string;

  // BUY_SUBSCRIPTION
  @IsOptional()
  @IsIn(Object.values(PlanTerm))
  term?: PlanTerm;

  // PLACE_TRADE: which wallet funds the trade. BUY_SUBSCRIPTION: which
  // wallet pays the subscription fee.
  @IsOptional()
  @IsString()
  walletSymbol?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
