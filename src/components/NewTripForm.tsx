"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function NewTripForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [startsOn, setStartsOn] = useState("");
  const [endsOn, setEndsOn] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          destinationCity: destinationCity || null,
          startsOn: startsOn || null,
          endsOn: endsOn || null,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not create trip");
      router.push(`/trips/${data.trip.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  const inputClass =
    "w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]";

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
          Trip name
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='e.g. "Asheville weekend"'
          className={inputClass}
          required
          autoFocus
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
          Destination city
        </label>
        <input
          value={destinationCity}
          onChange={(e) => setDestinationCity(e.target.value)}
          placeholder="City used to match your saved lists"
          className={inputClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
            Starts
          </label>
          <input
            type="date"
            value={startsOn}
            onChange={(e) => setStartsOn(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
            Ends
          </label>
          <input
            type="date"
            value={endsOn}
            onChange={(e) => setEndsOn(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--ink)]">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Vibe, must-dos, travel companions…"
          className={inputClass}
        />
      </div>
      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {saving ? "Creating…" : "Create trip"}
      </button>
    </form>
  );
}
