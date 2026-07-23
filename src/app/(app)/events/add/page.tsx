import { AddEventWizard } from "@/components/AddEventWizard";

export default async function AddEventPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const initialQuery = params.q ?? "";

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Add event
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Research, review, save
        </h1>
        <p className="mt-2 max-w-xl text-[var(--muted)]">
          Concerts, community gatherings, festivals, free public events — AI
          pulls details, you confirm, then it becomes a card.
        </p>
      </div>
      <AddEventWizard initialQuery={initialQuery} />
    </div>
  );
}
