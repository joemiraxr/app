"use client";

import { useState } from "react";
import { ApiKeyWithData, CreateApiKeyBody } from "@zerobias-com/dana-sdk";
import { DateTime } from "@zerobias-org/types-core-js";
import { useSession } from "@/context/session-context";
import { toUserMessage } from "@/lib/errors";

type DurationType = "hours" | "days" | "years";
const DURATION_TYPES: DurationType[] = ["hours", "days", "years"];

function defaultName(userName?: string): string {
  return userName ? userName.trim().replace(/\s+/g, "_") : "";
}

function expirationFrom(duration: number, unit: DurationType): Date {
  const d = new Date();
  if (unit === "hours") d.setHours(d.getHours() + duration);
  else if (unit === "days") d.setDate(d.getDate() + duration);
  else d.setFullYear(d.getFullYear() + duration);
  return d;
}

// danaClient.getMeApi().createApiKey(body) -> ApiKeyWithData.
// `data` holds the secret and is only returned here, at creation.
export function CreateApiKeyDialog({ onClose }: { onClose: () => void }) {
  const { api, org, user } = useSession();
  const [name, setName] = useState(() => defaultName(user?.name));
  const [duration, setDuration] = useState("30");
  const [durationType, setDurationType] = useState<DurationType>("days");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<ApiKeyWithData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const orgId = org?.id.toString() ?? "";

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
    } catch (err) {
      console.error("Failed to create API key", err);
      setError(toUserMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{created ? "Created API Key" : "Create New API Key"}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {created ? (
          <div>
            <p className="subtitle">
              Copy the key now — it won&apos;t be shown again. It has also been
              copied to your clipboard.
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
                  <span className="material-symbols-outlined">
                    content_copy
                  </span>
                </button>
              </div>
              {copied === "org" && <span className="copied">Copied</span>}
            </div>

            <div className="field">
              <label htmlFor="created-key">API Key</label>
              <div className="copy-field">
                <input id="created-key" value={created.data} readOnly />
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => copy(created.data, "key")}
                  aria-label="Copy API key"
                >
                  <span className="material-symbols-outlined">
                    content_copy
                  </span>
                </button>
              </div>
              {copied === "key" && <span className="copied">Copied</span>}
            </div>

            <button className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <div className="field">
              <label htmlFor="key-name">API Key Name</label>
              <input
                id="key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="my-integration"
                autoComplete="off"
                autoFocus
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="key-duration">Expiration Duration</label>
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
                <label htmlFor="key-duration-type">Duration Type</label>
                <select
                  id="key-duration-type"
                  value={durationType}
                  onChange={(e) =>
                    setDurationType(e.target.value as DurationType)
                  }
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
              {creating ? "Creating…" : "Create"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
