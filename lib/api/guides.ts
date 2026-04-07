import { apiFetch } from "./client";
import type { Operator } from "@/lib/types/booking";

export const guideKeys = {
  all: ["guides"] as const,
  list: () => [...guideKeys.all, "list"] as const,
  detail: (id: string) => [...guideKeys.all, id] as const,
};

export async function listGuides(): Promise<Operator[]> {
  return apiFetch<Operator[]>("/agency/operators");
}

export async function inviteGuide(data: {
  name: string;
  email: string;
  phone: string;
}): Promise<Operator> {
  return apiFetch<Operator>("/agency/operators", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateGuideStatus(
  id: string,
  status: "active" | "inactive" | "suspended"
): Promise<Operator> {
  return apiFetch<Operator>(`/agency/operators/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function removeGuide(id: string): Promise<void> {
  return apiFetch<void>(`/agency/operators/${id}`, { method: "DELETE" });
}
