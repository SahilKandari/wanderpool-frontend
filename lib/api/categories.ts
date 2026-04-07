import { publicFetch, apiFetch } from "./client";
import type { Category, CategoryField } from "@/lib/types/experience";

export const categoryKeys = {
  all: ["categories"] as const,
  roots: () => [...categoryKeys.all, "roots"] as const,
  children: (slug: string) =>
    [...categoryKeys.all, "children", slug] as const,
  fields: (id: string) => [...categoryKeys.all, "fields", id] as const,
};

export async function listRootCategories(): Promise<Category[]> {
  return publicFetch<Category[]>("/categories");
}

export async function listCategoryChildren(slug: string): Promise<Category[]> {
  return publicFetch<Category[]>(`/categories/${slug}/children`);
}

export async function getCategoryFields(id: string): Promise<CategoryField[]> {
  return publicFetch<CategoryField[]>(`/categories/${id}/fields`);
}

// Admin endpoints
export async function adminCreateCategory(data: {
  name: string;
  slug?: string;
  parent_id?: string;
  description?: string;
  is_leaf: boolean;
}): Promise<Category> {
  return apiFetch<Category>("/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminUpdateCategory(
  id: string,
  data: Partial<Category>
): Promise<Category> {
  return apiFetch<Category>(`/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adminDeleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/admin/categories/${id}`, { method: "DELETE" });
}

export async function adminListFields(
  categoryId: string
): Promise<CategoryField[]> {
  return apiFetch<CategoryField[]>(`/admin/categories/${categoryId}/fields`);
}

export async function adminCreateField(
  categoryId: string,
  data: Partial<CategoryField>
): Promise<CategoryField> {
  return apiFetch<CategoryField>(`/admin/categories/${categoryId}/fields`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adminUpdateField(
  fieldId: string,
  data: Partial<CategoryField>
): Promise<CategoryField> {
  return apiFetch<CategoryField>(`/admin/category-fields/${fieldId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function adminDeleteField(fieldId: string): Promise<void> {
  return apiFetch<void>(`/admin/category-fields/${fieldId}`, {
    method: "DELETE",
  });
}
