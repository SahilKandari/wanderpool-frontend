"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  Users,
  ChevronLeft,
  ChevronDown,
  Shield,
  AlertTriangle,
  Loader2,
  CreditCard,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/providers/AuthProvider";
import { getExperienceBySlug, experienceKeys } from "@/lib/api/experiences";
import {
  listExperienceSlots,
  initiateBooking,
  verifyPayment,
} from "@/lib/api/bookings";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any;
  }
}

function fmt(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const [participants, setParticipants] = useState(
    Number(searchParams.get("pax") ?? 2)
  );
  const [selectedSlot, setSelectedSlot] = useState<string>(
    searchParams.get("slot") ?? ""
  );
  const [dateFilter, setDateFilter] = useState("");
  const [paymentMode, setPaymentMode] = useState<"full" | "partial">("full");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [partialEnabled, setPartialEnabled] = useState(true);
  const [commissionPct, setCommissionPct] = useState(13);
  const selectedSlotRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && (!user || user.actorKind !== "customer")) {
      router.replace(`/customer/login?next=/experiences/${slug}/book`);
    }
  }, [user, authLoading, router, slug]);

  // Fetch public platform settings for commission rate + partial payment flag
  useEffect(() => {
    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
    fetch(`${BACKEND}/api/v1/settings`)
      .then((r) => r.json())
      .then((d) => {
        const bps = Number(d.commission_rate_bps ?? 1300);
        setCommissionPct(Math.round(bps / 100));
        // Default to enabled if key is missing
        if (d.partial_payment_enabled !== undefined) {
          setPartialEnabled(d.partial_payment_enabled === "true");
        }
      })
      .catch(() => {});
  }, []);

  const { data: exp, isLoading: expLoading } = useQuery({
    queryKey: experienceKeys.detail(slug),
    queryFn: () => getExperienceBySlug(slug),
    enabled: !!user,
  });

  const { data: slots = [], isLoading: slotsLoading } = useQuery({
    queryKey: ["slots", exp?.id],
    queryFn: () => listExperienceSlots(exp!.id),
    enabled: !!exp?.id,
  });

  // Filter slots by selected date (if any), otherwise show all
  const filteredSlots = dateFilter
    ? slots.filter((s) => {
        const slotDate = new Date(s.starts_at)
          .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
        return slotDate === dateFilter;
      })
    : slots;

  // Auto-scroll to the pre-selected slot once slots load
  useEffect(() => {
    if (!selectedSlot || !slots.length) return;
    // If a slot is pre-selected from URL and it's not in the current filtered view, clear date filter
    const match = slots.find((s) => s.id === selectedSlot);
    if (match) {
      const slotDate = new Date(match.starts_at)
        .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      setDateFilter(slotDate);
    }
  }, [slots, selectedSlot]);

  // Scroll selected slot into view when it becomes visible
  useEffect(() => {
    if (selectedSlotRef.current) {
      setTimeout(() => {
        selectedSlotRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    }
  }, [selectedSlot, filteredSlots]);

  const slot = slots.find((s) => s.id === selectedSlot);
  const pricePerPax = slot?.base_price_paise ?? exp?.base_price_paise ?? 0;
  const subtotal = pricePerPax * participants;
  const platformFee = Math.round((subtotal * commissionPct) / 100);
  const chargePaise = paymentMode === "partial" ? platformFee : subtotal;
  const remainingPaise = paymentMode === "partial" ? subtotal - platformFee : 0;

  async function handlePay() {
    if (!selectedSlot) {
      toast.error("Please select a date & time slot");
      return;
    }
    if (!exp) return;

    setLoading(true);
    try {
      const initRes = await initiateBooking({
        slot_id: selectedSlot,
        participants,
        payment_mode: paymentMode,
      });

      const options = {
        key: initRes.razorpay_key_id,
        amount: initRes.charge_paise,
        currency: "INR",
        name: "WanderPool",
        description: exp.title,
        order_id: initRes.razorpay_order_id,
        prefill: { email: user?.email ?? "" },
        theme: { color: "#16a34a" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const confirmed = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              slot_id: initRes.slot_id,
              participants: initRes.participants,
              payment_mode: initRes.payment_mode,
            });
            router.push(
              `/bookings/confirmation?id=${confirmed.booking_id}&ref=${confirmed.booking_ref ?? ""}`
            );
          } catch {
            toast.error("Payment verification failed. Contact support.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      if (!window.Razorpay) {
        toast.error("Payment SDK not loaded. Please refresh.");
        setLoading(false);
        return;
      }
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to initiate payment";
      toast.error(msg);
      setLoading(false);
    }
  }

  if (authLoading || expLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!exp) return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <Link
          href={`/experiences/${slug}`}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to experience
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-1">
          Complete your booking
        </h1>
        <p className="text-slate-500 text-sm mb-8">{exp.title}</p>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left — form */}
          <div className="md:col-span-3 space-y-5">
            {/* Slot picker */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Select date & time
              </h2>

              {/* Date filter */}
              <div className="mb-4">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">
                  Filter by date
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setSelectedSlot(""); // reset selection on date change
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => { setDateFilter(""); setSelectedSlot(""); }}
                      className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 px-3 py-2 rounded-xl"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {slotsLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading slots…
                </div>
              ) : filteredSlots.length === 0 ? (
                <p className="text-sm text-slate-500">
                  {dateFilter
                    ? "No available slots on this date. Try a different date."
                    : "No available slots right now. Check back soon."}
                </p>
              ) : (
                <div ref={listRef} className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {filteredSlots.map((s) => (
                    <button
                      key={s.id}
                      ref={selectedSlot === s.id ? selectedSlotRef : null}
                      onClick={() => setSelectedSlot(s.id)}
                      disabled={s.spots_left < participants}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-all",
                        selectedSlot === s.id
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : s.spots_left < participants
                          ? "border-slate-100 bg-slate-50 text-slate-400 cursor-not-allowed"
                          : "border-slate-200 hover:border-primary/50 text-slate-700"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                            selectedSlot === s.id
                              ? "border-primary"
                              : "border-slate-300"
                          )}
                        >
                          {selectedSlot === s.id && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <span>
                          {fmtDate(s.starts_at)} · {fmtTime(s.starts_at)}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          s.spots_left <= 3
                            ? "text-amber-600"
                            : "text-slate-400"
                        )}
                      >
                        {s.spots_left} left
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Participants */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Participants
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    setParticipants(
                      Math.max(exp.min_participants, participants - 1)
                    )
                  }
                  className="h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center text-lg font-bold hover:bg-slate-50 transition-colors"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-slate-900 w-8 text-center">
                  {participants}
                </span>
                <button
                  onClick={() =>
                    setParticipants(
                      Math.min(
                        Math.min(exp.max_participants, slot?.spots_left ?? exp.max_participants),
                        participants + 1
                      )
                    )
                  }
                  className="h-10 w-10 rounded-xl border border-slate-200 flex items-center justify-center text-lg font-bold hover:bg-slate-50 transition-colors"
                >
                  +
                </button>
                <span className="text-sm text-slate-400">
                  {exp.min_participants}–{exp.max_participants} people
                </span>
              </div>
            </div>

            {/* Payment mode */}
            {partialEnabled && (
              <div className="bg-white rounded-2xl border border-slate-100 p-5">
                <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment option
                </h2>
                <p className="text-xs text-slate-400 mb-4">
                  Pay the full amount now, or just the booking fee to confirm your spot.
                </p>
                <div className="space-y-3">
                  {(["full", "partial"] as const).map((mode) => {
                    const isPartial = mode === "partial";
                    const amount = isPartial ? platformFee : subtotal;
                    return (
                      <button
                        key={mode}
                        onClick={() => setPaymentMode(mode)}
                        className={cn(
                          "w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                          paymentMode === mode
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <div
                          className={cn(
                            "mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                            paymentMode === mode
                              ? "border-primary"
                              : "border-slate-300"
                          )}
                        >
                          {paymentMode === mode && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {isPartial ? "Pay booking fee now" : "Pay full amount"}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {isPartial
                              ? `Pay ${fmt(amount)} now · remaining ${fmt(remainingPaise)} at venue`
                              : `Pay ${fmt(amount)} now · nothing due later`}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {paymentMode === "partial" && (
                  <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">
                      The remaining {fmt(remainingPaise)} must be paid in cash to the guide before the activity begins.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right — summary */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-100 p-5 sticky top-24"
            >
              <h3 className="font-semibold text-slate-900 mb-4">
                Price summary
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>
                    {fmt(pricePerPax)} × {participants}
                  </span>
                  <span>{fmt(subtotal)}</span>
                </div>
                {paymentMode === "partial" && (
                  <>
                    <div className="flex justify-between text-slate-600">
                      <span className="flex items-center gap-1">
                        Booking fee
                        <Info className="h-3 w-3 text-slate-400" />
                      </span>
                      <span>{fmt(platformFee)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-xs">
                      <span>Due at venue</span>
                      <span>{fmt(remainingPaise)}</span>
                    </div>
                  </>
                )}
                <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900">
                  <span>Pay now</span>
                  <span>{fmt(chargePaise)}</span>
                </div>
              </div>

              {/* Cancellation */}
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2">
                <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700">
                  {exp.cancellation_policy === "free_48h"
                    ? "Free cancellation up to 48 hours before"
                    : exp.cancellation_policy === "half_refund_24h"
                    ? "50% refund if cancelled 24 hours before"
                    : "Non-refundable"}
                </p>
              </div>

              <label className="mt-4 flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary cursor-pointer"
                />
                <span className="text-xs text-slate-500 leading-relaxed group-hover:text-slate-700 transition-colors">
                  I agree to the{" "}
                  <Link href="/terms" target="_blank" className="text-primary hover:underline">
                    Terms &amp; Conditions
                  </Link>{" "}
                  and{" "}
                  <Link href="/refund-policy" target="_blank" className="text-primary hover:underline">
                    Refund Policy
                  </Link>
                </span>
              </label>

              <button
                onClick={handlePay}
                disabled={loading || !selectedSlot || !agreedToTerms}
                className="mt-4 w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 rotate-270" />
                    Pay {fmt(chargePaise)}
                  </>
                )}
              </button>

              <p className="text-xs text-slate-400 text-center mt-3">
                Secured by Razorpay · 256-bit SSL
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
