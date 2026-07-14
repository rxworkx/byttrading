export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum UserStatus {
  AWAITING = 'AWAITING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
}

export enum KycStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum PlanTerm {
  SIX_MONTHS = 'SIX_MONTHS',
  ONE_YEAR = 'ONE_YEAR',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum InvestmentStatus {
  AWAITING = 'AWAITING',
  ACTIVE = 'ACTIVE',
  // LOCKED is retained only because Postgres enum values can't be dropped;
  // no code should write it anymore, existing rows were backfilled to ACTIVE.
  LOCKED = 'LOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  SUBSCRIPTION = 'SUBSCRIPTION',
  INVESTMENT_LOCK = 'INVESTMENT_LOCK',
  PROFIT_CREDIT = 'PROFIT_CREDIT',
  PRINCIPAL_RELEASE = 'PRINCIPAL_RELEASE',
  REFERRAL_BONUS = 'REFERRAL_BONUS',
  ADMIN_ADJUSTMENT = 'ADMIN_ADJUSTMENT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  // REJECTED is retained only because Postgres enum values can't be dropped;
  // no code should write it anymore, rejections now write CANCELLED.
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export enum NotificationType {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  TRANSACTION = 'TRANSACTION',
  KYC = 'KYC',
  INVESTMENT = 'INVESTMENT',
  REFERRAL = 'REFERRAL',
}

export enum TokenType {
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  PASSWORD_RESET = 'PASSWORD_RESET',
  REFRESH = 'REFRESH',
  TWO_FACTOR_OTP = 'TWO_FACTOR_OTP',
}

export enum SettingValueType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}
