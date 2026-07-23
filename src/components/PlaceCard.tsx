import type { Category, Place } from "@/lib/schema";
import { categoryLabels } from "@/lib/categories";

type Props = {
  place: Place;
  onToggle: (id: string) => void;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
};

export function PlaceCard({ place, onToggle, onFavorite, onDelete }: Props) {
  const category = place.category as Category;

  return (
    <article
      className={`place-card group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] ${
        place.completed ? "opacity-70" : ""
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface-muted)]">
        {place.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-end bg-[image:var(--hero-fallback)] p-4">
            <span className="font-[family-name:var(--font-display)] text-2xl text-white/90">
              {place.title.slice(0, 1)}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-[var(--ink)]/80 px-3 py-1 text-xs font-medium tracking-wide text-[var(--paper)] backdrop-blur">
          {categoryLabels[category] ?? "Other"}
        </span>
        <button
          type="button"
          onClick={() => onFavorite(place.id)}
          aria-label={place.favorited ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={place.favorited}
          className={`absolute right-3 top-3 flex size-9 items-center justify-center rounded-full backdrop-blur transition ${
            place.favorited
              ? "bg-[#c45c26] text-white"
              : "bg-[var(--ink)]/70 text-white/90 hover:bg-[var(--ink)]"
          }`}
        >
          <HeartIcon filled={place.favorited} />
        </button>
        {place.completed && (
          <span className="absolute bottom-3 left-3 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
            Done
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2
            className={`font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--ink)] ${
              place.completed ? "line-through decoration-[var(--muted)]" : ""
            }`}
          >
            {place.title}
          </h2>
          {place.city ? (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--accent)]">
              {place.city}
            </p>
          ) : null}
          {place.description ? (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">
              {place.description}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {place.mapsUrl ? (
            <a
              href={place.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Maps
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => onToggle(place.id)}
            className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            {place.completed ? "Mark to-do" : "Mark done"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(place.id)}
            className="ml-auto rounded-full px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition hover:text-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
      />
    </svg>
  );
}
