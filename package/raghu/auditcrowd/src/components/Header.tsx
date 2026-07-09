"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./UserMenu";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/pkv", label: "Key-Value" },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="app-header-left">
        <Link href="/" className="brand">
          <span className="brand-mark">ZB</span>
          ZeroBias <span>v2 Example</span>
        </Link>
        <nav className="app-nav">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? "active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="app-header-right">
        <UserMenu />
      </div>
    </header>
  );
}
