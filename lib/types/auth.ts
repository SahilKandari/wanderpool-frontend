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
  created_at: string;
}

export interface LoginResponse {
  token: string;
  agency?: Agency;
}
