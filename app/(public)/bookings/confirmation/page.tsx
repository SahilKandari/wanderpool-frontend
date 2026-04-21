"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  Download,
  MapPin,
  Calendar,
  Clock,
  Users,
  CreditCard,
  Phone,
  Mail,
  Share2,
  ArrowRight,
  Shield,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getBooking, bookingKeys } from "@/lib/api/bookings";
import { downloadReceiptPDF, shareReceiptPDF } from "@/lib/utils/receipt";

function fmt(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

function ReceiptContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("id") ?? "";
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: bookingKeys.detail(bookingId),
    queryFn: () => getBooking(bookingId),
    enabled: !!bookingId,
  });

  async function handleDownload() {
    if (!booking) return;
    setDownloading(true);
    try {
      await downloadReceiptPDF(booking);
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    if (!booking) return;
    setSharing(true);
    try {
      await shareReceiptPDF(booking);
    } catch {
      toast.error("Unable to share. Try downloading instead.");
    } finally {
      setSharing(false);
    }
  }

  if (isLoading || !booking) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-lg">
          <div className="h-8 bg-slate-200 rounded w-1/2" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  const isPaid = booking.payment_status === "paid";
  const isPartial = booking.payment_mode === "partial";
  const paidPaise = booking.amount_paid_paise ?? (isPartial ? booking.platform_fee_paise : booking.total_paise);
  const remainingPaise = isPartial ? booking.total_paise - paidPaise : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pt-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Success header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-4">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Booking Confirmed!
          </h1>
          <p className="text-slate-500">
            Your adventure is booked. You&apos;ll receive a WhatsApp confirmation shortly.
          </p>
        </motion.div>

        {/* Receipt card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
        >
          {/* Receipt area */}
          <div className="p-6 sm:p-8">
            {/* Booking ref header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <span className="text-white text-xs font-bold">W</span>
                  </div>
                  <span className="font-bold text-slate-900">WanderPool</span>
                </div>
                <p className="text-xs text-slate-400">Booking Confirmation</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400 mb-0.5">Booking ID</p>
                <p className="font-mono font-bold text-slate-900 text-sm">
                  {booking.booking_code}
                </p>
                <span className="inline-block mt-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                  {isPaid ? "✓ Paid" : "Pending"}
                </span>
              </div>
            </div>

            {/* Experience */}
            <div className="bg-slate-50 rounded-2xl p-4 mb-5">
              <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide">Experience</p>
              <h2 className="font-bold text-slate-900 text-lg leading-snug">
                {booking.experience_title}
              </h2>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {booking.location_city ?? ""}
                {booking.location_name ? ` · ${booking.location_name}` : ""}
              </p>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Date
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {booking.slot_date
                    ? new Date(booking.slot_date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Time
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {booking.slot_start_time ?? "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Users className="h-3 w-3" /> Participants
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {booking.participants} {booking.participants === 1 ? "person" : "people"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <CreditCard className="h-3 w-3" /> Payment
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {isPartial ? "Partial (booking fee)" : "Full payment"}
                </p>
              </div>
            </div>

            {/* Customer */}
            <div className="border-t border-dashed border-slate-200 pt-4 mb-5">
              <p className="text-xs text-slate-400 mb-2 uppercase tracking-wide">Guest details</p>
              <div className="space-y-1.5 text-sm">
                <p className="font-medium text-slate-900">{booking.customer_name}</p>
                <p className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />{booking.customer_email}
                </p>
                <p className="text-slate-500 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />{booking.customer_phone}
                </p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="border-t border-dashed border-slate-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Subtotal (excl. GST)</span>
                <span>{fmt(booking.subtotal_paise)}</span>
              </div>
              {(booking.gst_paise ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>GST (18%)</span>
                  <span>{fmt(booking.gst_paise)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-400">
                <span>Booking fee (non-refundable)</span>
                <span>{fmt(booking.platform_fee_paise)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 text-base">
                <span>Paid now</span>
                <span className="text-emerald-600">{fmt(paidPaise)}</span>
              </div>
              {isPartial && remainingPaise > 0 && (
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Due at venue (cash)</span>
                  <span>{fmt(remainingPaise)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Dashed cut line */}
          <div className="relative border-t border-dashed border-slate-200 mx-6">
            <div className="absolute -left-6 -top-3 h-6 w-6 rounded-full bg-slate-50 border border-slate-100" />
            <div className="absolute -right-6 -top-3 h-6 w-6 rounded-full bg-slate-50 border border-slate-100" />
          </div>

          {/* What's next */}
          <div className="px-6 sm:px-8 py-5 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              What happens next
            </p>
            <div className="space-y-2.5">
              {[
                { icon: Shield, text: "Guide will WhatsApp you within 30 minutes" },
                { icon: Phone, text: "48-hour reminder with meeting point & what to bring" },
                { icon: CheckCircle2, text: `Show booking ID ${booking.booking_code} at the venue` },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <Icon className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mt-6"
        >
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? "Generating PDF…" : "Download Confirmation"}
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-60"
          >
            {sharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
            {sharing ? "Preparing…" : "Share Confirmation"}
          </button>
          <Link
            href="/customer/dashboard"
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            My Bookings
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <ReceiptContent />
    </Suspense>
  );
}
