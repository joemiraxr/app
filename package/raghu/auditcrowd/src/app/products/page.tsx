"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { ProductExtended } from "@zerobias-com/portal-sdk";
import { useSession } from "@/context/session-context";
import { toUserMessage } from "@/lib/errors";

const PAGE_SIZE = 10;

/**
 * `portalClient.getProductApi().search(body, page, size)`
 * -> `PagedResults<ProductExtended>`; `.items` holds the rows.
 */
export default function ProductsPage() {
  const { api, org } = useSession();
  const [products, setProducts] = useState<ProductExtended[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (pageNumber: number) => {
      if (!api) return;
      return api.portalClient
        .getProductApi()
        .search({}, pageNumber, PAGE_SIZE)
        .then((results) => {
          setProducts(results.items);
          setError(null);
        })
        .catch((err) => {
          console.error("Products search failed", err);
          setError(toUserMessage(err));
          setProducts([]);
        })
        .finally(() => setLoading(false));
    },
    [api],
  );

  useEffect(() => {
    void load(page);
  }, [load, page, org?.id]);

  const goToPage = (next: number) => {
    setLoading(true);
    setPage(next);
  };

  return (
    <div>
      <h1>Products Catalog</h1>
      <p className="subtitle">
        <code>portalClient.getProductApi().search(&#123;&#125;, page, size)</code>
      </p>

      {error && <p className="state error">Error: {error}</p>}

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Logo</th>
              <th>Name</th>
              <th>Code</th>
              <th>Description</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="state">
                  Loading…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="state">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id.toString()}>
                  <td>
                    {p.imageUrl ? (
                      <Image
                        src={p.imageUrl.toString()}
                        alt={p.name}
                        width={32}
                        height={32}
                      />
                    ) : null}
                  </td>
                  <td>{p.name}</td>
                  <td>
                    <code>{p.code}</code>
                  </td>
                  <td>{p.description ?? "—"}</td>
                  <td>
                    <span
                      className={`chip ${
                        p.status?.toString() === "published"
                          ? "success"
                          : "neutral"
                      }`}
                    >
                      {p.status?.toString()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="toolbar">
        <button
          className="btn-ghost"
          disabled={loading || page <= 1}
          onClick={() => goToPage(Math.max(1, page - 1))}
        >
          ← Prev
        </button>
        <span className="state">Page {page}</span>
        <button
          className="btn-ghost"
          disabled={loading || products.length < PAGE_SIZE}
          onClick={() => goToPage(page + 1)}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
