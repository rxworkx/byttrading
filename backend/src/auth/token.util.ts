import { createHash, randomBytes, randomInt } from 'crypto';

export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateOtpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
