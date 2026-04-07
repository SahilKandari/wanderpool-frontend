import { Badge } from "@/components/ui/badge";
import type { ExperienceStatus } from "@/lib/types/experience";

const experienceConfig: Record<
  ExperienceStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  pending_review: { label: "Pending Review", variant: "outline" },
  active: { label: "Active", variant: "default" },
  paused: { label: "Paused", variant: "secondary" },
  rejected: { label: "Rejected", variant: "destructive" },
};

export function ExperienceStatusBadge({ status }: { status: ExperienceStatus }) {
  const config = experienceConfig[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "disputed";

const bookingConfig: Record<
  BookingStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  pending: { label: "Awaiting Payment", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "secondary" },
  completed: { label: "Completed", variant: "default" },
  disputed: { label: "Disputed", variant: "destructive" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = bookingConfig[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
