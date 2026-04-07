/**
 * BFF Proxy — forwards requests from client components to the Go backend,
 * attaching the httpOnly cookie JWT as the Authorization header.
 *
 * Usage from client: fetch("/api/proxy/experiences/mine")
 * Forwards to:       GET http://localhost:8080/api/v1/experiences/mine
 *                    Authorization: Bearer <token-from-cookie>
 */
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/session";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";

async function handler(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const apiPath = path.join("/");
  const search = request.nextUrl.search ?? "";
  const url = `${BACKEND_URL}/api/v1/${apiPath}${search}`;

  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    body = await request.text();
  }

  const backendRes = await fetch(url, {
    method: request.method,
    headers,
    body,
  });

  const responseBody =
    backendRes.status === 204 ? null : await backendRes.text();

  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: {
      "Content-Type":
        backendRes.headers.get("Content-Type") ?? "application/json",
    },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
