import { apiFetch, publicFetch } from "./client";
import type { Review, ReviewsResponse, EligibilityResponse } from "@/lib/types/review";

export const reviewKeys = {
  all: ["reviews"] as const,
  forExperience: (id: string, page?: number) =>
    [...reviewKeys.all, "experience", id, page] as const,
  forCustomer: () => [...reviewKeys.all, "mine"] as const,
  forAgency: (params?: Record<string, string>) =>
    [...reviewKeys.all, "agency", params] as const,
  eligible: (experienceId: string) =>
    [...reviewKeys.all, "eligible", experienceId] as const,
};

export async function getExperienceReviews(
  experienceId: string,
  page = 1,
  limit = 10
): Promise<ReviewsResponse> {
  return publicFetch(
    `/experiences/${experienceId}/reviews?page=${page}&limit=${limit}`
  );
}

export async function getMyReviews(): Promise<Review[]> {
  return apiFetch("/customer/reviews");
}

export async function checkReviewEligibility(
  experienceId: string
): Promise<EligibilityResponse> {
  return apiFetch(`/customer/reviews/eligible?experience_id=${experienceId}`);
}

export async function createReview(payload: {
  booking_id: string;
  rating: number;
  body: string;
}): Promise<Review> {
  return apiFetch("/customer/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAgencyReviews(params?: {
  experience_id?: string;
  rating?: string;
  page?: number;
}): Promise<Review[]> {
  const q = new URLSearchParams();
  if (params?.experience_id) q.set("experience_id", params.experience_id);
  if (params?.rating) q.set("rating", params.rating);
  if (params?.page) q.set("page", String(params.page));
  const qs = q.toString();
  return apiFetch(`/agency/reviews${qs ? `?${qs}` : ""}`);
}

export async function replyToReview(
  reviewId: string,
  reply: string
): Promise<{ id: string; operator_reply: string; replied_at: string }> {
  return apiFetch(`/agency/reviews/${reviewId}/reply`, {
    method: "PATCH",
    body: JSON.stringify({ reply }),
  });
}

export async function adminToggleReviewVisibility(
  reviewId: string,
  isVisible: boolean
): Promise<{ is_visible: boolean }> {
  return apiFetch(`/admin/reviews/${reviewId}/visibility`, {
    method: "PATCH",
    body: JSON.stringify({ is_visible: isVisible }),
  });
}
