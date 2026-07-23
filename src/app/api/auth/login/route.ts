import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  checkPassword,
  createSessionToken,
} from "@/lib/auth";
import { ensureProfile } from "@/lib/preferences";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = String(body.password ?? "");
    const name = body.name ? String(body.name) : undefined;
    const email = body.email ? String(body.email) : undefined;

    if (!checkPassword(password)) {
      return NextResponse.json(
        { error: "Invalid password. Use the app password from your .env setup." },
        { status: 401 },
      );
    }

    await ensureProfile({ email, name });

    const token = await createSessionToken({ name, email });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(AUTH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Login failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
