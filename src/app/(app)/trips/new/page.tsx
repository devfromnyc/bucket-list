import { NewTripForm } from "@/components/NewTripForm";

export default function NewTripPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          New trip
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Start a trip
        </h1>
        <p className="mt-2 max-w-xl text-[var(--muted)]">
          Name it, set a destination, then add stops from your places, events,
          and stays — or let AI draft the days.
        </p>
      </div>
      <NewTripForm />
    </div>
  );
}
