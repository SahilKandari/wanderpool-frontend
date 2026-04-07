import { apiFetch, publicFetch } from "./client";
import type { Experience, ExperienceImage } from "@/lib/types/experience";

export const experienceKeys = {
  all: ["experiences"] as const,
  list: (params?: Record<string, string>) =>
    [...experienceKeys.all, "list", params] as const,
  mine: () => [...experienceKeys.all, "mine"] as const,
  detail: (id: string) => [...experienceKeys.all, id] as const,
  images: (id: string) => [...experienceKeys.all, id, "images"] as const,
};

export async function listPublicExperiences(params?: {
  city?: string;
  category_id?: string;
  min_price?: number;
  max_price?: number;
  limit?: number;
  offset?: number;
}): Promise<Experience[]> {
  const qs = new URLSearchParams();
  if (params?.city) qs.set("city", params.city);
  if (params?.category_id) qs.set("category_id", params.category_id);
  if (params?.min_price != null) qs.set("min_price", String(params.min_price));
  if (params?.max_price != null) qs.set("max_price", String(params.max_price));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.offset) qs.set("offset", String(params.offset));
  const query = qs.toString() ? `?${qs}` : "";
  return publicFetch<Experience[]>(`/experiences${query}`);
}

export async function listMyExperiences(): Promise<Experience[]> {
  return apiFetch<Experience[]>("/experiences/mine");
}

export async function getExperienceBySlug(slug: string): Promise<Experience> {
  return publicFetch<Experience>(`/experiences/${slug}`);
}

export interface ExperiencePayload {
  category_id?: string;
  title: string;
  description: string;
  location_name: string;
  location_city: string;
  location_state: string;
  meeting_point?: string | null;
  base_price_paise: number;
  min_participants: number;
  max_participants: number;
  duration_minutes: number;
  cancellation_policy: string;
  inclusions: string[];
  exclusions: string[];
  metadata: Record<string, unknown>;
}

export async function createExperience(
  data: ExperiencePayload
): Promise<Experience> {
  return apiFetch<Experience>("/experiences", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateExperience(
  id: string,
  data: ExperiencePayload
): Promise<Experience> {
  return apiFetch<Experience>(`/experiences/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteExperience(id: string): Promise<void> {
  return apiFetch<void>(`/experiences/${id}`, { method: "DELETE" });
}

export async function listExperienceImages(
  experienceId: string
): Promise<ExperienceImage[]> {
  return apiFetch<ExperienceImage[]>(`/experiences/${experienceId}/images`);
}

export async function addExperienceImage(
  experienceId: string,
  data: { public_id: string; url: string; alt_text?: string }
): Promise<ExperienceImage> {
  return apiFetch<ExperienceImage>(`/experiences/${experienceId}/images`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteExperienceImage(
  experienceId: string,
  imageId: string
): Promise<void> {
  return apiFetch<void>(`/experiences/${experienceId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function setCoverImage(
  experienceId: string,
  imageId: string
): Promise<void> {
  return apiFetch<void>(
    `/experiences/${experienceId}/images/${imageId}/cover`,
    { method: "PATCH" }
  );
}

export async function reorderImages(
  experienceId: string,
  imageIds: string[]
): Promise<void> {
  return apiFetch<void>(`/experiences/${experienceId}/images/order`, {
    method: "PUT",
    body: JSON.stringify({ image_ids: imageIds }),
  });
}
