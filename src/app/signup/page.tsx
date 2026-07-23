"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/AuthShell";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      router.push("/board");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create your access"
      subtitle="Add your name, then unlock bucketlist.ai with your app password."
      footer={
        <>
          Already set up?{" "}
          <Link href="/login" className="font-semibold text-[var(--accent)]">
            Log in
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
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-[var(--ink)]"
          >
            Name
          </label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)]"
            autoFocus
            required
          />
        </div>
        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-[var(--ink)]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--accent)]"
            required
          />
        </div>
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
            required
          />
          <p className="mt-2 text-xs text-[var(--muted)]">
            Personal deploy: use the same <code>APP_PASSWORD</code> from your
            environment.
          </p>
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
          {loading ? "Creating…" : "Sign up"}
        </button>
      </form>
    </AuthShell>
  );
}
