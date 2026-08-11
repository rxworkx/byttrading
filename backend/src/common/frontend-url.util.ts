import { ConfigService } from '@nestjs/config';

// FRONTEND_URL can hold a comma-separated list of allowed origins (main.ts
// splits it the same way for CORS, e.g. "https://www.byttrading.com,
// https://byttrading.com"). Anywhere we're building an actual link — email
// verify/reset URLs, the branded email header — we need exactly one origin,
// not the raw env value, or the link comes out as
// "https://www.byttrading.com,https://byttrading.com/verify-email?..."
// which looks like a mangled double URL to whoever clicks it. This always
// takes the first origin in the list as the canonical one for links.
export function primaryFrontendUrl(config: ConfigService): string {
  const raw = config.get<string>('FRONTEND_URL') ?? 'https://byttrading.com';
  const first = raw.split(',')[0]?.trim();
  return first || 'https://byttrading.com';
}
