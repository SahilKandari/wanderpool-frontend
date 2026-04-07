import { apiFetch } from "./client";
import type { Payout } from "@/lib/types/booking";

export const payoutKeys = {
  all: ["payouts"] as const,
  list: () => [...payoutKeys.all, "list"] as const,
  adminList: () => [...payoutKeys.all, "admin", "list"] as const,
};

export async function listMyPayouts(): Promise<Payout[]> {
  return apiFetch<Payout[]>("/agency/payouts");
}

export async function adminListPayouts(): Promise<Payout[]> {
  return apiFetch<Payout[]>("/admin/payouts");
}

export async function adminMarkPayoutPaid(id: string, referenceId: string): Promise<Payout> {
  return apiFetch<Payout>(`/admin/payouts/${id}/pay`, {
    method: "POST",
    body: JSON.stringify({ reference_id: referenceId }),
  });
}
