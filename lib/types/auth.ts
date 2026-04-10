export type ActorKind = "agency" | "operator" | "customer" | "admin";
export type AccountType =
  | "agency"
  | "solo_operator"
  | "super_admin"
  | "support_agent";

export interface AuthUser {
  actorId: string;
  actorKind: ActorKind;
  accountType: AccountType;
  email: string;
}

export interface Agency {
  id: string;
  account_type: string;
  business_name: string;
  email: string;
  phone: string;
  status: string;
  health_score: number;
  health_flag: string | null;
  commission_rate_bps: number;
  is_featured: boolean;
  description: string;
  city: string;
  state: string;
  // KYC text
  aadhaar_number: string | null;
  pan_number: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  // Document URLs
  aadhaar_doc_url: string | null;
  pan_doc_url: string | null;
  bank_doc_url: string | null;
  cert_doc_url: string | null;
  // Onboarding gates
  bank_verified: boolean;
  certs_verified: boolean;
  video_call_done: boolean;
  agreement_signed: boolean;
  onboarding_submitted_at: string | null;
  // Stats (detail endpoint only)
  experience_count?: number;
  total_bookings?: number;
  operator_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface LoginResponse {
  token: string;
  agency?: Agency;
}
