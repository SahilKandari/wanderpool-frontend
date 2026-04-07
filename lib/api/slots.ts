import { apiFetch } from "./client";

export const slotKeys = {
  all: ["slots"] as const,
  forExperience: (expId: string) => [...slotKeys.all, expId] as const,
};

export interface AgencySlot {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked_count: number;
  is_available: boolean;
}

export async function listAgencyExperienceSlots(expId: string): Promise<AgencySlot[]> {
  return apiFetch<AgencySlot[]>(`/agency/experiences/${expId}/slots`);
}

export async function createSlot(
  expId: string,
  data: { starts_at: string; ends_at: string; capacity: number }
): Promise<{ id: string }> {
  return apiFetch<{ id: string }>(`/agency/experiences/${expId}/slots`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface BulkCreateSlotsInput {
  date_from: string;      // YYYY-MM-DD
  date_to: string;        // YYYY-MM-DD
  time_slots: string[];   // ["09:00", "14:00"]
  days_of_week?: number[];// 0=Sun…6=Sat; omit = every day
  capacity: number;
}

export async function bulkCreateSlots(
  expId: string,
  data: BulkCreateSlotsInput
): Promise<{ created: number; total: number }> {
  return apiFetch<{ created: number; total: number }>(
    `/agency/experiences/${expId}/slots/bulk`,
    { method: "POST", body: JSON.stringify(data) }
  );
}

export async function deleteSlot(expId: string, slotId: string): Promise<void> {
  await apiFetch<void>(`/agency/experiences/${expId}/slots/${slotId}`, {
    method: "DELETE",
  });
}
