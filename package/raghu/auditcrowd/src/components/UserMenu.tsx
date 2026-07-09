"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "@/context/session-context";
import { OrgSwitcher } from "./OrgSwitcher";
import { CreateApiKeyDialog } from "./CreateApiKeyDialog";

function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/[\s-]+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "?";
}

type Theme = "dark" | "light";

export function UserMenu() {
  const { user, org, logout } = useSession();
  const [open, setOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [theme, setTheme] = useState<Theme>(() =>
    typeof window !== "undefined"
      ? ((localStorage.getItem("zb-theme") as Theme) || "dark")
      : "dark",
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next: Theme = t === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem("zb-theme", next);
      return next;
    });
  }, []);

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="user-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="user-menu-summary">
          <span className="u-name">{user?.name}</span>
          <span className="u-org">{org?.name}</span>
        </div>
        <span className="avatar">{initials(user?.name)}</span>
      </button>

      {open && (
        <div className="user-menu-panel" role="menu">
          <div className="user-menu-head">
            <span className="avatar avatar-lg">{initials(user?.name)}</span>
            <div className="u-info">
              <span className="u-name">{user?.name}</span>
              {user?.emails?.[0] && (
                <span className="u-email">{user.emails[0].toString()}</span>
              )}
            </div>
          </div>

          <hr />

          <div className="user-menu-org">
            <label>Organization</label>
            <OrgSwitcher onSwitched={() => setOpen(false)} />
          </div>

          <hr />

          <button
            className="menu-item"
            onClick={() => {
              setShowApiKey(true);
              setOpen(false);
            }}
          >
            <span className="material-symbols-outlined">key</span>
            <span className="menu-item-label">Create New API Key</span>
          </button>

          <button className="menu-item" onClick={toggleTheme}>
            <span className="material-symbols-outlined">
              {theme === "dark" ? "dark_mode" : "light_mode"}
            </span>
            <span className="menu-item-label">
              {theme === "dark" ? "Dark Theme" : "Light Theme"}
            </span>
            <span className="material-symbols-outlined theme-switch">
              {theme === "dark" ? "toggle_on" : "toggle_off"}
            </span>
          </button>

          <hr />

          <button className="menu-item" onClick={logout}>
            <span className="material-symbols-outlined">logout</span>
            <span className="menu-item-label">Sign Out</span>
          </button>
        </div>
      )}

      {showApiKey && (
        <CreateApiKeyDialog onClose={() => setShowApiKey(false)} />
      )}
    </div>
  );
}
