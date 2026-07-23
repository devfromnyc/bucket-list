"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Message = { role: "user" | "assistant"; content: string };

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Tell me a city, vibe, or constraint — kids, outdoors, food, rainy day — and I’ll suggest places for your list.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || streaming) return;

    const nextMessages: Message[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Chat failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistant = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistant += decoder.decode(value, { stream: true });
        const snapshot = assistant;
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: snapshot };
          return copy;
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Sorry — ${message}` },
      ]);
    } finally {
      setStreaming(false);
    }
  }

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")?.content;

  const suggestedNames = extractBoldNames(lastAssistant ?? "");

  return (
    <div className="flex h-[min(70vh,720px)] flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow)]">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
        {messages.map((message, i) => (
          <div
            key={`${message.role}-${i}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                message.role === "user"
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "bg-[var(--paper)] text-[var(--ink)] ring-1 ring-[var(--border)]"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {suggestedNames.length > 0 ? (
        <div className="flex flex-wrap gap-2 border-t border-[var(--border)] px-4 py-3 sm:px-6">
          <span className="w-full text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Add to list
          </span>
          {suggestedNames.map((name) => (
            <Link
              key={name}
              href={`/add?q=${encodeURIComponent(name)}`}
              className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white"
            >
              {name}
            </Link>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={send}
        className="flex gap-2 border-t border-[var(--border)] p-4 sm:px-6"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for ideas near you…"
          className="flex-1 rounded-full border border-[var(--border)] bg-[var(--paper)] px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
          disabled={streaming}
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function extractBoldNames(text: string) {
  const matches = [...text.matchAll(/\*\*([^*]+)\*\*/g)].map((m) =>
    m[1].trim(),
  );
  return [...new Set(matches)].slice(0, 6);
}
