// Plan/investment terms are written in plain English ("5 days", "1 day",
// "5 min", or just "daily") instead of a bare number of days, so any unit
// down to seconds is expressible without a schema change.
const UNIT_SECONDS: Record<string, number> = {
  secondly: 1,
  second: 1,
  seconds: 1,
  minutely: 60,
  minute: 60,
  minutes: 60,
  min: 60,
  mins: 60,
  hourly: 3600,
  hour: 3600,
  hours: 3600,
  daily: 86400,
  day: 86400,
  days: 86400,
  weekly: 604800,
  week: 604800,
  weeks: 604800,
  monthly: 2592000,
  month: 2592000,
  months: 2592000,
  yearly: 31536000,
  year: 31536000,
  years: 31536000,
};

// "5 days" -> 432000, "daily" -> 86400 (a bare unit word implies a quantity
// of 1). Unrecognized units resolve to 0 rather than throwing, since this
// runs against admin-entered data that a DTO validator should already have
// rejected if malformed.
export function termToSeconds(value: string): number {
  const trimmed = value.trim();
  const spaceIndex = trimmed.indexOf(' ');
  const amount = spaceIndex === -1 ? 1 : Number(trimmed.slice(0, spaceIndex));
  const unit = spaceIndex === -1 ? trimmed : trimmed.slice(spaceIndex + 1).trim();
  const seconds = UNIT_SECONDS[unit.toLowerCase()] ?? 0;
  return amount * seconds;
}

export function termToMs(value: string): number {
  return termToSeconds(value) * 1000;
}
