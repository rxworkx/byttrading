import { refreshSession, redirectToLogin } from "./session";
import { getApiUrl } from "./api-url";

const API_URL = getApiUrl();

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) return request<T>(path, init, true);
    redirectToLogin();
    // The redirect above tears down the page shortly; nothing should act on
    // a rejected promise while that navigation is in flight.
    return new Promise<T>(() => {});
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new ApiError(message ?? `Request to ${path} failed`);
  }
  return data as T;
}

export const get = <T>(path: string) => request<T>(path);
export const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });
export const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });
export const del = <T>(path: string) => request<T>(path, { method: "DELETE" });

export interface Wallet {
  id: string;
  symbol: string;
  name: string;
  apiId: string | null;
  isFiat: boolean;
  fixedRateUsd: string | null;
  depositAddress: string | null;
  balance: string;
  usdRate: number | null;
  usdValue: string;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  slug: string;
  rateRange: string;
  rateNote: string | null;
  pricing: Partial<Record<"6mo" | "1yr", number>>;
  term: string | null;
  payFrequency: string;
  payWalletFrequency: string | null;
  minTerm: string;
  description: string | null;
  isActive: boolean;
}

export interface Subscription {
  id: string;
  planId: string;
  plan: InvestmentPlan;
  term: "SIX_MONTHS" | "ONE_YEAR";
  feePaidUsd: string;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED";
  startedAt: string;
  expiresAt: string;
}

export interface Investment {
  id: string;
  planId: string;
  plan: InvestmentPlan;
  walletSymbol: string;
  principal: string;
  lockedAmount: string;
  profitAccrued: string;
  profitPaid: string;
  term: string | null;
  payFrequency: string;
  payWalletFrequency: string | null;
  minTerm: string;
  status: "AWAITING" | "ACTIVE" | "LOCKED" | "COMPLETED" | "CANCELLED";
  startDate: string;
  endDate: string | null;
  nextAccrualAt: string;
  completedAt: string | null;
}

export interface Transaction {
  id: string;
  reference: string;
  type: string;
  status: string;
  amount: string;
  currencySymbol: string;
  usdEquivalent: string | null;
  destinationAddress: string | null;
  walletId: string | null;
  fromWalletId: string | null;
  toWalletId: string | null;
  relatedInvestmentId: string | null;
  adminNote: string | null;
  createdAt: string;
  confirmedAt: string | null;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface KycRecord {
  id: string;
  status: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
  documentType: string | null;
  rejectionReason: string | null;
}

export interface Referral {
  id: string;
  bonusUsd: string | null;
  triggerEvent: string | null;
  paidAt: string | null;
  createdAt: string;
  referred: { firstName: string; lastName: string; createdAt: string };
}

export const walletsApi = {
  list: () => get<Wallet[]>("/wallets"),
  transfer: (fromSymbol: string, toSymbol: string, amount: string) =>
    post<{ fromWallet: Wallet; toWallet: Wallet; transaction: Transaction }>("/wallets/transfer", {
      fromSymbol,
      toSymbol,
      amount,
    }),
  deposit: (symbol: string, amount: string, txHash?: string) =>
    post<Transaction>("/wallets/deposit", { symbol, amount, txHash }),
  withdraw: (symbol: string, amount: string, destinationAddress: string) =>
    post<Transaction>("/wallets/withdraw", { symbol, amount, destinationAddress }),
};

export const plansApi = {
  list: () => get<InvestmentPlan[]>("/plans"),
};

export const subscriptionsApi = {
  mine: () => get<Subscription[]>("/subscriptions/me"),
  subscribe: (planId: string, term: "SIX_MONTHS" | "ONE_YEAR", walletSymbol: string) =>
    post<Subscription>("/subscriptions", { planId, term, walletSymbol }),
};

export const investmentsApi = {
  mine: () => get<Investment[]>("/investments/me"),
  start: (planId: string, principal: string, walletSymbol: string) =>
    post<Investment>("/investments", { planId, principal, walletSymbol }),
  end: (id: string) => post<Investment>(`/investments/${id}/end`),
};

export const transactionsApi = {
  mine: () => get<Transaction[]>("/transactions/me"),
  get: (id: string) => get<Transaction>(`/transactions/${id}`),
};

export const notificationsApi = {
  mine: () => get<Notification[]>("/notifications/me"),
  markRead: (id: string) => patch(`/notifications/${id}/read`),
  markAllRead: () => patch("/notifications/read-all"),
};

export const kycApi = {
  mine: () => get<KycRecord>("/kyc/me"),
  submit: (input: {
    documentType: string;
    documentFrontUrl: string;
    documentBackUrl?: string;
    selfieUrl?: string;
  }) => post<KycRecord>("/kyc/submit", input),
};

export const referralsApi = {
  mine: () => get<Referral[]>("/referrals/me"),
};

export interface PublicSetting {
  key: string;
  value: string;
  valueType: "STRING" | "NUMBER" | "BOOLEAN" | "JSON";
}

export const settingsApi = {
  public: () => get<PublicSetting[]>("/settings/public"),
};
