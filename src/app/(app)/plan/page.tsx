import { ItineraryPlanner } from "@/components/ItineraryPlanner";

export default function PlanPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Day planner
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Plan my day
        </h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          Different from Ideas chat — this builds a timed itinerary from your
          mood and criteria when you just need someone to decide for you.
        </p>
      </div>
      <ItineraryPlanner />
    </div>
  );
}
