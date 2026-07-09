"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useSession } from "@/context/session-context";

/**
 * Blocks the app until we have an authenticated user.
 *
 * We render NOTHING app-facing until `user` resolves because:
 *  - In uat/qa/prod, if there is no session the client has already redirected
 *    the browser to the platform login (see docs/authentication.md), so this
 *    screen shows only for the brief moment before that navigation.
 *  - In local dev, `whoAmI()` resolves from the API-key interceptor.
 *
 * No custom login form — the platform owns login.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const { user } = useSession();
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (user) return <>{children}</>;

  return (
    <div className="gate">
      <div className="gate-card">
        <div className="spinner" aria-hidden />
        <p>Connecting to ZeroBias…</p>
        {slow && (
          <p className="gate-hint">
            Still connecting. If this persists you may not have a valid session
            (prod) or API key (local dev). Check <code>.env.development</code>.
          </p>
        )}
      </div>
    </div>
  );
}
