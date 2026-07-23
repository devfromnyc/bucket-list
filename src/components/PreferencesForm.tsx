"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Profile } from "@/lib/schema";
import { RADIUS_OPTIONS } from "@/lib/geo";

type PublicProfile = Omit<Profile, "passwordHash">;

const budgets = ["free / cheap", "moderate", "treat yourself", "flexible"];
const vibes = [
  "",
  "chill / low energy",
  "adventurous",
  "romantic",
  "social / fun",
  "cozy / indoor",
  "outdoorsy",
  "foodie",
  "kid chaos energy",
];

const INTEREST_CHIPS = [
  "Live music",
  "Concerts",
  "Festivals",
  "Community events",
  "Free outdoor events",
  "Food & restaurants",
  "Coffee",
  "Breweries",
  "Parks & trails",
  "Kid-friendly",
  "Museums",
  "Art",
  "Sports",
  "Nightlife",
  "Farmers markets",
  "Theater",
];

const inputClass =
  "w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]";

function parseInterestList(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function serializeInterests(parts: string[]) {
  return parts.join(", ");
}

export function PreferencesForm() {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [homeCity, setHomeCity] = useState("");
  const [defaultRadiusMiles, setDefaultRadiusMiles] = useState(25);
  const [typicallyWithKids, setTypicallyWithKids] = useState(false);
  const [budgetPreference, setBudgetPreference] = useState("flexible");
  const [preferredVibe, setPreferredVibe] = useState("");
  const [interests, setInterests] = useState("");
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [avoidNotes, setAvoidNotes] = useState("");

  const selectedInterests = useMemo(
    () => parseInterestList(interests).map((i) => i.toLowerCase()),
    [interests],
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/preferences");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        const p = data.profile as PublicProfile;
        setProfile(p);
        setName(p.name ?? "");
        setBio(p.bio ?? "");
        setHomeCity(p.homeCity ?? "");
        setDefaultRadiusMiles(p.defaultRadiusMiles ?? 25);
        setTypicallyWithKids(Boolean(p.typicallyWithKids));
        setBudgetPreference(p.budgetPreference ?? "flexible");
        setPreferredVibe(p.preferredVibe ?? "");
        setInterests(p.interests ?? "");
        setDietaryNotes(p.dietaryNotes ?? "");
        setAvoidNotes(p.avoidNotes ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function toggleInterestChip(chip: string) {
    const current = parseInterestList(interests);
    const exists = current.some(
      (item) => item.toLowerCase() === chip.toLowerCase(),
    );
    const next = exists
      ? current.filter((item) => item.toLowerCase() !== chip.toLowerCase())
      : [...current, chip];
    setInterests(serializeInterests(next));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          bio,
          homeCity,
          defaultRadiusMiles,
          typicallyWithKids,
          budgetPreference,
          preferredVibe,
          interests,
          dietaryNotes,
          avoidNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setProfile(data.profile);
      setMessage("Preferences saved — AI and forms will use these next.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-3xl bg-[var(--surface-muted)]" />
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <section className="space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Account
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Profile
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Signed in as{" "}
            <span className="font-medium text-[var(--ink)]">
              {profile?.email}
            </span>
          </p>
        </div>
        <Field label="Display name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="What should we call you?"
          />
        </Field>
        <Field label="Bio">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="A little about you, your household, how you like to spend free time…"
          />
        </Field>
      </section>

      <section className="space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Interests
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            What you’re into
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Used by Ideas chat, Plan my day, and AI research for places and
            events — so suggestions match you without retyping every time.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {INTEREST_CHIPS.map((chip) => {
            const active = selectedInterests.includes(chip.toLowerCase());
            return (
              <button
                key={chip}
                type="button"
                onClick={() => toggleInterestChip(chip)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition ${
                  active
                    ? "bg-[var(--accent)] text-white"
                    : "bg-[var(--paper)] text-[var(--muted)] ring-1 ring-[var(--border)] hover:text-[var(--ink)]"
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        <Field label="Your interests (edit freely)">
          <textarea
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            rows={3}
            className={inputClass}
            placeholder="Tap chips above or type your own, comma-separated — e.g. Live music, farmers markets, kid-friendly parks"
          />
        </Field>
      </section>

      <section className="space-y-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)] sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            Bucket list preferences
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
            Defaults for AI & filters
          </h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Home base and defaults for the board, events, and day planner.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Home city">
            <input
              value={homeCity}
              onChange={(e) => setHomeCity(e.target.value)}
              className={inputClass}
              placeholder="e.g. Concord, NC"
            />
          </Field>
          <Field label="Default mile radius">
            <select
              value={defaultRadiusMiles}
              onChange={(e) => setDefaultRadiusMiles(Number(e.target.value))}
              className={inputClass}
            >
              {RADIUS_OPTIONS.map((miles) => (
                <option key={miles} value={miles}>
                  {miles} miles
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Usual budget">
            <select
              value={budgetPreference}
              onChange={(e) => setBudgetPreference(e.target.value)}
              className={inputClass}
            >
              {budgets.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preferred vibe">
            <select
              value={preferredVibe}
              onChange={(e) => setPreferredVibe(e.target.value)}
              className={inputClass}
            >
              <option value="">No default</option>
              {vibes.filter(Boolean).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-3 text-sm text-[var(--ink)]">
          <input
            type="checkbox"
            checked={typicallyWithKids}
            onChange={(e) => setTypicallyWithKids(e.target.checked)}
            className="size-4 accent-[var(--accent)]"
          />
          I usually plan with kids
        </label>

        <Field label="Dietary notes">
          <textarea
            value={dietaryNotes}
            onChange={(e) => setDietaryNotes(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Vegetarian, nut allergy, no spicy food…"
          />
        </Field>
        <Field label="Things to avoid">
          <textarea
            value={avoidNotes}
            onChange={(e) => setAvoidNotes(e.target.value)}
            rows={2}
            className={inputClass}
            placeholder="Crowds, long drives, loud venues…"
          />
        </Field>
      </section>

      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
          {message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Saving…" : "Save preferences"}
      </button>
    </form>
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
