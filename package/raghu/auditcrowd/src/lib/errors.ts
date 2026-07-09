/**
 * Turns any thrown value into a safe, user-facing message.
 *
 * Feature code should show `toUserMessage(err)` in the UI and log the raw `err`
 * to the console for developers — never surface the raw error text, which can
 * leak backend details (SQL, hostnames, stack traces).
 */

/** Best-effort extraction of an HTTP status from common client/axios error shapes. */
function httpStatusOf(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const e = err as {
    status?: unknown;
    response?: { status?: unknown };
  };
  const candidate = e.response?.status ?? e.status;
  return typeof candidate === "number" ? candidate : undefined;
}

/** A request that never got a response (network down, CORS, DNS, timeout). */
function isNetworkError(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  const e = err as { code?: unknown; response?: unknown; request?: unknown };
  if (e.code === "ERR_NETWORK" || e.code === "ECONNABORTED") return true;
  // axios sets `request` but not `response` when the request was sent but
  // nothing came back.
  return e.request != null && e.response == null;
}

export function toUserMessage(err: unknown): string {
  const status = httpStatusOf(err);

  if (status === 401 || status === 403) {
    return "You don't have permission to do that, or your session may have expired. Try signing in again.";
  }
  if (status === 404) {
    return "We couldn't find what you were looking for.";
  }
  if (status === 429) {
    return "Too many requests right now — please wait a moment and try again.";
  }
  if (status !== undefined && status >= 500) {
    return "The server ran into a problem. Please try again in a moment.";
  }
  if (isNetworkError(err)) {
    return "Couldn't reach the server. Check your connection and try again.";
  }
  return "Something went wrong. Please try again.";
}
