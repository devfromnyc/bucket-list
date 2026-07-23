"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PlaceCard } from "@/components/PlaceCard";
import type { Place } from "@/lib/schema";

export function FavoritesBoard() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/places?favorites=1");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setPlaces(data.places);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onToggle(id: string) {
    const res = await fetch(`/api/places/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleCompleted: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setPlaces((prev) =>
        prev.map((p) => (p.id === id ? data.place : p)),
      );
    }
  }

  async function onFavorite(id: string) {
    const res = await fetch(`/api/places/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleFavorite: true }),
    });
    if (res.ok) {
      const data = await res.json();
      // Unfavoriting removes it from this section
      if (!data.place.favorited) {
        setPlaces((prev) => prev.filter((p) => p.id !== id));
      } else {
        setPlaces((prev) =>
          prev.map((p) => (p.id === id ? data.place : p)),
        );
      }
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this place?")) return;
    const res = await fetch(`/api/places/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPlaces((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Saved with love
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
            Favorites
          </h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            Places you’ve hearted from the board — your short list of must-dos.
          </p>
        </div>
        <Link
          href="/board"
          className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Back to board
        </Link>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl bg-[var(--surface-muted)]"
            />
          ))}
        </div>
      ) : places.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            No favorites yet
          </p>
          <p className="mt-2 text-[var(--muted)]">
            Tap the heart on any place card to save it here.
          </p>
          <Link
            href="/board"
            className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Browse board
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place, index) => (
            <div
              key={place.id}
              className="animate-[fadeUp_0.45s_ease_both]"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <PlaceCard
                place={place}
                onToggle={onToggle}
                onFavorite={onFavorite}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
