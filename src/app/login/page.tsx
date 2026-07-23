"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      const from = searchParams.get("from") || "/board";
      router.push(from.startsWith("/login") || from === "/" ? "/board" : from);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in with your access password to open your board."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-semibold text-[var(--accent)]">
            Create access
          </Link>
          {" · "}
          <Link href="/" className="font-semibold text-[var(--ink)]">
            Home
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-[var(--ink)]"
          >
            Access password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)]"
            autoFocus
            required
          />
        </div>
        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-10 text-[var(--muted)]">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
