import { PreferencesForm } from "@/components/PreferencesForm";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Account settings
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Preferences
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Tell bucketlist.ai about you once — interests, home city, and defaults
          power better place and event recommendations without the retyping.
        </p>
      </div>
      <PreferencesForm />
    </div>
  );
}
