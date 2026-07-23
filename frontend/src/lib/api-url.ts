export function getApiUrl() {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  if (typeof window !== 'undefined' && window.location?.origin) {
    return envUrl ?? `${window.location.origin}/api`;
  }

  return envUrl ?? 'http://localhost:4000/api';
}
