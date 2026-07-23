import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { DEFAULT_PROFILE_EMAIL } from "./preferences";

export const AUTH_COOKIE = "bucket_list_session";

export type SessionUser = {
  authenticated: true;
  name?: string;
  email: string;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(profile?: {
  name?: string;
  email?: string;
}) {
  const email =
    profile?.email?.trim().toLowerCase() || DEFAULT_PROFILE_EMAIL;
  return new SignJWT({
    authenticated: true,
    name: profile?.name?.trim() || undefined,
    email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.authenticated === true;
  } catch {
    return false;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.authenticated !== true) return null;
    return {
      authenticated: true,
      name: typeof payload.name === "string" ? payload.name : undefined,
      email:
        typeof payload.email === "string" && payload.email
          ? payload.email
          : DEFAULT_PROFILE_EMAIL,
    };
  } catch {
    return null;
  }
}

export async function isAuthenticated() {
  return (await getSessionUser()) !== null;
}

export function checkPassword(password: string) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    throw new Error("APP_PASSWORD is not set");
  }
  return password === expected;
}
