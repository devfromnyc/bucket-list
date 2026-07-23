"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import type { ItineraryPlan } from "@/lib/itinerary";
import { RADIUS_OPTIONS } from "@/lib/geo";

const moods = [
  "chill / low energy",
  "adventurous",
  "romantic",
  "social / fun",
  "cozy / indoor",
  "outdoorsy",
  "foodie",
  "kid chaos energy",
];

const durations = ["a few hours", "half day", "full day", "evening only"];

const budgets = ["free / cheap", "moderate", "treat yourself", "flexible"];

const inputClass =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]";

export function ItineraryPlanner() {
  const [location, setLocation] = useState("");
  const [radiusMiles, setRadiusMiles] = useState<number>(25);
  const [mood, setMood] = useState(moods[0]);
  const [duration, setDuration] = useState(durations[1]);
  const [budget, setBudget] = useState(budgets[3]);
  const [withKids, setWithKids] = useState(false);
  const [criteria, setCriteria] = useState("");
  const [includeSaved, setIncludeSaved] = useState(true);
  const [loading, setLoading] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<ItineraryPlan | null>(null);

  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch("/api/preferences");
        if (!res.ok) return;
        const data = await res.json();
        const p = data.profile;
        if (!p) return;
        if (p.homeCity) setLocation(p.homeCity);
        if (p.defaultRadiusMiles) setRadiusMiles(p.defaultRadiusMiles);
        if (p.budgetPreference) setBudget(p.budgetPreference);
        if (p.preferredVibe && moods.includes(p.preferredVibe)) {
          setMood(p.preferredVibe);
        }
        if (p.typicallyWithKids) setWithKids(true);
      } finally {
        setPrefsLoaded(true);
      }
    }
    void loadPrefs();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          radiusMiles,
          mood,
          duration,
          budget,
          withKids,
          criteria,
          includeSaved,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Planning failed");
      setPlan(data.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <form
        onSubmit={onSubmit}
        className="space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8"
      >
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            What’s today looking like?
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Tell the AI your constraints and mood — it’ll build a timed plan so
            you don’t have to decide everything yourself.
            {prefsLoaded ? (
              <>
                {" "}
                Defaults come from your{" "}
                <Link href="/settings" className="text-[var(--accent)] underline">
                  preferences
                </Link>
                .
              </>
            ) : null}
          </p>
        </div>

        <Field label="Where (city / area)">
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Concord, NC"
            className={inputClass}
            required
          />
        </Field>

        <Field label="Mile radius from city">
          <select
            value={radiusMiles}
            onChange={(e) => setRadiusMiles(Number(e.target.value))}
            className={inputClass}
          >
            {RADIUS_OPTIONS.map((miles) => (
              <option key={miles} value={miles}>
                Within {miles} miles
              </option>
            ))}
          </select>
        </Field>

        <Field label="Mood">
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className={inputClass}
          >
            {moods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Time available">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className={inputClass}
            >
              {durations.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Budget">
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={inputClass}
            >
              {budgets.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Anything else?">
          <textarea
            value={criteria}
            onChange={(e) => setCriteria(e.target.value)}
            rows={3}
            placeholder="Rainy, need coffee first, avoid crowds, celebrate something…"
            className={inputClass}
          />
        </Field>

        <label className="flex items-center gap-3 text-sm text-[var(--ink)]">
          <input
            type="checkbox"
            checked={withKids}
            onChange={(e) => setWithKids(e.target.checked)}
            className="size-4 accent-[var(--accent)]"
          />
          Planning with kids
        </label>

        <label className="flex items-center gap-3 text-sm text-[var(--ink)]">
          <input
            type="checkbox"
            checked={includeSaved}
            onChange={(e) => setIncludeSaved(e.target.checked)}
            className="size-4 accent-[var(--accent)]"
          />
          Prefer unfinished places from my board when they fit
        </label>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading || !location.trim()}
          className="w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Building your day…" : "Plan my day"}
        </button>
      </form>

      <div className="min-h-[320px]">
        {loading ? (
          <div className="flex h-full min-h-[320px] flex-col justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/70 px-6 py-16 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Mapping the day…
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Matching mood, time, and nearby ideas into a sequence.
            </p>
          </div>
        ) : plan ? (
          <article className="animate-[fadeUp_0.4s_ease] space-y-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Your itinerary
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
                {plan.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
                {plan.summary}
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--accent)]">
                {plan.moodFit}
              </p>
            </div>

            <ol className="space-y-4">
              {plan.stops.map((stop, index) => (
                <li
                  key={`${stop.title}-${index}`}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--paper)] p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                      {stop.time}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      Stop {index + 1}
                    </span>
                  </div>
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                    {stop.title}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--ink)]/90">
                    {stop.activity}
                  </p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{stop.why}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {stop.mapsQuery ? (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.mapsQuery)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                      >
                        Maps
                      </a>
                    ) : null}
                    <Link
                      href={`/add?q=${encodeURIComponent(stop.mapsQuery || stop.title)}`}
                      className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
                    >
                      Add to board
                    </Link>
                  </div>
                </li>
              ))}
            </ol>

            {plan.tips && plan.tips.length > 0 ? (
              <div className="rounded-2xl bg-[var(--accent-soft)]/60 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
                  Tips
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--ink)]">
                  {plan.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ) : (
          <div className="flex h-full min-h-[320px] flex-col justify-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/50 px-6 py-16 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
              Stuck on today?
            </p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Fill in the form — this isn’t the brainstorm chat. You’ll get a
              timed itinerary you can actually follow.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
        {label}
      </label>
      {children}
    </div>
  );
}
