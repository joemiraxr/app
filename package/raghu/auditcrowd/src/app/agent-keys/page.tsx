"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiKey, ApiKeyWithData, CreateApiKeyBody } from "@zerobias-com/dana-sdk";
import { DateTime } from "@zerobias-org/types-core-js";
import { useSession } from "@/context/session-context";
import { toUserMessage } from "@/lib/errors";

/**
 * Per-agent API keys, minted as the signed-in principal.
 *   read:  danaClient.getMeApi().listApiKeys()          (no secrets)
 *   write: danaClient.getMeApi().createApiKey(body)     -> ApiKeyWithData
 *
 * The secret (`.data`) is returned exactly once, at creation — it is shown
 * in the ceremony panel below and never persisted or refetched. Keys expire
 * by TTL; the SDK exposes no revoke, so short expirations are the control.
 */

type DurationType = "hours" | "days" | "years";
const DURATION_TYPES: DurationType[] = ["hours", "days", "years"];

const AGENT_PRESETS = ["claude-code", "openclaw", "vscode-agent"] as const;

function expirationFrom(duration: number, unit: DurationType): Date {
  const d = new Date();
  if (unit === "hours") d.setHours(d.getHours() + duration);
  else if (unit === "days") d.setDate(d.getDate() + duration);
  else d.setFullYear(d.getFullYear() + duration);
  return d;
}

export default function AgentKeysPage() {
  const { api, org } = useSession();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<string>(AGENT_PRESETS[0]);
  const [name, setName] = useState(`agent-${AGENT_PRESETS[0]}`);
  const [duration, setDuration] = useState("30");
  const [durationType, setDurationType] = useState<DurationType>("days");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ApiKeyWithData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const orgId = org?.id.toString() ?? "";

  // GET /dana/me/keys returns a slim principal per key (id/ownerId/name/type
  // only — no status, expiration, or created), so the table shows what exists.
  const load = useCallback(() => {
    if (!api) return;
    return api.danaClient
      .getMeApi()
      .listApiKeys()
      .then((items) =>
        setKeys([...items].sort((a, b) => a.name.localeCompare(b.name))),
      )
      .catch((err) => {
        console.error("Failed to list API keys", err);
        setError(toUserMessage(err));
      })
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    void load();
  }, [load]);

  const pickAgent = (value: string) => {
    setAgent(value);
    if (value !== "custom") setName(`agent-${value}`);
  };

  const copy = (text: string, which: string) => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(which);
      setTimeout(() => setCopied((c) => (c === which ? null : c)), 1500);
    });
  };

  const submit = async () => {
    if (!api || !name.trim()) return;
    const dur = parseInt(duration, 10);
    if (!Number.isFinite(dur) || dur < 1) {
      setError("Expiration duration must be at least 1.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const body = new CreateApiKeyBody(
        name.trim(),
        new DateTime(expirationFrom(dur, durationType)),
      );
      const key = await api.danaClient.getMeApi().createApiKey(body);
      setCreated(key);
      copy(key.data, "key");
      await load();
    } catch (err) {
      console.error("Failed to create agent key", err);
      setError(toUserMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div>
      <h1>Agent Keys</h1>
      <p className="subtitle">
        Mint a ZeroBias API key per agent, owned by <em>you</em> — the
        signed-in principal. Every platform action an agent takes with its key
        is attributed to your identity. Keys expire by TTL; prefer short
        expirations and re-mint.
      </p>

      {created ? (
        <div className="form-card">
          <h2>Key created — copy it now</h2>
          <p className="subtitle">
            This secret is shown once and cannot be retrieved again. It has
            been copied to your clipboard. Paste it into the agent&apos;s
            environment (e.g. <code>ZB_TOKEN</code>) — never into email or
            chat.
          </p>

          <div className="field">
            <label htmlFor="created-org">Organization ID</label>
            <div className="copy-field">
              <input id="created-org" value={orgId} readOnly />
              <button
                type="button"
                className="copy-btn"
                onClick={() => copy(orgId, "org")}
                aria-label="Copy organization ID"
              >
                <span className="material-symbols-outlined">content_copy</span>
              </button>
            </div>
            {copied === "org" && <span className="copied">Copied</span>}
          </div>

          <div className="field">
            <label htmlFor="created-key">API Key (shown once)</label>
            <div className="copy-field">
              <input id="created-key" value={created.data} readOnly />
              <button
                type="button"
                className="copy-btn"
                onClick={() => copy(created.data, "key")}
                aria-label="Copy API key"
              >
                <span className="material-symbols-outlined">content_copy</span>
              </button>
            </div>
            {copied === "key" && <span className="copied">Copied</span>}
          </div>

          <button className="btn" onClick={() => setCreated(null)}>
            Done
          </button>
        </div>
      ) : (
        <form
          className="form-card"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <h2>Mint a key for an agent</h2>
          <div className="field-row">
            <div className="field">
              <label htmlFor="agent">Agent</label>
              <select
                id="agent"
                value={agent}
                onChange={(e) => pickAgent(e.target.value)}
              >
                {AGENT_PRESETS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
                <option value="custom">custom…</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="key-name">Key name</label>
              <input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="agent-my-agent"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="key-duration">Expires in</label>
              <input
                id="key-duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="field">
              <label htmlFor="key-duration-type">Unit</label>
              <select
                id="key-duration-type"
                value={durationType}
                onChange={(e) => setDurationType(e.target.value as DurationType)}
              >
                {DURATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="error">{error}</p>}
          <button className="btn" disabled={creating || !name.trim()}>
            {creating ? "Minting…" : "Mint key"}
          </button>
        </form>
      )}

      <h2>Your keys</h2>
      {loading ? (
        <p className="state">Loading…</p>
      ) : keys.length === 0 ? (
        <p className="state">No API keys yet.</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Key ID</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id.toString()}>
                  <td>
                    <code>{k.name}</code>
                  </td>
                  <td>
                    <code>{k.id.toString()}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
