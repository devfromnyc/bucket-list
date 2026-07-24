"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
  { href: "/board", label: "Board" },
  { href: "/events", label: "Events" },
  { href: "/stays", label: "Stays" },
  { href: "/favorites", label: "Favorites" },
  { href: "/add", label: "Add place" },
  { href: "/events/add", label: "Add event" },
  { href: "/stays/add", label: "Add stay" },
  { href: "/plan", label: "Plan my day" },
  { href: "/chat", label: "Ideas chat" },
  { href: "/settings", label: "Settings" },
];

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--paper)]/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/board" className="group flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--ink)] transition group-hover:text-[var(--accent)]">
            bucketlist.ai
          </span>
          <span className="hidden text-xs uppercase tracking-[0.2em] text-[var(--muted)] sm:inline">
            bucket list
          </span>
        </Link>

        <nav className="flex flex-wrap items-center justify-end gap-1 sm:gap-2">
          {links.map((link) => {
            const moreSpecificExists = links.some(
              (other) =>
                other.href !== link.href &&
                other.href.startsWith(`${link.href}/`) &&
                (pathname === other.href ||
                  pathname.startsWith(`${other.href}/`)),
            );
            const active =
              pathname === link.href ||
              (!moreSpecificExists && pathname.startsWith(`${link.href}/`));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={logout}
            className="ml-1 rounded-full px-3 py-1.5 text-sm text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
