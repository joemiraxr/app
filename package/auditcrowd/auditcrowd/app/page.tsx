"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ListChecks, Fingerprint, Layers, BadgeCheck } from "lucide-react";
import AppToolbar from "@/components/ui/appToolbar";
import OpportunityModal, { MatchChip, type OpportunityMatch } from "@/components/OpportunityModal";
import { useCurrentUser } from "@/context/CurrentUserContext";

const ZB_KEY = process.env.NEXT_PUBLIC_API_KEY;

function initials(name?: string): string {
  if (!name) return "—";
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

type Summary = {
  ok: boolean;
  counts?: { engagements: number; opportunities: number; tasks: number; history: number };
  engagements?: { id: string; name: string; org: string; boundary: string; frameworks: string[]; status: string; live?: boolean }[];
  opportunities?: { id: string; title: string; frameworks: string[]; match?: OpportunityMatch }[];
  tasks?: { id: string; title: string; status?: string }[];
  matchmaker?: { personalized: boolean; auditor: string | null; basis: string };
};

export default function Dashboard() {
  const { user, org } = useCurrentUser();
  const router = useRouter();
  const [seamState, setSeamState] = useState<"loading" | "ok" | "down">("loading");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  async function openDetail(id: string) {
    setDetailOpen(true);
    setDetail(null);
    const headers: Record<string, string> = ZB_KEY ? { Authorization: `APIKey ${ZB_KEY}` } : {};
    try {
      const r = await fetch(`/backend/zb/opportunity/${id}`, { headers });
      if (r.ok) setDetail(await r.json());
    } catch {
      /* leave modal in its loading state on a fetch error */
    }
  }

  useEffect(() => {
    const headers: Record<string, string> = ZB_KEY ? { Authorization: `APIKey ${ZB_KEY}` } : {};
    // The customer-backend seam: our own AuditCrowd API validates the ZB identity.
    // Its success is what makes the "Live on the ZeroBias transparency architecture"
    // pill a REAL verification, not a static label.
    fetch("/backend/zb/whoami", { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(() => setSeamState("ok"))
      .catch(() => setSeamState("down"));

    fetch("/backend/zb/summary", { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Summary) => setSummary(d))
      .catch(() => setSummary(null));
  }, []);

  const email = user?.emails?.[0] ?? user?.email;
  const counts = summary?.counts;

  return (
    <div className="ac-shell">
      <AppToolbar />

      <main className="ac-main ac-wrap">
        <header className="ac-head">
          <span className="pill">
            <span className="dot" />
            {seamState === "ok"
              ? "Live on the ZeroBias transparency architecture"
              : seamState === "down"
              ? "ZeroBias transparency architecture — reconnecting…"
              : "Verifying the ZeroBias transparency architecture…"}
          </span>
          <h1>Welcome{user?.name ? `, ${user.name.split(" ")[0]}` : ""}.</h1>
          <p className="sub">
            Your verifiable-audit workspace. One sign-in is a ZeroBias identity — every action is
            attributable, and every attestation is independently verifiable.
          </p>
        </header>

        <section className="ac-grid-cards">
          {/* Identity — from the ZB session */}
          <div className="card glass">
            <div className="c-head">
              <span className="c-ic"><Fingerprint /></span>
              <div>
                <div className="c-title">Your ZeroBias Identity</div>
                <div className="c-sub">Session-inherited · verifiable</div>
              </div>
            </div>
            <div className="id-row">
              <div className="id-avatar">{initials(user?.name)}</div>
              <div>
                <div className="id-name">{user?.name ?? "Loading…"}</div>
                <div className="id-email">{email ?? ""}</div>
              </div>
            </div>
            <div className="kv">
              <div className="kv-row"><span className="k">Organization</span><span className="v">{org?.name ?? "—"}</span></div>
              <div className="kv-row"><span className="k">Identity type</span><span className="v mono">{user ? "ZeroBias · USER" : "—"}</span></div>
            </div>
            <span className="status ok"><span className="ic" /> Authenticated</span>
          </div>

          {/* Matchmaker opportunities — live ZB engagements, ranked for this auditor */}
          <div className="card glass">
            <div className="c-head magenta">
              <span className="c-ic"><ShieldCheck /></span>
              <div>
                <div className="c-title">Matchmaker Opportunities</div>
                <div className="c-sub">
                  {summary?.matchmaker?.personalized
                    ? `${counts?.opportunities ?? 0} ranked for you`
                    : `${counts?.opportunities ?? 0} available to claim`}
                </div>
              </div>
            </div>
            <div className="rows">
              {(summary?.opportunities ?? []).slice(0, 5).map((o) => (
                <div className="row-item" key={o.id}>
                  <div
                    className="r-main"
                    onClick={() => openDetail(o.id)}
                    style={{ cursor: "pointer" }}
                    title="View engagement details"
                  >
                    <div className="r-title">
                      {o.title}
                      <span style={{ color: "#22E0FF", fontSize: 11, marginLeft: 8 }}>details →</span>
                    </div>
                    <div className="r-meta" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{(o.frameworks ?? []).join(" · ") || "assessment"}</span>
                      <MatchChip match={o.match} />
                    </div>
                  </div>
                  <button
                    className="btn btn-neon"
                    style={{ padding: "7px 16px", fontSize: 12.5 }}
                    onClick={() => openDetail(o.id)}
                  >
                    Claim
                  </button>
                </div>
              ))}
              {(!summary?.opportunities || summary.opportunities.length === 0) && (
                <p className="empty">No open opportunities right now.</p>
              )}
            </div>
            <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>
              <button
                className="btn"
                style={{ padding: "7px 14px", fontSize: 12.5, background: "transparent", border: "1px solid rgba(34,224,255,0.35)", color: "#22E0FF", borderRadius: 8, cursor: "pointer" }}
                onClick={() => router.push("/marketplace")}
                title="All open opportunities, ranked by the matchmaker"
              >
                Explore marketplace →
              </button>
            </div>
          </div>

          {/* Open tasks — the auditor's to-dos (ZB task board is source of truth) */}
          <div className="card glass">
            <div className="c-head">
              <span className="c-ic"><ListChecks /></span>
              <div>
                <div className="c-title">Open Tasks</div>
                <div className="c-sub">{counts?.tasks ?? 0} to action</div>
              </div>
            </div>
            <div className="rows">
              {(summary?.tasks ?? []).slice(0, 5).map((t) => (
                <div className="row-item" key={t.id}>
                  <div className="r-main">
                    <div className="r-title">{t.title}</div>
                    <div className="r-meta">{t.status ?? "open"}</div>
                  </div>
                </div>
              ))}
              {(!summary?.tasks || summary.tasks.length === 0) && (
                <p className="empty">No open tasks yet.</p>
              )}
            </div>
          </div>

          {/* Active engagements */}
          <div className="card glass col-6">
            <div className="c-head">
              <span className="c-ic"><Layers /></span>
              <div>
                <div className="c-title">Active Engagements</div>
                <div className="c-sub">{counts?.engagements ?? 0} in progress</div>
              </div>
            </div>
            <div className="rows">
              {(summary?.engagements ?? []).slice(0, 5).map((e) => (
                <div className="row-item" key={e.id}>
                  <div className="r-main">
                    <div className="r-title">{e.name}</div>
                    <div className="r-meta">{e.org} · boundary {e.boundary}</div>
                  </div>
                  <span className={`tag ${e.live ? "live" : ""}`}>{e.live ? "live" : e.status.replace("_", " ")}</span>
                </div>
              ))}
              {(!summary?.engagements || summary.engagements.length === 0) && (
                <p className="empty">No active engagements yet.</p>
              )}
            </div>
          </div>

          {/* Attestations — history of signed, verifiable deliverables */}
          <div className="card glass col-6">
            <div className="c-head">
              <span className="c-ic"><BadgeCheck /></span>
              <div>
                <div className="c-title">Attestations</div>
                <div className="c-sub">Signed · client-side verifiable</div>
              </div>
            </div>
            <div className="stat"><span className="n">{counts?.history ?? 0}</span><span className="l">completed & attested</span></div>
            <div className="kv">
              <div className="kv-row"><span className="k">Signature</span><span className="v mono">Ed25519</span></div>
              <div className="kv-row"><span className="k">Provenance</span><span className="v">PROV-O · ODRL</span></div>
            </div>
          </div>
        </section>
      </main>

      {detailOpen && (
        <OpportunityModal
          detail={detail}
          onClose={() => setDetailOpen(false)}
          onClaim={() => detail && router.push(`/engagement/${detail.id}`)}
        />
      )}
    </div>
  );
}
