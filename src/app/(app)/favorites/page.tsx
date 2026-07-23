"use client";

import { useState } from "react";
import { FavoritesBoard } from "@/components/FavoritesBoard";
import { EventsBoard } from "@/components/EventsBoard";

export default function FavoritesPage() {
  const [tab, setTab] = useState<"places" | "events">("places");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("places")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "places"
              ? "bg-[var(--ink)] text-[var(--paper)]"
              : "bg-[var(--surface)] text-[var(--muted)] ring-1 ring-[var(--border)]"
          }`}
        >
          Places
        </button>
        <button
          type="button"
          onClick={() => setTab("events")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            tab === "events"
              ? "bg-[var(--ink)] text-[var(--paper)]"
              : "bg-[var(--surface)] text-[var(--muted)] ring-1 ring-[var(--border)]"
          }`}
        >
          Events
        </button>
      </div>
      {tab === "places" ? <FavoritesBoard /> : <EventsBoard favoritesOnly />}
    </div>
  );
}
