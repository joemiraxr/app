"use client";

import { useEffect, useState } from "react";
import type { Org } from "@zerobias-com/dana-sdk";
import { useSession } from "@/context/session-context";

/**
 * List:   `danaClient.getOrgApi().listOrgs(page, size)` -> PagedResults<Org>.
 * Switch: `app.selectOrg(org)` via `useSession().selectOrg`.
 *
 * `listOrgs` has no sort parameter, so the list is sorted by name on the client.
 */
export function OrgSwitcher({ onSwitched }: { onSwitched?: () => void }) {
  const { api, org, selectOrg } = useSession();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!api) return;
    let mounted = true;
    api.danaClient
      .getOrgApi()
      .listOrgs(1, 50)
      .then((page) => {
        if (!mounted) return;
        const sorted = [...page.items].sort((a, b) =>
          a.name.localeCompare(b.name, undefined, {
            numeric: true,
            sensitivity: "base",
          }),
        );
        setOrgs(sorted);
      })
      .catch((err) => console.error("listOrgs failed", err));
    return () => {
      mounted = false;
    };
  }, [api]);

  const pick = async (next: Org) => {
    setOpen(false);
    await selectOrg(next);
    onSwitched?.();
  };

  return (
    <div className="org-switch">
      <button
        type="button"
        className="org-switch-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="ellipsis">{org?.name ?? "Select organization"}</span>
        <span className="material-symbols-outlined">
          {open ? "expand_less" : "expand_more"}
        </span>
      </button>
      {open && (
        <ul className="org-switch-list" role="listbox">
          {orgs.map((o) => {
            const selected = o.id.toString() === org?.id.toString();
            return (
              <li
                key={o.id.toString()}
                role="option"
                aria-selected={selected}
                className={`org-switch-item${selected ? " selected" : ""}`}
                onClick={() => pick(o)}
              >
                {o.name}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
