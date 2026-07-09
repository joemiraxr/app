"use client";

import Link from "next/link";
import { useSession } from "@/context/session-context";

function CodeGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 8l-4 4 4 4M15 8l4 4-4 4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const DEMOS = [
  {
    href: "/products",
    title: "Products Catalog",
    body: "Read-only, paginated search of the ZeroBias catalog.",
    call: "portalClient.getProductApi().search()",
  },
  {
    href: "/pkv",
    title: "Principal Key-Value",
    body: "Read and write per-principal key-value pairs.",
    call: "danaClient.getPkvApi().upsertPrincipalKeyValue()",
  },
];

export default function Home() {
  const { user, org } = useSession();

  return (
    <div>
      <h1>ZeroBias v2 Client Examples</h1>
      <p className="subtitle">
        Canonical patterns for building a custom app on the ZeroBias platform.
        {user && (
          <>
            {" "}
            Signed in as <strong>{user.name}</strong>
            {org && (
              <>
                {" "}
                in <strong>{org.name}</strong>
              </>
            )}
            .
          </>
        )}
      </p>

      <div className="app-cards">
        {DEMOS.map((d) => (
          <Link key={d.href} href={d.href} className="app-card">
            <div className="app-card-head">
              <span className="app-card-icon">
                <CodeGlyph />
              </span>
              <h3>{d.title}</h3>
            </div>
            <p className="app-card-desc">{d.body}</p>
            <div className="app-card-foot">
              <code>{d.call}</code>
              <span className="launch">Launch →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
