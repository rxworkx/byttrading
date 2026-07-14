import { refreshSession, redirectToLogin } from "./session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new ApiError(message ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  country?: string | null;
  role: "USER" | "ADMIN";
  isEmailVerified: boolean;
  twoFactorEnabled: boolean;
  isApproved: boolean;
  autoWithdrawalEnabled: boolean;
  referralCode: string;
  createdAt?: string;
}

export function signup(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country?: string;
  phone?: string;
  referralCode?: string;
}) {
  return post<{ user: PublicUser }>("/auth/signup", input);
}

export function login(input: { email: string; password: string }) {
  return post<{ requiresOtp?: boolean; ref?: string; user?: PublicUser }>("/auth/login", input);
}

export function adminLogin(input: { username: string; password: string }) {
  return post<{ user: PublicUser }>("/auth/admin-login", input);
}

export function verifyOtp(input: { ref: string; code: string }) {
  return post<{ user: PublicUser }>("/auth/verify-otp", input);
}

export function verifyEmail(token: string) {
  return post<{ message: string }>("/auth/verify-email", { token });
}

export function resendVerification(email: string) {
  return post<{ message: string }>("/auth/resend-verification", { email });
}

export function forgotPassword(email: string) {
  return post<{ message: string }>("/auth/forgot-password", { email });
}

export function resetPassword(input: { token: string; newPassword: string }) {
  return post<{ message: string }>("/auth/reset-password", input);
}

export function logout() {
  return post<{ message: string }>("/auth/logout", {});
}

export async function getMe(isRetry = false): Promise<PublicUser | null> {
  const res = await fetch(`${API_URL}/auth/me`, { credentials: "include", cache: "no-store" });
  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) return getMe(true);
    return null;
  }
  if (!res.ok) return null;
  return res.json();
}

// Unlike post() above (also used for login, where a 401 legitimately means
// "wrong credentials"), every PATCH here requires an existing session, so a
// 401 means the access token expired rather than bad input.
async function patch<T>(path: string, body: unknown, isRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 401 && !isRetry) {
    const refreshed = await refreshSession();
    if (refreshed) return patch<T>(path, body, true);
    redirectToLogin();
    return new Promise<T>(() => {});
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
    throw new ApiError(message ?? "Something went wrong. Please try again.");
  }
  return data as T;
}

export function setTwoFactor(enabled: boolean) {
  return patch<{ message: string; twoFactorEnabled: boolean }>("/auth/2fa", { enabled });
}

export function setAutoWithdrawal(enabled: boolean) {
  return patch<{ message: string; autoWithdrawalEnabled: boolean }>("/auth/auto-withdrawal", { enabled });
}

export function changePassword(input: { currentPassword: string; newPassword: string }) {
  return post<{ message: string }>("/auth/change-password", input);
}

export function updateProfile(input: {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  country?: string;
}) {
  return patch<PublicUser>("/auth/me", input);
}
