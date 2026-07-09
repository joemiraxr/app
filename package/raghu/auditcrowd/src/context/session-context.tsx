"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Subscription } from "rxjs";
import type { Org, WhoAmI } from "@zerobias-com/dana-sdk";
import type { ZerobiasClientApi } from "@zerobias-com/zerobias-client";
import { getZerobiasAppService } from "@/lib/zerobias-app-service";

type SessionState = {
  /** True once the client has initialized and the first whoAmI has resolved. */
  ready: boolean;
  user: WhoAmI | undefined;
  org: Org | undefined;
  /** Direct SDK access for feature pages. Undefined until ready. */
  api: ZerobiasClientApi | undefined;
  selectOrg: (org: Org) => Promise<void>;
  logout: () => void;
};

const SessionContext = createContext<SessionState | null>(null);

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within <SessionProvider>");
  }
  return ctx;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<WhoAmI | undefined>(undefined);
  const [org, setOrg] = useState<Org | undefined>(undefined);
  const [api, setApi] = useState<ZerobiasClientApi | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    const subs: Subscription[] = [];

    getZerobiasAppService()
      .then((service) => {
        if (!mounted) return;
        setApi(service.api);

        subs.push(service.app.getWhoAmI().subscribe((u) => mounted && setUser(u)));
        subs.push(
          service.app.getCurrentOrg().subscribe((o) => mounted && setOrg(o)),
        );
        setReady(true);
      })
      .catch((err) => {
        // init() failure (network, etc). In prod a missing session redirects
        // rather than rejecting, so a reject here is a genuine bootstrap error.
        console.error("ZeroBias client bootstrap failed", err);
      });

    return () => {
      mounted = false;
      subs.forEach((s) => s.unsubscribe());
    };
  }, []);

  const value = useMemo<SessionState>(
    () => ({
      ready,
      user,
      org,
      api,
      selectOrg: async (next: Org) => {
        const service = await getZerobiasAppService();
        await service.app.selectOrg(next);
      },
      logout: () => {
        void getZerobiasAppService().then((service) => service.app.onLogout());
      },
    }),
    [ready, user, org, api],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
