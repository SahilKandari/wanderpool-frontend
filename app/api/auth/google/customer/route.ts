import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  const { credential } = await request.json();

  if (!credential) {
    return NextResponse.json({ error: "credential is required" }, { status: 400 });
  }

  const backendRes = await fetch(
    `${BACKEND_URL}/api/v1/auth/google/customer`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_token: credential }),
    }
  );

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(
      { error: data.error ?? "Google sign-in failed" },
      { status: backendRes.status }
    );
  }

  await createSession(data.token);

  return NextResponse.json({ user: data.customer ?? null });
}
