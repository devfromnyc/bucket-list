"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CategoryFilter } from "@/components/CategoryFilter";
import { LocationFilter } from "@/components/LocationFilter";
import { PlaceCard } from "@/components/PlaceCard";
import type { Category, Place } from "@/lib/schema";

export function PlacesBoard() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category | "all">("all");
  const [status, setStatus] = useState<"all" | "todo" | "completed">("all");
  const [city, setCity] = useState("");
  const [radiusMiles, setRadiusMiles] = useState<number | null>(null);
  const [useCustomCity, setUseCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [prefsApplied, setPrefsApplied] = useState(false);

  useEffect(() => {
    async function loadPrefs() {
      if (prefsApplied) return;
      try {
        const res = await fetch("/api/preferences");
        if (!res.ok) return;
        const data = await res.json();
        const p = data.profile;
        if (p?.homeCity) {
          setCity(p.homeCity);
          setCustomCity(p.homeCity);
          setUseCustomCity(true);
          setRadiusMiles(p.defaultRadiusMiles ?? 25);
        }
      } finally {
        setPrefsApplied(true);
      }
    }
    void loadPrefs();
  }, [prefsApplied]);

  const load = useCallback(async () => {
    if (!prefsApplied) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        category,
        status,
      });
      if (city.trim()) params.set("city", city.trim());
      if (city.trim() && radiusMiles != null) {
        params.set("radiusMiles", String(radiusMiles));
      }
      const res = await fetch(`/api/places?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setPlaces(data.places);
      setCities(data.cities ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [category, status, city, radiusMiles, prefsApplied]);

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
      setPlaces((prev) =>
        prev.map((p) => (p.id === id ? data.place : p)),
      );
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
            Your list
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
            Places to go
          </h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            Food, parks, kid days, and nights out — keep them on cards until
            you check them off. Heart the ones you love for{" "}
            <Link href="/favorites" className="text-[var(--accent)] underline">
              Favorites
            </Link>
            .
          </p>
        </div>
        <Link
          href="/add"
          className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Add place
        </Link>
      </div>

      <CategoryFilter
        category={category}
        status={status}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
      />

      <LocationFilter
        cities={cities}
        city={city}
        radiusMiles={radiusMiles}
        onCityChange={setCity}
        onRadiusChange={setRadiusMiles}
        useCustomCity={useCustomCity}
        onUseCustomCityChange={setUseCustomCity}
        customCity={customCity}
        onCustomCityChange={setCustomCity}
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <p className="mt-1 text-red-600/80">
            Make sure <code>DATABASE_URL</code> is set and the schema is pushed
            to Neon (<code>npm run db:push</code>).
          </p>
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
            {city.trim() ? "No places in this area" : "Nothing here yet"}
          </p>
          <p className="mt-2 text-[var(--muted)]">
            {city.trim()
              ? "Try a wider radius, another city, or add a new place."
              : "Add a place with AI research, or chat for ideas first."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/add"
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Add place
            </Link>
            <Link
              href="/chat"
              className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--ink)]"
            >
              Ideas chat
            </Link>
          </div>
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
