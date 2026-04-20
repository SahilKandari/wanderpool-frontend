export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "disputed";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "refunded"
  | "partially_refunded";

export interface Booking {
  id: string;
  experience_id: string;
  experience_title: string;
  experience_slug: string;
  agency_id: string;
  operator_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  slot_date: string;
  slot_start_time: string;
  participants: number;
  subtotal_paise: number;
  total_paise: number;
  platform_fee_paise: number;
  operator_payout_paise: number;
  payment_mode: "full" | "partial";
  amount_paid_paise: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  booking_code: string;
  notes: string | null;
  activity_started_at: string | null;
  activity_completed_at: string | null;
  created_at: string;
  updated_at: string;
  // enriched fields
  cover_image_url?: string | null;
  location_name?: string;
  location_city?: string;
  cancellation_policy?: "free_48h" | "half_refund_24h" | "no_refund";
  slot_starts_at?: string; // ISO UTC datetime — used for refund calculations
  razorpay_refund_id?: string | null;
  refund_amount_paise?: number | null;
}

export interface Operator {
  id: string;
  agency_id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "suspended";
  assigned_bookings: number;
  created_at: string;
}

export interface BookingPayout {
  id: string;
  booking_ref: string;
  agency_id: string;
  agency_name: string;
  experience_title: string;
  slot_date: string;
  total_paise: number;
  amount_paid_paise: number;
  platform_fee_paise: number;
  operator_payout_paise: number;
  payment_mode: "full" | "partial";
  booking_status: BookingStatus;
  payout_initiated_at: string | null;
  payout_reference: string | null;
  activity_completed_at: string | null;
  created_at: string;
  payout_status: "pending" | "paid" | "not_due";
}
