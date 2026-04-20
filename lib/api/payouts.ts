import { apiFetch } from "./client";
import type { BookingPayout } from "@/lib/types/booking";

export const payoutKeys = {
  all: ["payouts"] as const,
  list: (status?: string, from?: string, to?: string) =>
    [...payoutKeys.all, "list", status ?? "", from ?? "", to ?? ""] as const,
  adminList: (agencyId?: string, status?: string, from?: string, to?: string) =>
    [...payoutKeys.all, "admin", "list", agencyId ?? "", status ?? "", from ?? "", to ?? ""] as const,
};

export async function listMyPayouts(
  status?: string,
  from?: string,
  to?: string,
): Promise<BookingPayout[]> {
  const qs = new URLSearchParams();
  if (status && status !== "all") qs.set("status", status);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const query = qs.toString();
  return apiFetch<BookingPayout[]>(`/agency/payouts${query ? `?${query}` : ""}`);
}

export async function adminListPayouts(
  agencyId?: string,
  status?: string,
  from?: string,
  to?: string,
): Promise<BookingPayout[]> {
  const qs = new URLSearchParams();
  if (agencyId) qs.set("agency_id", agencyId);
  if (status && status !== "all") qs.set("status", status);
  if (from) qs.set("from", from);
  if (to) qs.set("to", to);
  const query = qs.toString();
  return apiFetch<BookingPayout[]>(`/admin/payouts${query ? `?${query}` : ""}`);
}

export async function adminMarkPayoutPaid(
  bookingId: string,
  referenceId: string,
): Promise<{ message: string }> {
  return apiFetch(`/admin/payouts/${bookingId}/mark-paid`, {
    method: "POST",
    body: JSON.stringify({ reference_id: referenceId }),
  });
}
