import { getSessionUser } from "@/lib/auth";
import { streamChat } from "@/lib/gemini";
import {
  ensureProfile,
  formatPreferencesForAi,
} from "@/lib/preferences";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return Response.json({ error: "Messages required" }, { status: 400 });
    }

    const session = await getSessionUser();
    const profile = session
      ? await ensureProfile({ email: session.email, name: session.name })
      : null;

    const formatted = messages.map(
      (m: { role: string; content: string }) => ({
        role: (m.role === "assistant" ? "model" : "user") as "user" | "model",
        parts: [{ text: String(m.content ?? "") }],
      }),
    );

    const stream = await streamChat(
      formatted,
      formatPreferencesForAi(profile),
    );
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Stream failed";
          controller.enqueue(encoder.encode(`\n\n[Error: ${message}]`));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Chat failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
