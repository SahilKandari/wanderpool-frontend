import { apiFetch } from "./client";

export const favouriteKeys = {
  all: ["favourites"] as const,
  list: () => [...favouriteKeys.all, "list"] as const,
  experiences: () => [...favouriteKeys.all, "experiences"] as const,
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

export interface FavouriteExperience {
  id: string;
  title: string;
  slug: string;
  location_city: string;
  location_state: string;
  base_price_paise: number;
  duration_minutes: number;
  avg_rating: number;
  review_count: number;
  is_featured: boolean;
  cover_image_url: string | null;
}

/** Returns full experience objects for the customer's saved favourites. */
export function listFavouriteExperiences(): Promise<FavouriteExperience[]> {
  return apiFetch<FavouriteExperience[]>("/customer/favourites/experiences");
}
