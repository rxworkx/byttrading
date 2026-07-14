const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) throw new Error(`Invalid duration string: ${duration}`);
  const [, amount, unit] = match;
  return Number(amount) * UNIT_MS[unit];
}
