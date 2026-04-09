import { apiFetch } from "./client";
import type { Payout } from "@/lib/types/booking";

export const payoutKeys = {
  all: ["payouts"] as const,
  list: (from?: string, to?: string) => [...payoutKeys.all, "list", from ?? "", to ?? ""] as const,
  adminList: (from?: string, to?: string) => [...payoutKeys.all, "admin", "list", from ?? "", to ?? ""] as const,
};

export async function listMyPayouts(from?: string, to?: string): Promise<Payout[]> {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const query = qs.toString();
  return apiFetch<Payout[]>(`/agency/payouts${query ? `?${query}` : ""}`);
}

export async function adminListPayouts(from?: string, to?: string): Promise<Payout[]> {
  const qs = new URLSearchParams();
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const query = qs.toString();
  return apiFetch<Payout[]>(`/admin/payouts${query ? `?${query}` : ""}`);
}

export interface MarkPaidPayload {
  agency_id: string;
  period_start: string;
  period_end: string;
  reference_id: string;
}

export async function adminMarkPayoutPaid(payload: MarkPaidPayload): Promise<{ message: string; bookings_updated: number }> {
  return apiFetch(`/admin/payouts/mark-paid`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
