"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { categories, categoryLabels } from "@/lib/categories";
import type { Category } from "@/lib/schema";
import type { EnrichResult } from "@/lib/gemini";

type Step = "input" | "loading" | "preview";

export function AddPlaceWizard({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [query, setQuery] = useState(initialQuery);
  const [categoryHint, setCategoryHint] = useState<Category | "">("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState<EnrichResult | null>(null);

  const canSearch = useMemo(() => query.trim().length > 1, [query]);

  async function runEnrich(e: React.FormEvent) {
    e.preventDefault();
    if (!canSearch) return;
    setError(null);
    setStep("loading");

    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          category: categoryHint || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not research place");
      setDraft(data.result);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStep("input");
    }
  }

  async function savePlace() {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draft.title,
          description: draft.description,
          category: draft.category,
          city: draft.city,
          latitude: draft.latitude,
          longitude: draft.longitude,
          imageUrl: draft.imageUrl,
          mapsUrl: draft.mapsUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save place");
      router.push("/board");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      {step === "input" || step === "loading" ? (
        <form onSubmit={runEnrich} className="space-y-5">
          <div>
            <label
              htmlFor="query"
              className="mb-2 block text-sm font-medium text-[var(--ink)]"
            >
              Place or thing to do
            </label>
            <input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. "concord nc mall"'
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)] outline-none ring-[var(--accent)] transition focus:ring-2"
              disabled={step === "loading"}
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="category"
              className="mb-2 block text-sm font-medium text-[var(--ink)]"
            >
              Category hint (optional)
            </label>
            <select
              id="category"
              value={categoryHint}
              onChange={(e) =>
                setCategoryHint((e.target.value as Category | "") || "")
              }
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
              disabled={step === "loading"}
            >
              <option value="">Let AI choose</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabels[c]}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={!canSearch || step === "loading"}
            className="w-full rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {step === "loading" ? "Researching…" : "Research with AI"}
          </button>
        </form>
      ) : null}

      {step === "preview" && draft ? (
        <div className="space-y-5 animate-[fadeUp_0.4s_ease]">
          <p className="text-sm text-[var(--muted)]">
            Review the AI results, tweak anything that looks off, then save the
            card.
          </p>

          {draft.notes ? (
            <p className="rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-sm text-[var(--accent)]">
              {draft.notes}
            </p>
          ) : null}

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
            <div className="aspect-[16/10] bg-[var(--surface-muted)]">
              {draft.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-[var(--muted)]">
                  No image found — you can paste a URL below
                </div>
              )}
            </div>
            <div className="space-y-3 p-5">
              <Field
                label="Title"
                value={draft.title}
                onChange={(v) => setDraft({ ...draft, title: v })}
              />
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Description
                </label>
                <textarea
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  rows={4}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Category
                </label>
                <select
                  value={draft.category}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      category: e.target.value as Category,
                    })
                  }
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {categoryLabels[c]}
                    </option>
                  ))}
                </select>
              </div>
              <Field
                label="City"
                value={draft.city ?? ""}
                onChange={(v) => setDraft({ ...draft, city: v || null })}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Latitude"
                  value={draft.latitude != null ? String(draft.latitude) : ""}
                  onChange={(v) =>
                    setDraft({
                      ...draft,
                      latitude: v.trim() === "" ? null : Number(v),
                    })
                  }
                />
                <Field
                  label="Longitude"
                  value={draft.longitude != null ? String(draft.longitude) : ""}
                  onChange={(v) =>
                    setDraft({
                      ...draft,
                      longitude: v.trim() === "" ? null : Number(v),
                    })
                  }
                />
              </div>
              <Field
                label="Google Maps URL"
                value={draft.mapsUrl ?? ""}
                onChange={(v) => setDraft({ ...draft, mapsUrl: v || null })}
              />
              <Field
                label="Image URL"
                value={draft.imageUrl ?? ""}
                onChange={(v) => setDraft({ ...draft, imageUrl: v || null })}
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                setStep("input");
                setDraft(null);
              }}
              className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--ink)]"
            >
              Back
            </button>
            <button
              type="button"
              onClick={savePlace}
              disabled={saving || !draft.title.trim()}
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Looks good — save card"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
    </div>
  );
}
