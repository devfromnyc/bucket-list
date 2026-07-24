"use client";

import { useState } from "react";
import { FavoritesBoard } from "@/components/FavoritesBoard";
import { EventsBoard } from "@/components/EventsBoard";
import { StaysBoard } from "@/components/StaysBoard";

export default function FavoritesPage() {
  const [tab, setTab] = useState<"places" | "events" | "stays">("places");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["places", "Places"],
            ["events", "Events"],
            ["stays", "Stays"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === value
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "bg-[var(--surface)] text-[var(--muted)] ring-1 ring-[var(--border)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "places" ? (
        <FavoritesBoard />
      ) : tab === "events" ? (
        <EventsBoard favoritesOnly />
      ) : (
        <StaysBoard favoritesOnly />
      )}
    </div>
  );
}
