"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Download,
  Share2,
  Shield,
  AlertTriangle,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/providers/AuthProvider";
import { getBooking, cancelBooking, bookingKeys } from "@/lib/api/bookings";
import { downloadReceiptPDF, shareReceiptPDF } from "@/lib/utils/receipt";
import type { Booking, BookingStatus } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  confirmed: {
    label: "Confirmed",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
  },
  completed: {
    label: "Completed",
    color: "text-slate-700",
    bg: "bg-slate-100 border-slate-200",
    icon: <CheckCircle2 className="h-5 w-5 text-slate-500" />,
  },
  pending: {
    label: "Awaiting Payment",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    icon: <AlertCircle className="h-5 w-5 text-amber-500" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    icon: <XCircle className="h-5 w-5 text-red-500" />,
  },
  disputed: {
    label: "Disputed",
    color: "text-orange-700",
    bg: "bg-orange-50 border-orange-200",
    icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
  },
};

const POLICY_LABELS: Record<string, string> = {
  free_48h: "Free cancellation up to 48 hours before",
  half_refund_24h: "50% refund if cancelled 24 hours before",
  no_refund: "Non-refundable",
};

function fmt(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.actorKind !== "customer")) {
      router.replace(`/customer/login?next=/bookings/${id}`);
    }
  }, [user, authLoading, router, id]);

  const { data: booking, isLoading, isError } = useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => getBooking(id),
    enabled: !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelBooking(id),
    onSuccess: () => {
      setCancelOpen(false);
      toast.success("Booking cancelled successfully");
      qc.invalidateQueries({ queryKey: bookingKeys.mine() });
      qc.invalidateQueries({ queryKey: bookingKeys.detail(id) });
    },
    onError: (err: Error) => {
      setCancelOpen(false);
      toast.error(err.message);
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center text-center px-4">
        <div>
          <XCircle className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Booking not found</h1>
          <p className="text-slate-500 text-sm mb-6">This booking may not exist or you don't have access.</p>
          <Link
            href="/customer/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Bookings
          </Link>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const isPartial = booking.payment_mode === "partial";
  const remainingPaise = booking.total_paise - (booking.amount_paid_paise ?? 0);
  const canCancel = booking.status === "confirmed" || booking.status === "pending";

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href="/customer/dashboard"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Bookings
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Status banner */}
          <div className={cn("flex items-center gap-3 p-4 rounded-2xl border", status.bg)}>
            {status.icon}
            <div className="flex-1">
              <p className={cn("font-semibold", status.color)}>{status.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Booking #{booking.booking_code}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  setDownloading(true);
                  try { await downloadReceiptPDF(booking); }
                  catch { toast.error("Failed to generate PDF. Please try again."); }
                  finally { setDownloading(false); }
                }}
                disabled={downloading}
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-60"
                title="Download booking"
              >
                {downloading ? <Loader2 className="h-4 w-4 text-slate-500 animate-spin" /> : <Download className="h-4 w-4 text-slate-500" />}
              </button>
              <button
                onClick={async () => {
                  setSharing(true);
                  try { await shareReceiptPDF(booking); }
                  catch { toast.error("Unable to share. Try downloading instead."); }
                  finally { setSharing(false); }
                }}
                disabled={sharing}
                className="h-8 w-8 rounded-lg border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-colors disabled:opacity-60"
                title="Share booking"
              >
                {sharing ? <Loader2 className="h-4 w-4 text-slate-500 animate-spin" /> : <Share2 className="h-4 w-4 text-slate-500" />}
              </button>
            </div>
          </div>

          {/* Experience + schedule */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4">
            <h2 className="font-bold text-slate-900 text-lg leading-tight">
              {booking.experience_title}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Date</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {new Date(booking.slot_date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Time</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {booking.slot_start_time}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Participants</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {booking.participants} {booking.participants === 1 ? "person" : "people"}
                  </p>
                </div>
              </div>
              {booking.experience_slug && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Experience</p>
                    <Link
                      href={`/experiences/${booking.experience_slug}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      View listing
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Guest info */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Guest Details</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-primary">
                    {booking.customer_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium text-slate-800">{booking.customer_name}</span>
              </div>
              {booking.customer_email && (
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  {booking.customer_email}
                </div>
              )}
              {booking.customer_phone && (
                <div className="flex items-center gap-2.5 text-sm text-slate-600">
                  <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                  {booking.customer_phone}
                </div>
              )}
            </div>
          </div>

          {/* Payment breakdown */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Payment</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Total amount</span>
                <span className="font-medium">{fmt(booking.total_paise)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount paid</span>
                <span className="font-medium text-emerald-600">
                  {fmt(booking.amount_paid_paise ?? 0)}
                </span>
              </div>
              {isPartial && remainingPaise > 0 && (
                <div className="flex justify-between text-amber-700 font-medium pt-2 border-t border-amber-100 bg-amber-50 rounded-lg px-2 py-1.5 -mx-1">
                  <span>Remaining (pay on arrival)</span>
                  <span>{fmt(remainingPaise)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500 text-xs pt-2 border-t border-slate-100">
                <span>Payment mode</span>
                <span className="capitalize">
                  {isPartial ? "Partial (booking fee only)" : "Full payment"}
                </span>
              </div>
              {booking.status === "cancelled" && (
                <div className="flex justify-between text-sm pt-2 border-t border-slate-100">
                  <span className="text-slate-600">Refund</span>
                  <span className={booking.refund_amount_paise && booking.refund_amount_paise > 0
                    ? "font-medium text-emerald-600"
                    : "text-slate-500"
                  }>
                    {booking.refund_amount_paise && booking.refund_amount_paise > 0
                      ? `${fmt(booking.refund_amount_paise)} initiated`
                      : "No refund"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Cancellation policy info */}
          {canCancel && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
              <Shield className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm text-blue-800">
                Weather-dependent activities are fully refunded if cancelled by the operator for safety reasons.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {booking.status === "completed" && (
              <Link
                href={`/bookings/${booking.id}/review`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                <Star className="h-4 w-4" />
                Write a Review
              </Link>
            )}
            {canCancel && (
              <button
                onClick={() => setCancelOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Cancel Booking
              </button>
            )}
            <button
              onClick={async () => {
                setDownloading(true);
                try { await downloadReceiptPDF(booking); }
                catch { toast.error("Failed to generate PDF. Please try again."); }
                finally { setDownloading(false); }
              }}
              disabled={downloading}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-60"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {downloading ? "Generating…" : "Download Booking"}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Cancel confirmation modal */}
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Cancel this booking?
            </DialogTitle>
            <DialogDescription className="pt-1 space-y-2">
              <span className="block">
                You&apos;re about to cancel your booking for{" "}
                <strong>{booking.experience_title}</strong> on{" "}
                {new Date(booking.slot_date).toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}.
              </span>
              {(() => {
                const policy = booking.cancellation_policy;
                const slotAt = booking.slot_starts_at ? new Date(booking.slot_starts_at) : null;
                const hoursUntil = slotAt ? (slotAt.getTime() - Date.now()) / 3600000 : null;
                const platformFee = booking.platform_fee_paise ?? 0;
                const refundable = (booking.amount_paid_paise ?? 0) - platformFee;

                let refundPaise = 0;
                if (policy === "free_48h" && hoursUntil !== null && hoursUntil >= 48) {
                  refundPaise = refundable > 0 ? refundable : 0;
                } else if (policy === "half_refund_24h" && hoursUntil !== null && hoursUntil >= 24) {
                  refundPaise = refundable > 0 ? Math.floor(refundable / 2) : 0;
                }

                if (booking.payment_mode === "partial") {
                  return (
                    <span className="block text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
                      Your ₹{Math.round(platformFee / 100).toLocaleString("en-IN")} booking fee is non-refundable.
                      No refund will be issued.
                    </span>
                  );
                }
                if (refundPaise > 0) {
                  return (
                    <span className="block text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm">
                      You will receive a refund of{" "}
                      <strong>₹{Math.round(refundPaise / 100).toLocaleString("en-IN")}</strong>{" "}
                      within 5–7 business days to your original payment method.
                    </span>
                  );
                }
                return (
                  <span className="block text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
                    {policy === "no_refund"
                      ? "This booking is non-refundable. No refund will be issued."
                      : "Cancellation at this stage does not qualify for a refund. ₹0 will be returned."}
                  </span>
                );
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setCancelOpen(false)}
              disabled={cancelMutation.isPending}
              className="flex-1"
            >
              Keep booking
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
              className="flex-1"
            >
              {cancelMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {cancelMutation.isPending ? "Cancelling…" : "Yes, cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
