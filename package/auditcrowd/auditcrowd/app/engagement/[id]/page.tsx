"use client";

// Tier 3 — the full engagement screen. Full requirements + the formal contract
// acceptance. On accept, the seam records a hash-bound, non-repudiable acceptance in
// the LLamas compliance ledger and returns the receipt (the proof).

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppToolbar from "@/components/ui/appToolbar";

const ZB_KEY = process.env.NEXT_PUBLIC_API_KEY;

function isPendingVal(v: unknown): boolean {
  return v == null || (typeof v === "string" && /pending|unknown/i.test(v));
}

function KV({ k, v }: { k: string; v: unknown }) {
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

const cardStyle: React.CSSProperties = {
  background: "linear-gradient(180deg, rgba(16,22,40,0.9), rgba(10,14,28,0.9))",
  border: "1px solid rgba(148,163,184,0.16)", borderRadius: 14, padding: 18, marginBottom: 16,
};
const secTitle: React.CSSProperties = { fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#22E0FF", marginBottom: 8 };

export default function EngagementPage() {
  const params = useParams();
  const router = useRouter();
  const id = String((params as any)?.id || "");
  const [detail, setDetail] = useState<any>(null);
  const [contract, setContract] = useState<any>(null);
  const [checks, setChecks] = useState({ independence: false, standard: false, nonrepud: false });
  const [receipt, setReceipt] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const headers: Record<string, string> = ZB_KEY ? { Authorization: `APIKey ${ZB_KEY}` } : {};
    fetch(`/backend/zb/opportunity/${id}`, { headers }).then((r) => (r.ok ? r.json() : null)).then(setDetail).catch(() => {});
    fetch(`/backend/zb/contract/${id}`, { headers }).then((r) => (r.ok ? r.json() : null)).then(setContract).catch(() => {});
  }, [id]);

  const allChecked = checks.independence && checks.standard && checks.nonrepud;

  async function accept() {
    setSubmitting(true);
    const headers: Record<string, string> = ZB_KEY ? { Authorization: `APIKey ${ZB_KEY}` } : {};
    try {
      const r = await fetch(`/backend/zb/accept/${id}`, { method: "POST", headers });
      if (r.ok) setReceipt(await r.json());
    } finally {
      setSubmitting(false);
    }
  }

  const sector = detail?.sector_block;

  return (
    <div className="ac-shell">
      <AppToolbar />
      <main className="ac-main ac-wrap" style={{ color: "#e6ecf7" }}>
        <button onClick={() => router.push("/")} style={{ background: "transparent", border: "none", color: "#8b9bbb", cursor: "pointer", fontSize: 13, marginBottom: 10 }}>
          ← Dashboard
        </button>

        <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{detail?.name ?? "Engagement"}</h1>
        <div style={{ color: "#8b9bbb", fontSize: 13, marginTop: 4, marginBottom: 20 }}>
          {detail ? `${detail.framework} · assessed on SCF · ${detail.sector} · full engagement` : "loading…"}
        </div>

        {/* Requirements */}
        <div style={cardStyle}>
          <div style={secTitle}>Requirements — the two gates</div>
          <KV k="Snapshot sealed (frozen + hash-signed)" v={detail?.gates?.snapshot_sealed} />
          <KV k={`Crosswalk coverage (SCF → ${detail?.framework ?? "framework"})`} v={detail?.gates?.crosswalk?.coverage} />
          <div style={{ ...secTitle, marginTop: 14 }}>Scope</div>
          <KV k="Framework" v={detail?.scope?.framework} />
          <KV k="Assessed on" v={detail?.scope?.assessed_on} />
          <KV k="Control set" v={detail?.scope?.control_set} />
          <KV k="Exclusions" v={detail?.scope?.exclusions} />
          <div style={{ ...secTitle, marginTop: 14 }}>Target</div>
          <KV k="Boundary" v={detail?.target?.boundary_name} />
          <KV k="Account" v={detail?.target?.account} />
          <KV k="Region" v={detail?.target?.region} />
          {sector && (
            <>
              <div style={{ ...secTitle, marginTop: 14 }}>{sector.label} — sector requirements</div>
              {Object.entries(sector.fields || {}).map(([k, v]) => <KV key={k} k={k} v={v} />)}
            </>
          )}
        </div>

        {/* Contract */}
        <div style={cardStyle}>
          <div style={secTitle}>Engagement contract</div>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: 12.5, lineHeight: 1.55, color: "#c8d3e8", background: "rgba(4,6,14,0.5)", border: "1px solid rgba(148,163,184,0.12)", borderRadius: 8, padding: 12, margin: 0 }}>
            {contract?.contract_text ?? "loading contract…"}
          </pre>
          {contract?.contract_hash && (
            <div style={{ fontSize: 11, color: "#5b6b8c", marginTop: 8, fontFamily: "ui-monospace, monospace" }}>
              contract hash: {contract.contract_hash}
            </div>
          )}
        </div>

        {/* Acceptance */}
        {!receipt ? (
          <div style={cardStyle}>
            <div style={secTitle}>Formal acceptance</div>
            {[
              ["independence", "I affirm my independence — no undisclosed conflict of interest; engine/platform authorship does not discharge it."],
              ["standard", "I accept the scope: oversight + attestation over the automated SCF assessment, not manual control testing, bound to the frozen snapshot."],
              ["nonrepud", "I consent that this acceptance is recorded non-repudiably in the LLamas compliance ledger (and may be Ed25519-anchored + co-signed)."],
            ].map(([key, label]) => (
              <label key={key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "7px 0", fontSize: 13, color: "#c8d3e8", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={(checks as any)[key]}
                  onChange={(e) => setChecks((c) => ({ ...c, [key]: e.target.checked }))}
                  style={{ marginTop: 3 }}
                />
                <span>{label}</span>
              </label>
            ))}
            <button
              disabled={!allChecked || submitting}
              onClick={accept}
              style={{
                marginTop: 12, padding: "10px 20px", borderRadius: 8, border: "none", fontWeight: 700,
                cursor: allChecked && !submitting ? "pointer" : "not-allowed",
                background: allChecked && !submitting ? "linear-gradient(90deg,#22E0FF,#A78BFA)" : "rgba(148,163,184,0.2)",
                color: allChecked && !submitting ? "#05060C" : "#6b7a94",
              }}
            >
              {submitting ? "Recording acceptance…" : "Accept & sign contract"}
            </button>
          </div>
        ) : (
          <div style={{ ...cardStyle, border: "1px solid rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.06)" }}>
            <div style={{ ...secTitle, color: "#34d399" }}>✓ Acceptance recorded — non-repudiable</div>
            <div style={{ fontSize: 13, color: "#c8d3e8", marginBottom: 8 }}>
              {receipt.auditor?.name} formally accepted <strong>{receipt.engagement_name}</strong>.
            </div>
            <KV k="Accepted at" v={receipt.accepted_at} />
            <KV k="Contract hash" v={receipt.contract_hash} />
            <KV k="Scope hash" v={receipt.scope_hash} />
            <KV k="Compliance ledger" v={receipt.compliance?.logged ? `recorded (session ${String(receipt.compliance?.session_id).slice(0, 8)}…)` : "not recorded"} />
            <div style={{ fontSize: 11.5, color: "#8b9bbb", marginTop: 8 }}>{receipt.non_repudiation}</div>
            <button onClick={() => router.push("/")} style={{ marginTop: 12, padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(148,163,184,0.3)", background: "transparent", color: "#9aa8c4", cursor: "pointer" }}>
              ← Back to dashboard
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
