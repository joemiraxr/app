"use client";
import type { ReactElement, ReactNode } from "react";

// ── Opportunity detail popup (Tier 2 — "evaluate before you claim") ──────────
// Renders the seam's /zb/opportunity/{id}. Fields the engagement doesn't yet
// carry come back "pending" and render muted, so the auditor sees the full shape
// honestly. Spec: auditcrowd-lab/docs/auditor-engagement-ux-spec.md.
// Shared by the dashboard card and the /marketplace page.

function isPendingVal(v: unknown): boolean {
  return v == null || (typeof v === "string" && /pending|unknown/i.test(v));
}

function KV({ k, v }: { k: string; v: unknown }): ReactElement {
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

function Section({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#22E0FF", marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}

function GatePill({ label, value }: { label: string; value: unknown }): ReactElement {
  const pending = isPendingVal(value);
  return (
    <div style={{ flex: 1, padding: "8px 10px", borderRadius: 8, border: `1px solid ${pending ? "rgba(250,204,21,0.3)" : "rgba(52,211,153,0.3)"}`, background: pending ? "rgba(250,204,21,0.08)" : "rgba(52,211,153,0.08)" }}>
      <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: 0.5, color: "#8b9bbb" }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: pending ? "#facc15" : "#34d399", marginTop: 2 }}>{pending ? "pending" : String(value)}</div>
    </div>
  );
}

export default function OpportunityModal({ detail, onClose, onClaim }: { detail: any; onClose: () => void; onClaim: () => void }): ReactElement {
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

// ── Match chip — renders the seam's per-opportunity matchmaker verdict ───────
// confidence: exact (green) | partial (cyan) | suggested (muted)

const CHIP_STYLES: Record<string, { color: string; border: string; bg: string }> = {
  exact: { color: "#34d399", border: "rgba(52,211,153,0.35)", bg: "rgba(52,211,153,0.10)" },
  partial: { color: "#22E0FF", border: "rgba(34,224,255,0.35)", bg: "rgba(34,224,255,0.08)" },
  suggested: { color: "#8b9bbb", border: "rgba(148,163,184,0.25)", bg: "rgba(148,163,184,0.07)" },
};

export type OpportunityMatch = { confidence: string; score: number; source: string; reason: string };

export function MatchChip({ match }: { match?: OpportunityMatch }): ReactElement | null {
  if (!match) return null;
  const s = CHIP_STYLES[match.confidence] ?? CHIP_STYLES.suggested;
  return (
    <span
      title={`${match.source} · score ${match.score}`}
      style={{ display: "inline-block", fontSize: 10.5, fontWeight: 600, letterSpacing: 0.3, padding: "2px 8px", borderRadius: 999, color: s.color, border: `1px solid ${s.border}`, background: s.bg, whiteSpace: "nowrap" }}
    >
      {match.reason}
    </span>
  );
}
