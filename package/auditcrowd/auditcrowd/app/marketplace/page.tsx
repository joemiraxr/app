"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import AppToolbar from "@/components/ui/appToolbar";
import OpportunityModal, { MatchChip, type OpportunityMatch } from "@/components/OpportunityModal";

const ZB_KEY = process.env.NEXT_PUBLIC_API_KEY;

// ── Marketplace — every open opportunity, matchmaker-ranked for the caller ───
// The dashboard card shows the top picks; this page is the full ranked list
// ("Explore marketplace"). Same seam (/backend/zb/summary), same Tier-2 modal,
// same Claim path into /engagement/[id].

type Opportunity = {
  id: string;
  title: string;
  frameworks: string[];
  boundary?: string;
  match?: OpportunityMatch;
};

type Summary = {
  ok: boolean;
  opportunities?: Opportunity[];
  matchmaker?: { personalized: boolean; auditor: string | null; basis: string };
};

const CONFIDENCE_LABEL: Record<string, string> = {
  exact: "Strong matches",
  partial: "Framework matches",
  suggested: "More opportunities",
};

export default function Marketplace() {
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    const headers: Record<string, string> = ZB_KEY ? { Authorization: `APIKey ${ZB_KEY}` } : {};
    fetch("/backend/zb/summary", { headers })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: Summary) => setSummary(d))
      .catch(() => setSummary(null))
      .finally(() => setLoaded(true));
  }, []);

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

  // Group by confidence tier so the ranking reads as sections, not a wall.
  const tiers = useMemo(() => {
    const opps = summary?.opportunities ?? [];
    const grouped: Record<string, Opportunity[]> = { exact: [], partial: [], suggested: [] };
    for (const o of opps) {
      const c = o.match?.confidence ?? "suggested";
      (grouped[c] ?? grouped.suggested).push(o);
    }
    return grouped;
  }, [summary]);

  const total = summary?.opportunities?.length ?? 0;

  return (
    <div className="ac-shell">
      <AppToolbar />

      <main className="ac-main ac-wrap">
        <header className="ac-head">
          <span className="pill">
            <span className="dot" />
            {summary?.matchmaker?.personalized
              ? `Ranked for ${summary.matchmaker.auditor ?? "you"} — ${summary.matchmaker.basis}`
              : "Open marketplace — sign-in match pending"}
          </span>
          <h1>Marketplace</h1>
          <p className="sub">
            Every open engagement on the transparency architecture, ranked by how well it fits your
            registered expertise. Evaluate before you claim — every claim binds to a sealed snapshot.
          </p>
        </header>

        <section className="ac-grid-cards">
          {(["exact", "partial", "suggested"] as const).map((tier) =>
            tiers[tier].length === 0 ? null : (
              <div className="card glass col-6" key={tier} style={{ gridColumn: "1 / -1" }}>
                <div className="c-head">
                  <span className="c-ic"><ShieldCheck /></span>
                  <div>
                    <div className="c-title">{CONFIDENCE_LABEL[tier]}</div>
                    <div className="c-sub">{tiers[tier].length} of {total}</div>
                  </div>
                </div>
                <div className="rows">
                  {tiers[tier].map((o) => (
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
                          {o.boundary && <span>· boundary {o.boundary}</span>}
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
                </div>
              </div>
            )
          )}

          {loaded && total === 0 && (
            <div className="card glass" style={{ gridColumn: "1 / -1" }}>
              <p className="empty">No open opportunities right now — check back soon.</p>
            </div>
          )}
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
