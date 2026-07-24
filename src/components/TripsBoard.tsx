"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Trip } from "@/lib/schema";
import { tripStatusLabels } from "@/lib/tripLabels";

export function TripsBoard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trips");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setTrips(data.trips);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onDelete(id: string) {
    if (!confirm("Delete this trip?")) return;
    const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
    if (res.ok) setTrips((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Combine your list
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
            Trips
          </h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            Build a multi-day plan from your places, events, and stays — or let
            AI draft one from what you’ve saved.
          </p>
        </div>
        <Link
          href="/trips/new"
          className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          New trip
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <p className="mt-1 text-red-600/80">
            Run <code>npm run db:push</code> so the <code>trips</code> tables
            exist on Neon.
          </p>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl bg-[var(--surface-muted)]"
            />
          ))}
        </div>
      ) : trips.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            No trips yet
          </p>
          <p className="mt-2 text-[var(--muted)]">
            Start with a destination and dates, then add stops or ask AI to
            draft from your lists.
          </p>
          <Link
            href="/trips/new"
            className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            New trip
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((trip, index) => (
            <article
              key={trip.id}
              className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow)] animate-[fadeUp_0.45s_ease_both]"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                    {tripStatusLabels[
                      trip.status as keyof typeof tripStatusLabels
                    ] ?? trip.status}
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                    <Link
                      href={`/trips/${trip.id}`}
                      className="hover:text-[var(--accent)]"
                    >
                      {trip.title}
                    </Link>
                  </h2>
                </div>
              </div>
              {trip.destinationCity ? (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {trip.destinationCity}
                </p>
              ) : null}
              {trip.startsOn || trip.endsOn ? (
                <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                  {[trip.startsOn, trip.endsOn].filter(Boolean).join(" → ")}
                </p>
              ) : null}
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Link
                  href={`/trips/${trip.id}`}
                  className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)]"
                >
                  Open
                </Link>
                <button
                  type="button"
                  onClick={() => onDelete(trip.id)}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-[var(--muted)] hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
