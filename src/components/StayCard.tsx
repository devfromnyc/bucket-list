import type { Stay, StayCategory } from "@/lib/schema";
import { stayCategoryLabels } from "@/lib/stayCategories";

type Props = {
  stay: Stay;
  onToggle: (id: string) => void;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
};

export function StayCard({ stay, onToggle, onFavorite, onDelete }: Props) {
  const category = stay.category as StayCategory;

  return (
    <article
      className={`place-card group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] ${
        stay.completed ? "opacity-70" : ""
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--surface-muted)]">
        {stay.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={stay.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-end bg-[image:var(--hero-fallback)] p-4">
            <span className="font-[family-name:var(--font-display)] text-2xl text-white/90">
              {stay.title.slice(0, 1)}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-[var(--ink)]/80 px-3 py-1 text-xs font-medium tracking-wide text-[var(--paper)] backdrop-blur">
          {stayCategoryLabels[category] ?? "Other"}
        </span>
        <button
          type="button"
          onClick={() => onFavorite(stay.id)}
          aria-label={
            stay.favorited ? "Remove from favorites" : "Add to favorites"
          }
          aria-pressed={stay.favorited}
          className={`absolute right-3 top-3 flex size-9 items-center justify-center rounded-full backdrop-blur transition ${
            stay.favorited
              ? "bg-[#c45c26] text-white"
              : "bg-[var(--ink)]/70 text-white/90 hover:bg-[var(--ink)]"
          }`}
        >
          <HeartIcon filled={stay.favorited} />
        </button>
        {stay.priceBand ? (
          <span className="absolute bottom-3 right-3 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white">
            {stay.priceBand}
          </span>
        ) : null}
        {stay.completed && (
          <span className="absolute bottom-3 left-3 rounded-full bg-[var(--ink)]/80 px-3 py-1 text-xs font-semibold text-white">
            Stayed
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h2
            className={`font-[family-name:var(--font-display)] text-xl leading-snug text-[var(--ink)] ${
              stay.completed ? "line-through decoration-[var(--muted)]" : ""
            }`}
          >
            {stay.title}
          </h2>
          {stay.neighborhood || stay.city ? (
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              {[stay.neighborhood, stay.city].filter(Boolean).join(" · ")}
            </p>
          ) : null}
          {stay.description ? (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[var(--muted)]">
              {stay.description}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          {stay.mapsUrl ? (
            <a
              href={stay.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Maps
            </a>
          ) : null}
          {stay.bookingUrl ? (
            <a
              href={stay.bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Listing
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => onToggle(stay.id)}
            className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
          >
            {stay.completed ? "Back to wishlist" : "Mark stayed"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(stay.id)}
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
