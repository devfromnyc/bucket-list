import { AddStayWizard } from "@/components/AddStayWizard";

export default async function AddStayPage({
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
          Add stay
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Research, review, save
        </h1>
        <p className="mt-2 max-w-xl text-[var(--muted)]">
          Hotels, Airbnbs, rentals — AI researches like a Maps search, you
          confirm, then it becomes a card. Live prices stay on Maps or the
          listing link.
        </p>
      </div>
      <AddStayWizard initialQuery={initialQuery} />
    </div>
  );
}
