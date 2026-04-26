export type ExperienceStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "paused"
  | "rejected";

export type CancellationPolicy =
  | "free_48h"
  | "half_refund_24h"
  | "no_refund";

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface Experience {
  id: string;
  agency_id: string;
  category_id: string;
  title: string;
  slug: string;
  description: string;
  location_name: string;
  location_city: string;
  location_state: string;
  meeting_point: string | null;
  base_price_paise: number;
  metadata: Record<string, unknown>;
  inclusions: string[];
  exclusions: string[];
  itinerary?: ItineraryDay[];
  min_participants: number;
  max_participants: number;
  duration_minutes: number;
  cancellation_policy: CancellationPolicy;
  status: ExperienceStatus;
  is_featured: boolean;
  avg_rating: number;
  review_count: number;
  total_bookings: number;
  created_at: string;
  updated_at: string;
  // Joined fields
  cover_image_url?: string | null;
  images?: ExperienceImage[];
  agency_name?: string;
}

export interface ExperienceImage {
  id: string;
  experience_id: string;
  public_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
}

export type FieldType =
  | "string"
  | "number"
  | "boolean"
  | "enum"
  | "string_array"
  | "object"
  | "object_array";

export interface CategoryField {
  id: string;
  category_id: string;
  field_key: string;
  label: string;
  field_type: FieldType;
  is_required: boolean;
  enum_values: string[] | null;
  validation: { min?: number; max?: number } | null;
  group_name: string | null;
  is_public: boolean;
  sort_order: number;
}

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_leaf: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}
