export interface Review {
  id: string;
  booking_id: string;
  experience_id: string;
  rating: number;
  body: string | null;
  operator_reply: string | null;
  replied_at: string | null;
  is_visible: boolean;
  is_flagged: boolean;
  created_at: string;
  // enriched
  customer_name: string;
  experience_title?: string;
  experience_slug?: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  total: number;
  distribution: { rating: number; count: number }[];
}

export interface EligibilityResponse {
  can_review: boolean;
  booking_id?: string;
}
