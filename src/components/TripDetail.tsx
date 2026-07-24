"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Event, Place, Stay, Trip, TripStop } from "@/lib/schema";
import {
  tripStatusLabels,
  tripStopKindLabels,
  tripStatuses,
  groupStopsByDay,
} from "@/lib/tripLabels";

type TripWithStops = Trip & { stops: TripStop[] };

export function TripDetail({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [trip, setTrip] = useState<TripWithStops | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);
  const [criteria, setCriteria] = useState("");
  const [dayCount, setDayCount] = useState(3);
  const [pickerDay, setPickerDay] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTab, setPickerTab] = useState<"place" | "event" | "stay" | "custom">(
    "place",
  );
  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [customTitle, setCustomTitle] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setTrip(data.trip);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    void load();
  }, [load]);

  const days = useMemo(
    () => (trip ? groupStopsByDay(trip.stops) : []),
    [trip],
  );

  const maxDay = useMemo(() => {
    if (!trip || trip.stops.length === 0) return Math.max(0, dayCount - 1);
    return Math.max(...trip.stops.map((s) => s.dayIndex), dayCount - 1);
  }, [trip, dayCount]);

  async function loadPickerLists() {
    const city = trip?.destinationCity?.trim();
    const q = city ? `?city=${encodeURIComponent(city)}` : "";
    const [pRes, eRes, sRes] = await Promise.all([
      fetch(`/api/places${q}`),
      fetch(`/api/events${q}`),
      fetch(`/api/stays${q}`),
    ]);
    const [pData, eData, sData] = await Promise.all([
      pRes.json(),
      eRes.json(),
      sRes.json(),
    ]);
    if (pRes.ok) setPlaces(pData.places ?? []);
    if (eRes.ok) setEvents(eData.events ?? []);
    if (sRes.ok) setStays(sData.stays ?? []);
  }

  async function openPicker(dayIndex: number) {
    setPickerDay(dayIndex);
    setPickerOpen(true);
    setMessage(null);
    await loadPickerLists();
  }

  async function addSaved(
    kind: "place" | "event" | "stay",
    refId: string,
  ) {
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/stops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, refId, dayIndex: pickerDay }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add stop");
      setTrip((prev) =>
        prev
          ? { ...prev, stops: [...prev.stops, data.stop] }
          : prev,
      );
      setPickerOpen(false);
      setMessage("Stop added");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add");
    } finally {
      setAdding(false);
    }
  }

  async function addCustom() {
    if (!customTitle.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/stops`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "custom",
          title: customTitle.trim(),
          notes: customNotes.trim() || null,
          dayIndex: pickerDay,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not add stop");
      setTrip((prev) =>
        prev
          ? { ...prev, stops: [...prev.stops, data.stop] }
          : prev,
      );
      setCustomTitle("");
      setCustomNotes("");
      setPickerOpen(false);
      setMessage("Custom stop added");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add");
    } finally {
      setAdding(false);
    }
  }

  async function removeStop(stopId: string) {
    if (!confirm("Remove this stop?")) return;
    const res = await fetch(`/api/trips/${tripId}/stops/${stopId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTrip((prev) =>
        prev
          ? { ...prev, stops: prev.stops.filter((s) => s.id !== stopId) }
          : prev,
      );
    }
  }

  async function updateStatus(status: string) {
    const res = await fetch(`/api/trips/${tripId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      setTrip((prev) => (prev ? { ...prev, ...data.trip, stops: prev.stops } : prev));
    }
  }

  async function runDraft() {
    if (
      trip &&
      trip.stops.length > 0 &&
      !confirm("AI draft will replace current stops. Continue?")
    ) {
      return;
    }
    setDrafting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/trips/${tripId}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apply: true,
          criteria,
          dayCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Draft failed");
      setTrip(data.trip);
      setMessage(data.draft?.summary || "Trip drafted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Draft failed");
    } finally {
      setDrafting(false);
    }
  }

  async function onDeleteTrip() {
    if (!confirm("Delete this entire trip?")) return;
    const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/trips");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-3xl bg-[var(--surface-muted)]" />
    );
  }

  if (!trip) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error || "Trip not found"}
      </div>
    );
  }

  const dayIndexes = Array.from({ length: maxDay + 1 }, (_, i) => i);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/trips"
            className="text-sm font-medium text-[var(--muted)] hover:text-[var(--accent)]"
          >
            ← All trips
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
            {trip.title}
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            {[trip.destinationCity, trip.startsOn, trip.endsOn]
              .filter(Boolean)
              .join(" · ") || "Flexible dates"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={trip.status}
            onChange={(e) => updateStatus(e.target.value)}
            className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm outline-none"
          >
            {tripStatuses.map((s) => (
              <option key={s} value={s}>
                {tripStatusLabels[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onDeleteTrip}
            className="rounded-full px-4 py-2 text-sm text-[var(--muted)] hover:text-red-600"
          >
            Delete trip
          </button>
        </div>
      </div>

      <section className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[var(--shadow)]">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
          AI draft from your lists
        </h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Uses your prefs plus saved places, events, and stays near this
          destination. Replaces current stops when applied.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Extra criteria
            </label>
            <input
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="Chill pace, one nice dinner, kid-friendly…"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
              Days
            </label>
            <input
              type="number"
              min={1}
              max={14}
              value={dayCount}
              onChange={(e) => setDayCount(Number(e.target.value) || 1)}
              className="w-24 rounded-2xl border border-[var(--border)] bg-[var(--paper)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
          <button
            type="button"
            onClick={runDraft}
            disabled={drafting}
            className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {drafting ? "Drafting…" : "Draft with AI"}
          </button>
        </div>
      </section>

      {message ? (
        <p className="rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-8">
        {dayIndexes.map((dayIndex) => {
          const day = days.find((d) => d.dayIndex === dayIndex);
          const stops = day?.stops ?? [];
          return (
            <section key={dayIndex} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                  Day {dayIndex + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => openPicker(dayIndex)}
                  className="rounded-full bg-[var(--accent-soft)] px-4 py-2 text-xs font-semibold text-[var(--accent)]"
                >
                  Add stop
                </button>
              </div>
              {stops.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--border)] px-4 py-8 text-center text-sm text-[var(--muted)]">
                  No stops yet — add from your lists or run an AI draft.
                </p>
              ) : (
                <div className="space-y-3">
                  {stops.map((stop) => (
                    <article
                      key={stop.id}
                      className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow)]"
                    >
                      {stop.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={stop.imageUrl}
                          alt=""
                          className="hidden h-20 w-28 shrink-0 rounded-xl object-cover sm:block"
                        />
                      ) : (
                        <div className="hidden h-20 w-28 shrink-0 rounded-xl bg-[var(--surface-muted)] sm:block" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-[var(--ink)]/90 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--paper)]">
                            {tripStopKindLabels[
                              stop.kind as keyof typeof tripStopKindLabels
                            ] ?? stop.kind}
                          </span>
                          {stop.startTime ? (
                            <span className="text-xs font-medium text-[var(--accent)]">
                              {stop.startTime}
                            </span>
                          ) : null}
                        </div>
                        <h4 className="mt-1 font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
                          {stop.title}
                        </h4>
                        {stop.notes ? (
                          <p className="mt-1 line-clamp-2 text-sm text-[var(--muted)]">
                            {stop.notes}
                          </p>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {stop.mapsUrl ? (
                            <a
                              href={stop.mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs font-medium hover:border-[var(--accent)] hover:text-[var(--accent)]"
                            >
                              Maps
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => removeStop(stop.id)}
                            className="rounded-full px-3 py-1 text-xs text-[var(--muted)] hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          );
        })}
        <button
          type="button"
          onClick={() => openPicker(maxDay + 1)}
          className="rounded-full border border-dashed border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          + Add another day
        </button>
      </div>

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--ink)]/40 p-4 sm:items-center">
          <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-3xl bg-[var(--paper)] shadow-[var(--shadow-lg)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <h3 className="font-[family-name:var(--font-display)] text-xl">
                Add to Day {pickerDay + 1}
              </h3>
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="text-sm text-[var(--muted)]"
              >
                Close
              </button>
            </div>
            <div className="flex gap-2 border-b border-[var(--border)] px-5 py-3">
              {(
                [
                  ["place", "Places"],
                  ["event", "Events"],
                  ["stay", "Stays"],
                  ["custom", "Custom"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPickerTab(value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    pickerTab === value
                      ? "bg-[var(--ink)] text-[var(--paper)]"
                      : "bg-[var(--surface)] text-[var(--muted)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="max-h-[55vh] overflow-y-auto p-5">
              {pickerTab === "custom" ? (
                <div className="space-y-3">
                  <input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Stop title"
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Notes (optional)"
                    rows={3}
                    className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <button
                    type="button"
                    disabled={adding || !customTitle.trim()}
                    onClick={addCustom}
                    className="w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {adding ? "Adding…" : "Add custom stop"}
                  </button>
                </div>
              ) : pickerTab === "place" ? (
                <PickerList
                  empty="No places found"
                  items={places.map((p) => ({
                    id: p.id,
                    title: p.title,
                    meta: p.city,
                  }))}
                  disabled={adding}
                  onPick={(id) => addSaved("place", id)}
                />
              ) : pickerTab === "event" ? (
                <PickerList
                  empty="No events found"
                  items={events.map((e) => ({
                    id: e.id,
                    title: e.title,
                    meta: [e.venue, e.city].filter(Boolean).join(" · "),
                  }))}
                  disabled={adding}
                  onPick={(id) => addSaved("event", id)}
                />
              ) : (
                <PickerList
                  empty="No stays found"
                  items={stays.map((s) => ({
                    id: s.id,
                    title: s.title,
                    meta: [s.neighborhood, s.city].filter(Boolean).join(" · "),
                  }))}
                  disabled={adding}
                  onPick={(id) => addSaved("stay", id)}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PickerList({
  items,
  empty,
  disabled,
  onPick,
}: {
  items: { id: string; title: string; meta?: string | null }[];
  empty: string;
  disabled: boolean;
  onPick: (id: string) => void;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--muted)]">{empty}</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(item.id)}
            className="flex w-full flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-left transition hover:border-[var(--accent)] disabled:opacity-50"
          >
            <span className="font-medium text-[var(--ink)]">{item.title}</span>
            {item.meta ? (
              <span className="text-xs text-[var(--muted)]">{item.meta}</span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
