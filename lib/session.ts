import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AuthUser } from "./types/auth";

const COOKIE_NAME = "wp_token";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "wanderpool-dev-secret-change-in-prod"
);

export async function createSession(token: string): Promise<void> {
  // Decode the JWT from the Go backend to get the expiry.
  // We don't verify it here — Go already verified it when it issued it.
  // We just read the exp claim to set a matching cookie max-age.
  let maxAge = 72 * 60 * 60; // default 72 hours
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf8")
      );
      if (payload.exp) {
        maxAge = payload.exp - Math.floor(Date.now() / 1000);
      }
    }
  } catch {
    // ignore, use default
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

/** Decode the Go-issued JWT without verifying — used in Route Handlers / Server Components */
export function decodeToken(token: string): AuthUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8")
    );
    return {
      actorId: payload.actor_id ?? payload.sub,
      actorKind: payload.actor_kind,
      accountType: payload.account_type,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getToken();
  if (!token) return null;
  return decodeToken(token);
}
