"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { StayCard } from "@/components/StayCard";
import { StayCategoryFilter } from "@/components/StayCategoryFilter";
import { LocationFilter } from "@/components/LocationFilter";
import type { Stay, StayCategory } from "@/lib/schema";

export function StaysBoard({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
  const [stays, setStays] = useState<Stay[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<StayCategory | "all">("all");
  const [status, setStatus] = useState<"all" | "todo" | "completed">("all");
  const [city, setCity] = useState("");
  const [radiusMiles, setRadiusMiles] = useState<number | null>(null);
  const [useCustomCity, setUseCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState("");
  const [prefsApplied, setPrefsApplied] = useState(false);

  useEffect(() => {
    async function loadPrefs() {
      if (prefsApplied || favoritesOnly) {
        setPrefsApplied(true);
        return;
      }
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
  }, [prefsApplied, favoritesOnly]);

  const load = useCallback(async () => {
    if (!prefsApplied) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        category,
        status,
      });
      if (favoritesOnly) params.set("favorites", "1");
      if (city.trim()) params.set("city", city.trim());
      if (city.trim() && radiusMiles != null) {
        params.set("radiusMiles", String(radiusMiles));
      }
      const res = await fetch(`/api/stays?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setStays(data.stays);
      setCities(data.cities ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [category, status, city, radiusMiles, prefsApplied, favoritesOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onToggle(id: string) {
    const res = await fetch(`/api/stays/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleCompleted: true }),
    });
    if (res.ok) {
      const data = await res.json();
      setStays((prev) => prev.map((s) => (s.id === id ? data.stay : s)));
    }
  }

  async function onFavorite(id: string) {
    const res = await fetch(`/api/stays/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toggleFavorite: true }),
    });
    if (res.ok) {
      const data = await res.json();
      if (favoritesOnly && !data.stay.favorited) {
        setStays((prev) => prev.filter((s) => s.id !== id));
      } else {
        setStays((prev) => prev.map((s) => (s.id === id ? data.stay : s)));
      }
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this stay?")) return;
    const res = await fetch(`/api/stays/${id}`, { method: "DELETE" });
    if (res.ok) {
      setStays((prev) => prev.filter((s) => s.id !== id));
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            {favoritesOnly ? "Hearted stays" : "Where to stay"}
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
            {favoritesOnly ? "Favorite stays" : "Stays"}
          </h1>
          <p className="mt-2 max-w-xl text-[var(--muted)]">
            {favoritesOnly
              ? "Hotels, Airbnbs, and rentals you’ve saved for later."
              : "Hotels, Airbnbs, vacation rentals, and hostels — researched like a Maps search, then saved as cards. Check Maps/listing for live prices."}
          </p>
        </div>
        <Link
          href="/stays/add"
          className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Add stay
        </Link>
      </div>

      {!favoritesOnly ? (
        <>
          <StayCategoryFilter
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
        </>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <p className="mt-1 text-red-600/80">
            Run <code>npm run db:push</code> so the <code>stays</code> table
            exists on Neon.
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
      ) : stays.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-16 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            {favoritesOnly
              ? "No favorite stays yet"
              : city.trim()
                ? "No stays in this area"
                : "No stays yet"}
          </p>
          <p className="mt-2 text-[var(--muted)]">
            {favoritesOnly
              ? "Heart a stay card to save it here."
              : "Try something like “hotels near downtown Charlotte” or an Airbnb with a kitchen."}
          </p>
          <Link
            href="/stays/add"
            className="mt-6 inline-flex rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Add stay
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stays.map((stay, index) => (
            <div
              key={stay.id}
              className="animate-[fadeUp_0.45s_ease_both]"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <StayCard
                stay={stay}
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
