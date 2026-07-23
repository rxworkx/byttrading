import { getApiUrl } from "./api-url";

const API_URL = getApiUrl();

// Access tokens are short lived (15 minutes). Any authenticated request can
// hit a 401 once the token expires, so this refreshes the session once via
// the refresh token cookie and lets the caller retry, instead of every page
// crashing with an uncaught "Unauthorized" whenever a user is idle for a
// while. Concurrent 401s share one in-flight refresh instead of racing.
let refreshPromise: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
