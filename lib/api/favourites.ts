import { apiFetch } from "./client";

export const favouriteKeys = {
  all: ["favourites"] as const,
  list: () => [...favouriteKeys.all, "list"] as const,
};

/** Returns array of experience IDs the current customer has favourited. */
export function listFavourites(): Promise<string[]> {
  return apiFetch<string[]>("/customer/favourites");
}

/** Adds experience to favourites. Returns 204 (void). */
export function addFavourite(experienceId: string): Promise<void> {
  return apiFetch<void>(`/customer/favourites/${experienceId}`, {
    method: "POST",
  });
}

/** Removes experience from favourites. Returns 204 (void). */
export function removeFavourite(experienceId: string): Promise<void> {
  return apiFetch<void>(`/customer/favourites/${experienceId}`, {
    method: "DELETE",
  });
}
