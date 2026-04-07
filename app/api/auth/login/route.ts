import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { role, ...credentials } = body as {
    role: "agency" | "admin" | "operator" | "customer";
    email: string;
    password: string;
  };

  let endpoint: string;
  if (role === "admin") {
    endpoint = `${BACKEND_URL}/api/v1/admin/auth/login`;
  } else if (role === "operator") {
    endpoint = `${BACKEND_URL}/api/v1/auth/login/operator`;
  } else if (role === "customer") {
    endpoint = `${BACKEND_URL}/api/v1/auth/login/customer`;
  } else {
    endpoint = `${BACKEND_URL}/api/v1/auth/login/agency`;
  }

  const backendRes = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(
      { error: data.error ?? "Login failed" },
      { status: backendRes.status }
    );
  }

  await createSession(data.token);

  // Return user info (no token — it's in the httpOnly cookie now)
  const user = data.agency ?? data.operator ?? data.admin ?? data.customer ?? null;
  return NextResponse.json({ user });
}
