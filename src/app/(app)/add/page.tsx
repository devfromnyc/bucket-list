import { AddPlaceWizard } from "@/components/AddPlaceWizard";

export default async function AddPage({
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
          Add place
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Research, review, save
        </h1>
        <p className="mt-2 max-w-xl text-[var(--muted)]">
          Type a place name. AI pulls details from the web — including a Maps
          link when it can — then you confirm before it becomes a card.
        </p>
      </div>
      <AddPlaceWizard initialQuery={initialQuery} />
    </div>
  );
}
