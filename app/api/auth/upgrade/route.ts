import { NextResponse } from "next/server";
import { getToken, createSession } from "@/lib/session";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function POST() {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ error: "not authenticated" }, { status: 401 });
  }

  const res = await fetch(`${BACKEND_URL}/api/v1/agency/upgrade`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { error: data.error ?? "upgrade failed" },
      { status: res.status }
    );
  }

  await createSession(data.token); // store new JWT in httpOnly cookie
  return NextResponse.json({ ok: true });
}
