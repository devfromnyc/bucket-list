"use client";

import { categories, categoryLabels } from "@/lib/categories";
import type { Category } from "@/lib/schema";

type Props = {
  category: Category | "all";
  status: "all" | "todo" | "completed";
  onCategoryChange: (value: Category | "all") => void;
  onStatusChange: (value: "all" | "todo" | "completed") => void;
};

export function CategoryFilter({
  category,
  status,
  onCategoryChange,
  onStatusChange,
}: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={category === "all"}
          onClick={() => onCategoryChange("all")}
          label="All"
        />
        {categories.map((c) => (
          <FilterChip
            key={c}
            active={category === c}
            onClick={() => onCategoryChange(c)}
            label={categoryLabels[c]}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "Everything"],
            ["todo", "To-do"],
            ["completed", "Completed"],
          ] as const
        ).map(([value, label]) => (
          <FilterChip
            key={value}
            active={status === value}
            onClick={() => onStatusChange(value)}
            label={label}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-wide transition ${
        active
          ? "bg-[var(--ink)] text-[var(--paper)]"
          : "bg-[var(--surface)] text-[var(--muted)] ring-1 ring-[var(--border)] hover:text-[var(--ink)]"
      }`}
    >
      {label}
    </button>
  );
}
