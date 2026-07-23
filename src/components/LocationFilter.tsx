"use client";

import { RADIUS_OPTIONS } from "@/lib/geo";

type Props = {
  cities: string[];
  city: string;
  radiusMiles: number | null;
  onCityChange: (city: string) => void;
  onRadiusChange: (miles: number | null) => void;
  useCustomCity: boolean;
  onUseCustomCityChange: (value: boolean) => void;
  customCity: string;
  onCustomCityChange: (value: string) => void;
};

export function LocationFilter({
  cities,
  city,
  radiusMiles,
  onCityChange,
  onRadiusChange,
  useCustomCity,
  onUseCustomCityChange,
  customCity,
  onCustomCityChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[160px] flex-1">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          City
        </label>
        <select
          value={useCustomCity ? "__custom__" : city}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "__custom__") {
              onUseCustomCityChange(true);
              onCityChange(customCity.trim());
              onRadiusChange(radiusMiles ?? 25);
            } else {
              onUseCustomCityChange(false);
              onCityChange(value);
              if (!value) onRadiusChange(null);
              else if (!radiusMiles) onRadiusChange(25);
            }
          }}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
          <option value="__custom__">Other city…</option>
        </select>
      </div>

      {useCustomCity ? (
        <div className="min-w-[180px] flex-1">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Custom city
          </label>
          <input
            value={customCity}
            onChange={(e) => {
              onCustomCityChange(e.target.value);
              onCityChange(e.target.value.trim());
            }}
            placeholder="e.g. Charlotte, NC"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
      ) : null}

      <div className="min-w-[140px]">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
          Radius
        </label>
        <select
          value={radiusMiles ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onRadiusChange(v === "" ? null : Number(v));
          }}
          disabled={!city.trim()}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2.5 text-sm text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="">City name only</option>
          {RADIUS_OPTIONS.map((miles) => (
            <option key={miles} value={miles}>
              Within {miles} mi
            </option>
          ))}
        </select>
      </div>

      {city.trim() && radiusMiles ? (
        <p className="w-full text-xs text-[var(--muted)] sm:pb-2.5">
          Within {radiusMiles} miles of {city.trim()}. Places without
          coordinates still match by city name when possible.
        </p>
      ) : null}
    </div>
  );
}
