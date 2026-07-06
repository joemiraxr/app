"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ListChecks, Fingerprint, Layers, BadgeCheck } from "lucide-react";
import AppToolbar from "@/components/ui/appToolbar";
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
  opportunities?: { id: string; title: string; frameworks: string[] }[];
  tasks?: { id: string; title: string; status?: string }[];
};

// ── Opportunity detail popup (Tier 2 — "evaluate before you claim") ──────────
// Renders the seam's /zb/opportunity/{id}. Fields the engagement doesn't yet
// carry come back "pending" and render muted, so the auditor sees the full shape
// honestly. Spec: auditcrowd-lab/docs/auditor-engagement-ux-spec.md.

function isPendingVal(v: unknown): boolean {
  return v == null || (typeof v === "string" && /pending|unknown/i.test(v));
}

function KV({ k, v }: { k: string; v: unknown }): JSX.Element {
  const pending = isPendingVal(v);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "4px 0", fontSize: 13 }}>
      <span style={{ color: "#8b9bbb" }}>{k}</span>
      <span style={{ color: pending ? "#5b6b8c" : "#e6ecf7", textAlign: "right", fontStyle: pending ? "italic" : "normal" }}>
        {v == null ? "pending" : String(v)}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }): JSX.Element {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#22E0FF", marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}

function GatePill({ label, value }: { label: string; value: unknown }): JSX.Element {
  const pending = isPendingVal(value);
  return (
    <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${pending ? "rgba(250,204,21,0.3)" : "rgba(52,211,153,0.3)"}`, background: pending ? "rgba(250,204,21,0.08)" : "rgba(52,211,153,0.08)" }}>
      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.5, color: "#8b9bbb" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: pending ? "#facc15" : "#34d399", marginTop: 2 }}>{pending ? "pending" : String(value)}</div>
    </div>
  );
}

function OpportunityModal({ detail, onClose, onClaim }: { detail: any; onClose: () => void; onClaim: () => void }): JSX.Element {
  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(4,6,14,0.72)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "6vh 16px", overflowY: "auto" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 620, background: "linear-gradient(180deg, rgba(16,22,40,0.96), rgba(10,14,28,0.96))", border: "1px solid rgba(148,163,184,0.18)", borderRadius: 16, padding: 22, boxShadow: "0 24px 80px rgba(0,0,0,0.6)", color: "#e6ecf7" }}
      >
        {!detail ? (
          <div style={{ padding: 40, textAlign: "center", color: "#8b9bbb" }}>Loading engagement…</div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{detail.name}</div>
                <div style={{ fontSize: 12.5, color: "#8b9bbb", marginTop: 2 }}>
                  {detail.framework} · assessed on SCF · <span style={{ textTransform: "capitalize" }}>{detail.sector}</span> · {detail.status}
                </div>
              </div>
              <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#8b9bbb", fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>

            {/* The two gates every auditor checks first */}
            <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
              <GatePill label="Snapshot sealed" value={detail.gates?.snapshot_sealed} />
              <GatePill label="Crosswalk coverage" value={detail.gates?.crosswalk?.coverage} />
            </div>
            <div style={{ fontSize: 11, color: "#5b6b8c", marginTop: 6 }}>
              An auditor checks these first — verdicts must bind to a frozen, hash-signed snapshot, and the SCF→{detail.framework} crosswalk must be complete before attesting.
            </div>

            <Section title="Scope">
              <KV k="Framework" v={detail.scope?.framework} />
              <KV k="Assessed on" v={detail.scope?.assessed_on} />
              <KV k="Control set" v={detail.scope?.control_set} />
              <KV k="Exclusions" v={detail.scope?.exclusions} />
            </Section>

            <Section title="Target">
              <KV k="Boundary" v={detail.target?.boundary_name} />
              <KV k="Provider" v={detail.target?.provider} />
              <KV k="Account" v={detail.target?.account} />
              <KV k="Region" v={detail.target?.region} />
            </Section>

            <Section title="Evidence & effort">
              <KV k="Engine status" v={detail.evidence?.engine_status} />
              <KV k="Controls" v={detail.effort?.control_count} />
              <KV k="Exceptions" v={detail.effort?.exceptions} />
              <KV k="Term" v={detail.effort?.term} />
            </Section>

            <Section title="Independence">
              <KV k="Data owner" v={detail.independence?.data_owner} />
              <div style={{ fontSize: 11.5, color: "#5b6b8c", marginTop: 2 }}>{detail.independence?.note}</div>
            </Section>

            <Section title="Commercial">
              <KV k="Fee" v={detail.commercial?.fee} />
              <KV k="Payment trigger" v={detail.commercial?.payment_trigger} />
              <KV k="Liability cap" v={detail.commercial?.liability_cap} />
              <KV k="Deliverable" v={detail.commercial?.deliverable} />
            </Section>

            {detail.sector_block && (
              <Section title={`${detail.sector_block.label} — sector requirements`}>
                {Object.entries(detail.sector_block.fields || {}).map(([k, v]) => (
                  <KV key={k} k={k} v={v} />
                ))}
              </Section>
            )}

            <div style={{ marginTop: 16, padding: 10, borderRadius: 8, background: "rgba(34,224,255,0.06)", border: "1px solid rgba(34,224,255,0.15)", fontSize: 12, color: "#9fb2d6" }}>
              {detail.acceptance_note}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button onClick={onClose} style={{ background: "transparent", border: "1px solid rgba(148,163,184,0.3)", color: "#9aa8c4", borderRadius: 8, padding: "8px 16px", cursor: "pointer" }}>Close</button>
              <button
                onClick={onClaim}
                title="Opens the full engagement + formal contract acceptance"
                style={{ background: "linear-gradient(90deg,#22E0FF,#A78BFA)", border: "none", color: "#05060C", fontWeight: 700, borderRadius: 8, padding: "8px 18px", cursor: "pointer" }}
              >
                Claim &amp; continue →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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

          {/* Matchmaker opportunities — live ZB engagements to claim */}
          <div className="card glass">
            <div className="c-head magenta">
              <span className="c-ic"><ShieldCheck /></span>
              <div>
                <div className="c-title">Open Opportunities</div>
                <div className="c-sub">{counts?.opportunities ?? 0} available to claim</div>
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
                    <div className="r-meta">{(o.frameworks ?? []).join(" · ") || "assessment"}</div>
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
