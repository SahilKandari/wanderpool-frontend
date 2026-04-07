import { apiFetch } from "./client";
import type { Booking } from "@/lib/types/booking";

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (params?: Record<string, string>) =>
    [...bookingKeys.all, "list", params] as const,
  detail: (id: string) => [...bookingKeys.all, id] as const,
  mine: (params?: Record<string, string>) =>
    [...bookingKeys.all, "mine", params] as const,
};

export interface BookingFilters {
  status?: string;
  from?: string;
  to?: string;
  experience_id?: string;
  limit?: number;
  offset?: number;
}

function buildQuery(filters?: BookingFilters): string {
  if (!filters) return "";
  const qs = new URLSearchParams();
  if (filters.status) qs.set("status", filters.status);
  if (filters.from) qs.set("from", filters.from);
  if (filters.to) qs.set("to", filters.to);
  if (filters.experience_id) qs.set("experience_id", filters.experience_id);
  if (filters.limit) qs.set("limit", String(filters.limit));
  if (filters.offset) qs.set("offset", String(filters.offset));
  const s = qs.toString();
  return s ? `?${s}` : "";
}

// Agency: own bookings
export async function listMyBookings(filters?: BookingFilters): Promise<Booking[]> {
  return apiFetch<Booking[]>(`/agency/bookings${buildQuery(filters)}`);
}

// Operator: assigned bookings
export async function listOperatorBookings(filters?: BookingFilters): Promise<Booking[]> {
  return apiFetch<Booking[]>(`/operator/bookings${buildQuery(filters)}`);
}

// Customer: own bookings
export async function listCustomerBookings(filters?: BookingFilters): Promise<Booking[]> {
  return apiFetch<Booking[]>(`/customer/bookings${buildQuery(filters)}`);
}

export interface InitiateBookingResponse {
  razorpay_order_id: string;
  razorpay_key_id: string;
  charge_paise: number;
  total_paise: number;
  payment_mode: "full" | "partial";
  slot_id: string;
  participants: number;
}

export async function initiateBooking(data: {
  slot_id: string;
  participants: number;
  payment_mode: "full" | "partial";
}): Promise<InitiateBookingResponse> {
  return apiFetch<InitiateBookingResponse>("/customer/bookings/initiate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface VerifyPaymentResponse {
  booking_id?: string;
  booking_ref?: string;
  status?: string;
  experience_title?: string;
  slot_date?: string;
  slot_start_time?: string;
  customer_name?: string;
  customer_email?: string;
  location_name?: string;
  location_city?: string;
  pax_count?: number;
  total_paise?: number;
  amount_paid_paise?: number;
  payment_mode?: string;
  razorpay_payment_id?: string;
  [key: string]: unknown;
}

export async function verifyPayment(data: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  slot_id: string;
  participants: number;
  payment_mode: "full" | "partial";
}): Promise<VerifyPaymentResponse> {
  return apiFetch<VerifyPaymentResponse>("/customer/bookings/verify-payment", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// Public: list slots for an experience
export interface SlotItem {
  id: string;
  starts_at: string;
  spots_left: number;
  base_price_paise: number;
}

export async function listExperienceSlots(
  experienceId: string,
  date?: string // YYYY-MM-DD; if provided only returns slots for that day
): Promise<SlotItem[]> {
  const { publicFetch } = await import("./client");
  const qs = date ? `?date=${date}` : "";
  return publicFetch<SlotItem[]>(`/experiences/${experienceId}/slots${qs}`);
}

export async function getBooking(id: string): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}`);
}

export async function markBookingStarted(id: string): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}/start`, { method: "POST" });
}

// Operator collect cash (via /bookings/{id}/collect-cash — operator auth)
export async function collectCash(id: string): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}/collect-cash`, { method: "POST" });
}

// Agency collect cash (via /agency/bookings/{id}/collect-cash — agency auth)
export async function agencyCollectCash(id: string): Promise<Booking> {
  return apiFetch<Booking>(`/agency/bookings/${id}/collect-cash`, { method: "POST" });
}

export async function markBookingCompleted(id: string): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}/complete`, { method: "POST" });
}

export async function cancelBooking(id: string, reason?: string): Promise<Booking> {
  return apiFetch<Booking>(`/bookings/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function assignGuide(bookingId: string, operatorId: string | null): Promise<Booking> {
  return apiFetch<Booking>(`/agency/bookings/${bookingId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ operator_id: operatorId ?? "" }),
  });
}

// Admin
export async function adminListBookings(filters?: BookingFilters): Promise<Booking[]> {
  return apiFetch<Booking[]>(`/admin/bookings${buildQuery(filters)}`);
}

export async function adminResolveDispute(id: string, resolution: string): Promise<Booking> {
  return apiFetch<Booking>(`/admin/bookings/${id}/resolve`, {
    method: "POST",
    body: JSON.stringify({ resolution }),
  });
}
