import {
  get,
  patch,
  post,
  del,
  type Wallet,
  type Subscription,
  type Investment,
  type InvestmentPlan,
  type Transaction,
} from "./dashboard-api";

export interface AdminStats {
  totalUsers: number;
  newUsersLast7Days: number;
  pendingKycCount: number;
  pendingApprovalCount: number;
  depositsTotalUsd: number;
  depositsCount: number;
  depositsPendingCount: number;
  depositsPendingUsd: number;
  depositsThisWeekUsd: number;
  withdrawalsTotalUsd: number;
  withdrawalsCount: number;
  withdrawalsPendingCount: number;
  withdrawalsPendingUsd: number;
  withdrawalsThisWeekUsd: number;
  netTransactionsUsd: number;
  activeSubscriptionsCount: number;
  activeInvestmentsCount: number;
  activeInvestmentsPrincipal: number;
  totalProfitCreditedUsd: number;
  totalReferralCommissionsUsd: number;
  platformUsdBalance: number;
}

export interface AdminDailyActivity {
  date: string;
  deposits: number;
  withdrawals: number;
  profit: number;
  trades: number;
}

export type UserStatus = "AWAITING" | "ACTIVE" | "SUSPENDED" | "DISABLED";

export interface TxLimit {
  freeze: boolean;
  maxWithdrawal: number | null;
}

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  referralCode: string;
  role: "USER" | "ADMIN";
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  status: UserStatus;
  freeze: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  kycStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  balanceUsd: number;
  tradesUsd: number;
  activeTradesUsd: number;
  earningsUsd: number;
  referralCommissionUsd: number;
  depositsUsd: number;
  withdrawalsUsd: number;
}

export interface AdminKycRecord {
  id: string;
  userId: string;
  status: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  documentType: string | null;
  documentFrontUrl: string | null;
  documentBackUrl: string | null;
  selfieUrl: string | null;
  rejectionReason: string | null;
  submittedAt: string | null;
}

export interface AdminUserStats {
  balanceUsd: number;
  tradesUsd: number;
  activeTradesUsd: number;
  earningsUsd: number;
  referralCommissionUsd: number;
  depositsUsd: number;
  pendingDepositsUsd: number;
  withdrawalsUsd: number;
}

export interface AdminUserDetail {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    country: string | null;
    role: "USER" | "ADMIN";
    isEmailVerified: boolean;
    twoFactorEnabled: boolean;
    status: UserStatus;
    txLimit: TxLimit;
    referralCode: string;
    createdAt: string;
    lastLoginAt: string | null;
  };
  stats: AdminUserStats;
  kyc: AdminKycRecord;
  wallets: Wallet[];
  subscriptions: Subscription[];
  investments: Investment[];
  transactions: Transaction[];
}

export interface AdminReferralSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  referralCode: string;
  status: UserStatus;
}

export interface AdminUserReferrals {
  upline: AdminReferralSummary | null;
  downlines: AdminReferralSummary[];
}

export interface AdminTransaction extends Transaction {
  userId: string;
}

export interface AdminSetting {
  key: string;
  value: string;
  valueType: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
  description: string | null;
}

export const adminApi = {
  stats: () => get<AdminStats>("/admin/stats"),
  dailyActivity: (days?: number) => get<AdminDailyActivity[]>(`/admin/stats/daily${days ? `?days=${days}` : ""}`),
  users: () => get<AdminUser[]>("/admin/users"),
  userDetail: (id: string) => get<AdminUserDetail>(`/admin/users/${id}`),
  setUserRole: (id: string, role: "USER" | "ADMIN") =>
    patch<AdminUser>(`/admin/users/${id}/role`, { role }),
  setUserStatus: (id: string, status: UserStatus) =>
    patch<AdminUser>(`/admin/users/${id}/status`, { status }),
  // Real hard delete: permanently erases the user and everything owned by
  // them (wallets, transactions, trades, KYC, referral links). No undo.
  deleteUser: (id: string) => del<void>(`/admin/users/${id}`),
  setUserTxLimit: (id: string, updates: { freeze?: boolean; maxWithdrawal?: number | null }) =>
    patch<AdminUser>(`/admin/users/${id}/tx-limit`, updates),
  getUserReferrals: (id: string) => get<AdminUserReferrals>(`/admin/users/${id}/referrals`),
  updateUserProfile: (
    id: string,
    updates: { firstName?: string; lastName?: string; email?: string; phone?: string; country?: string },
  ) => patch(`/admin/users/${id}/profile`, updates),
  setUserVerification: (id: string, updates: { isEmailVerified?: boolean; twoFactorEnabled?: boolean }) =>
    patch<AdminUser>(`/admin/users/${id}/verification`, updates),
};

export const adminKycApi = {
  pending: () => get<AdminKycRecord[]>("/kyc/pending"),
  approve: (id: string) => patch(`/kyc/${id}/approve`),
  reject: (id: string, reason: string) => patch(`/kyc/${id}/reject`, { reason }),
};

export const adminTransactionsApi = {
  pending: () => get<AdminTransaction[]>("/transactions/pending"),
  confirm: (id: string, note?: string) => patch(`/transactions/${id}/confirm`, { note }),
  reject: (id: string, note?: string) => patch(`/transactions/${id}/reject`, { note }),
};

export const adminSettingsApi = {
  list: () => get<AdminSetting[]>("/settings"),
  setValue: (key: string, value: string) => post(`/settings/${key}`, { value }),
};

export interface AdminDepositAddress {
  symbol: string;
  name: string;
  address: string | null;
  updatedAt: string | null;
}

export const adminDepositAddressesApi = {
  list: () => get<AdminDepositAddress[]>("/admin/deposit-addresses"),
  setAddress: (symbol: string, address: string) =>
    patch<AdminDepositAddress>(`/admin/deposit-addresses/${symbol}`, { address }),
};

export interface AdminUserDepositAddress {
  symbol: string;
  name: string;
  address: string | null;
  isOverride: boolean;
  updatedAt: string | null;
}

export const adminUserDepositAddressesApi = {
  list: (userId: string) => get<AdminUserDepositAddress[]>(`/admin/users/${userId}/deposit-addresses`),
  setAddress: (userId: string, symbol: string, address: string) =>
    patch<AdminUserDepositAddress>(`/admin/users/${userId}/deposit-addresses/${symbol}`, { address }),
};

export interface AdminAsset {
  symbol: string;
  name: string;
  image: string;
  price: string | null;
  priceChange: string | null;
  fetchedAt: string | null;
  enabled: boolean;
  showInWalletList: boolean;
  sortOrder: number;
}

export interface UpdateAssetPayload {
  enabled?: boolean;
  showInWalletList?: boolean;
  sortOrder?: number;
}

export const adminAssetsApi = {
  list: () => get<AdminAsset[]>("/admin/assets"),
  update: (symbol: string, payload: UpdateAssetPayload) =>
    patch<AdminAsset>(`/admin/assets/${symbol}`, payload),
};

export interface AdminInvestment {
  id: string;
  reference: string;
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
  principal: string;
  profitAccrued: string;
  status: "AWAITING" | "ACTIVE" | "LOCKED" | "COMPLETED" | "CANCELLED";
  term: string | null;
  startDate: string;
  endDate: string | null;
  completedAt: string | null;
}

export const adminInvestmentsApi = {
  list: (status?: "active" | "COMPLETED" | "CANCELLED", userId?: string) => {
    const query = new URLSearchParams();
    if (status) query.set("status", status);
    if (userId) query.set("userId", userId);
    const qs = query.toString();
    return get<AdminInvestment[]>(`/admin/investments${qs ? `?${qs}` : ""}`);
  },
  complete: (id: string) => post<AdminInvestment>(`/admin/investments/${id}/complete`),
  cancel: (id: string) => post<AdminInvestment>(`/admin/investments/${id}/cancel`),
  setStatus: (id: string, status: AdminInvestment["status"]) =>
    patch<AdminInvestment>(`/admin/investments/${id}/status`, { status }),
  // Only completed/cancelled trades can be deleted (an active one still has
  // real funds locked with no wallet reversal on record). Real hard delete.
  delete: (id: string) => del<void>(`/admin/investments/${id}`),
  // Credits profit immediately, either as a rate against the current locked
  // amount or a direct USD amount, instead of waiting for the scheduled
  // accrual cycle (which can be days away). Doesn't reschedule the automatic
  // cycle, it's additive. Pass exactly one of ratePercent/amount.
  accrue: (id: string, input: { ratePercent?: string; amount?: string }) =>
    post(`/investments/${id}/accrue`, input),
};

export type ManualTransactionActionType =
  | "DEPOSIT"
  | "WITHDRAWAL"
  | "FUND_TRADING"
  | "PLACE_TRADE"
  | "BUY_SUBSCRIPTION"
  | "ADJUSTMENT";

export const adminManualTransactionApi = {
  create: (input: {
    userId: string;
    actionType: ManualTransactionActionType;
    symbol?: string;
    amount?: string;
    planId?: string;
    term?: "SIX_MONTHS" | "ONE_YEAR";
    walletSymbol?: string;
    note?: string;
  }) => post<Transaction>("/admin/transactions/manual", input),
};

export const adminNotificationsApi = {
  send: (input: { userId?: string; title: string; body: string; type?: string; sendEmail?: boolean }) =>
    post("/admin/notifications", input),
};

export interface AdminNotificationLog {
  id: string;
  sentByAdminId: string | null;
  userId: string | null;
  recipientLabel: string;
  recipientCount: number;
  type: string;
  title: string;
  body: string;
  sentEmail: boolean;
  createdAt: string;
}

export const adminNotificationLogApi = {
  list: () => get<AdminNotificationLog[]>("/admin/notifications/sent"),
  // Deletes only the log entry (audit trail), never the underlying
  // per-user notifications already sitting in anyone's notification bell.
  delete: (id: string) => del<void>(`/admin/notifications/sent/${id}`),
};

export interface AdminEarningsTransaction extends Transaction {
  userId: string;
  userName: string;
  userEmail: string;
}

export interface AdminEarnings {
  totalProfitCredited: number;
  totalReferralCommissions: number;
  transactions: AdminEarningsTransaction[];
}

export const adminEarningsApi = {
  get: (userId?: string) => get<AdminEarnings>(`/admin/earnings${userId ? `?userId=${userId}` : ""}`),
};

export interface AdminLedgerTransaction extends Transaction {
  userId: string;
  userName: string;
  userEmail: string;
}

export const adminLedgerApi = {
  list: (params: { type?: string; status?: string; userId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.type) query.set("type", params.type);
    if (params.status) query.set("status", params.status);
    if (params.userId) query.set("userId", params.userId);
    const qs = query.toString();
    return get<AdminLedgerTransaction[]>(`/admin/transactions/all${qs ? `?${qs}` : ""}`);
  },
  setStatus: (id: string, status: "PENDING" | "COMPLETED" | "CANCELLED") =>
    patch<AdminLedgerTransaction>(`/admin/transactions/${id}/status`, { status }),
  // Only deposits and withdrawals can be deleted (every other type's wallet
  // effect is entangled with another entity). Real hard delete.
  delete: (id: string) => del<void>(`/admin/transactions/${id}`),
};

export interface AdminSubscription extends Subscription {
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
}

export const adminSubscriptionsApi = {
  list: (userId?: string) =>
    get<AdminSubscription[]>(`/admin/subscriptions${userId ? `?userId=${userId}` : ""}`),
};

export const adminPlansApi = {
  list: () => get<InvestmentPlan[]>("/admin/plans"),
  update: (id: string, updates: Partial<InvestmentPlan>) =>
    patch<InvestmentPlan>(`/admin/plans/${id}`, updates),
};
