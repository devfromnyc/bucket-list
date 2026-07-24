import Link from "next/link";
import Image from "next/image";

const features = [
  {
    title: "Places, events & stays",
    body: "One account for restaurants and parks, concerts and festivals, hotels and Airbnbs — each saved as a card with photos, details, and a Maps link.",
    image: "/images/landing-feature-map.png",
    alt: "Map and coffee on a sunlit outdoor table",
  },
  {
    title: "AI research on add",
    body: "Type something like “hotels near downtown Charlotte” or “free jazz in the park.” AI looks it up using your preferences; you confirm, then it becomes a card.",
    image: "/images/landing-feature-ai.png",
    alt: "Planning on a phone at a cafe table",
  },
  {
    title: "Hotels & Airbnbs",
    body: "Save lodging the same way as places — researched like a Maps search. Open the listing link when you want live prices and availability.",
    image: "/images/landing-feature-stays.png",
    alt: "Cozy boutique hotel room with warm afternoon light",
  },
  {
    title: "Build a trip",
    body: "Combine places, events, and stays into a multi-day plan. Pick stops from your lists or let AI draft the days around your destination.",
    image: "/images/landing-feature-trips.png",
    alt: "Notebook and coffee for planning a weekend trip",
  },
  {
    title: "Plan my day",
    body: "Need something for today? Mood, city, and mile radius in — a timed one-day itinerary out, without building a full trip.",
    image: "/images/landing-feature-day.png",
    alt: "Sunlit park path inviting a day outdoors",
  },
  {
    title: "Ideas chat & preferences",
    body: "Brainstorm in Ideas chat, heart favorites, and set interests so suggestions match how you actually like to go out.",
    image: "/images/landing-feature-chat.png",
    alt: "Laptop and tea ready for brainstorming ideas",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-white drop-shadow"
          >
            bucketlist.ai
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="#features"
              className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10 sm:inline"
            >
              Features
            </a>
            <Link
              href="/login"
              className="rounded-full px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--accent-soft)]"
            >
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <section className="relative min-h-[100svh] overflow-hidden">
        <Image
          src="/images/landing-hero.png"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)]/75 via-[var(--ink)]/35 to-[var(--ink)]/25" />
        <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20">
          <div className="max-w-2xl animate-[fadeUp_0.7s_ease]">
            <p className="font-[family-name:var(--font-display)] text-5xl leading-[1.05] tracking-tight text-white sm:text-6xl md:text-7xl">
              bucketlist.ai
            </p>
            <h1 className="mt-4 max-w-xl text-xl font-medium leading-snug text-white/95 sm:text-2xl">
              Save places, events, and stays — then turn them into a day or a
              full trip.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80">
              A personal bucket list with AI that knows your tastes, from dinner
              tonight to a weekend away.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              >
                Start your list
              </Link>
              <a
                href="#features"
                className="rounded-full border border-white/40 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                See features
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="mx-auto max-w-6xl scroll-mt-8 px-4 py-20 sm:px-6 sm:py-28"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
            What you get
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)] sm:text-5xl">
            From a single card to a whole trip
          </h2>
          <p className="mt-4 text-[var(--muted)]">
            Research with AI, save what you love, filter what’s nearby, then
            plan today — or stitch everything into a multi-day trip.
          </p>
        </div>

        <div className="mt-14 space-y-16">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className={`grid items-center gap-8 md:grid-cols-2 md:gap-12 ${
                index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""
              }`}
            >
              <div className="animate-[fadeUp_0.5s_ease]">
                <h3 className="font-[family-name:var(--font-display)] text-3xl text-[var(--ink)]">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--muted)]">
                  {feature.body}
                </p>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-[var(--shadow-lg)]">
                <Image
                  src={feature.image}
                  alt={feature.alt}
                  fill
                  className="object-cover transition duration-700 hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-3 md:gap-8">
          {[
            {
              step: "01",
              title: "Save the mix",
              body: "Add places, events, and stays. AI fills the card; you approve.",
            },
            {
              step: "02",
              title: "Filter nearby",
              body: "City and mile radius keep boards useful for where you are.",
            },
            {
              step: "03",
              title: "Plan a day or trip",
              body: "Quick one-day itinerary — or a multi-day trip from your lists.",
            },
          ].map((item) => (
            <div key={item.step} className="animate-[fadeUp_0.45s_ease]">
              <p className="text-xs font-semibold tracking-[0.2em] text-[var(--accent)]">
                {item.step}
              </p>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-[var(--ink)]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div className="relative overflow-hidden rounded-[2rem] bg-[var(--ink)] px-8 py-14 text-center sm:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(600px 280px at 20% 0%, rgba(15,118,110,0.55), transparent 60%), radial-gradient(500px 260px at 90% 100%, rgba(196,92,38,0.35), transparent 55%)",
            }}
          />
          <div className="relative">
            <h2 className="font-[family-name:var(--font-display)] text-4xl text-white sm:text-5xl">
              Ready when the weekend is
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-white/75">
              Create a free account and keep places, events, stays, and trips in
              one list that feels like planning — not a spreadsheet.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Log in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="font-[family-name:var(--font-display)] text-xl text-[var(--ink)]">
            bucketlist.ai
          </p>
          <p className="text-sm text-[var(--muted)]">
            Places, events, stays, and trips — worth going.
          </p>
        </div>
      </footer>
    </div>
  );
}
