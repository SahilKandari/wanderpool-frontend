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
  // enriched fields (may be present in confirmation response)
  location_name?: string;
  location_city?: string;
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

export interface Payout {
  id: string;
  agency_id: string;
  amount_paise: number;
  status: "pending" | "processing" | "paid" | "failed";
  booking_count: number;
  period_start: string;
  period_end: string;
  reference_id: string | null;
  created_at: string;
  paid_at: string | null;
}
