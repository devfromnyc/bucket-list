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
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!checkPassword(password)) {
      return NextResponse.json(
        {
          error:
            "That access password doesn’t match. For this personal app, use APP_PASSWORD from your environment.",
        },
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
      error instanceof Error ? error.message : "Signup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
