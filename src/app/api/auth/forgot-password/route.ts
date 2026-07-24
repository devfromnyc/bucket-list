import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/passwordReset";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "");

    await requestPasswordReset(email);

    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for that email, we sent a reset link. Check your inbox.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start password reset";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
