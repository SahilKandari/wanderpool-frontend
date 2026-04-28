import { publicFetch } from "./client";
import type { Experience, Category } from "@/lib/types/experience";

export async function getDestinationExperiences(
  city: string,
  categoryId?: string,
  options: RequestInit = {}
): Promise<Experience[]> {
  const qs = new URLSearchParams({ city });
  if (categoryId) qs.set("category_id", categoryId);
  return publicFetch<Experience[]>(`/experiences?${qs}`, options);
}

export async function getCategoryBySlug(
  slug: string,
  options: RequestInit = {}
): Promise<Category> {
  return publicFetch<Category>(`/categories/${slug}`, options);
}

/**
 * Returns only leaf categories (is_leaf = true) — the bookable activity types.
 * Fetches root categories first, then their children, and filters to leaves only.
 */
export async function listLeafCategories(options: RequestInit = {}): Promise<Category[]> {
  const roots = await publicFetch<Category[]>("/categories", options);
  const childResults = await Promise.allSettled(
    roots.map((r) => publicFetch<Category[]>(`/categories/${r.slug}/children`, options))
  );
  const all: Category[] = [...roots];
  childResults.forEach((result) => {
    if (result.status === "fulfilled") all.push(...result.value);
  });
  return all.filter((c) => c.is_leaf && c.is_active);
}

/** "rishikesh" → "Rishikesh", "new-delhi" → "New Delhi" */
export function toDisplayCity(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** "Rishikesh" → "rishikesh", "New Delhi" → "new-delhi" */
export function toCitySlug(city: string): string {
  return city.toLowerCase().replace(/\s+/g, "-");
}
