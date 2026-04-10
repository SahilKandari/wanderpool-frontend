import { apiFetch } from "./client";
import type { Agency } from "@/lib/types/auth";

export const adminKeys = {
  all: ["admin"] as const,
  agencies: (params?: Record<string, string>) =>
    [...adminKeys.all, "agencies", params] as const,
  agency: (id: string) => [...adminKeys.all, "agencies", id] as const,
};

export async function adminGetAgency(id: string): Promise<Agency> {
  return apiFetch<Agency>(`/admin/agencies/${id}`);
}

export async function adminUpdateGates(
  id: string,
  gates: { bank_verified?: boolean; certs_verified?: boolean; video_call_done?: boolean }
): Promise<Agency> {
  return apiFetch<Agency>(`/admin/agencies/${id}/gates`, {
    method: "PATCH",
    body: JSON.stringify(gates),
  });
}

export async function adminListAgencies(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<Agency[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const query = qs.toString() ? `?${qs}` : "";
  return apiFetch<Agency[]>(`/admin/agencies${query}`);
}

export async function adminApproveAgency(id: string): Promise<Agency> {
  return apiFetch<Agency>(`/admin/agencies/${id}/approve`, { method: "POST" });
}

export async function adminRejectAgency(
  id: string,
  reason?: string
): Promise<Agency> {
  return apiFetch<Agency>(`/admin/agencies/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function adminSuspendAgency(id: string): Promise<Agency> {
  return apiFetch<Agency>(`/admin/agencies/${id}/suspend`, { method: "POST" });
}
