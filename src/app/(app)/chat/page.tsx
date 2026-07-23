import { ChatPanel } from "@/components/ChatPanel";

export default function ChatPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
          Ideas chat
        </p>
        <h1 className="mt-1 font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
          Brainstorm with AI
        </h1>
        <p className="mt-2 max-w-xl text-[var(--muted)]">
          A separate space to chat through suggestions. When a place name pops
          up in bold, you can send it straight into the add flow.
        </p>
      </div>
      <ChatPanel />
    </div>
  );
}
