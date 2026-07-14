// Exported so the admin DTO can validate at the door with the exact same
// rule this parses against, instead of the two drifting apart.
export const RATE_RANGE_PATTERN = /^\d+(\.\d+)?(-\d+(\.\d+)?)?$/;

// Rejects anything that isn't a bare number or a "min-max" pair (e.g. "10%"
// or an empty string) instead of silently deriving NaN, which would
// otherwise flow straight into profit, lockedAmount, and the payout wallet
// balance with no error ever surfacing.
export function parseRateRange(range: string): { min: number; max: number } {
  const trimmed = range.trim();
  if (!RATE_RANGE_PATTERN.test(trimmed)) {
    throw new Error(`Invalid rate range "${range}", expected "min-max" (e.g. "0.25-0.6")`);
  }
  const [min, max] = trimmed.split('-').map(Number);
  return { min, max: max ?? min };
}

export function pickRandomRatePercent(range: string): number {
  const { min, max } = parseRateRange(range);
  const value = min + Math.random() * (max - min);
  return Math.round(value * 1000) / 1000;
}
