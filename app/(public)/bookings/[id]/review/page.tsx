"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, ArrowLeft, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/providers/AuthProvider";
import { getBooking, bookingKeys } from "@/lib/api/bookings";
import { createReview } from "@/lib/api/reviews";
import { cn } from "@/lib/utils";

const STAR_LABELS = ["", "Poor", "Below average", "Average", "Good", "Excellent"];

export default function WriteReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [body, setBody] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.actorKind !== "customer")) {
      router.replace(`/customer/login?next=/bookings/${id}/review`);
    }
  }, [user, authLoading, router, id]);

  const { data: booking, isLoading } = useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: () => getBooking(id),
    enabled: !!user,
  });

  const mutation = useMutation({
    mutationFn: () =>
      createReview({ booking_id: id, rating, body: body.trim() }),
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to submit review. Please try again.");
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not a completed booking
  if (!booking || booking.status !== "completed") {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-slate-500 mb-4">
            Reviews can only be submitted for completed bookings.
          </p>
          <Link
            href="/customer/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to my bookings
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen pt-16 bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-sm"
        >
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 mb-5">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Review submitted!
          </h1>
          <p className="text-slate-500 text-sm mb-6">
            Thank you for sharing your experience. Your feedback helps other
            adventurers.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/experiences/${booking.experience_slug}`}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors text-center"
            >
              View experience
            </Link>
            <Link
              href="/customer/dashboard"
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors text-center"
            >
              Back to my bookings
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const active = hovered || rating;

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        <Link
          href={`/bookings/${id}`}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to booking
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-emerald-500 px-6 py-5 text-white">
            <p className="text-sm font-medium opacity-80 mb-0.5">
              Write a review for
            </p>
            <h1 className="text-xl font-bold leading-snug">
              {booking.experience_title}
            </h1>
            <p className="text-sm opacity-70 mt-1">
              {new Date(booking.slot_date).toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {/* Star rating */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">
                How would you rate this experience?
              </p>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(n)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                    aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={cn(
                        "h-10 w-10 transition-colors",
                        n <= active
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-100 text-slate-300"
                      )}
                    />
                  </button>
                ))}
              </div>
              {active > 0 && (
                <motion.p
                  key={active}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "text-sm font-semibold mt-2",
                    active <= 2
                      ? "text-red-500"
                      : active === 3
                      ? "text-amber-500"
                      : "text-emerald-600"
                  )}
                >
                  {STAR_LABELS[active]}
                </motion.p>
              )}
            </div>

            {/* Review body */}
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">
                Tell us more{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 500))}
                placeholder="What did you enjoy most? How was the guide? Any tips for future adventurers?"
                rows={4}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
              />
              <p
                className={cn(
                  "text-xs text-right mt-1",
                  body.length > 450 ? "text-amber-500" : "text-slate-400"
                )}
              >
                {body.length}/500
              </p>
            </div>

            {/* Low-rating notice */}
            {rating > 0 && rating <= 2 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
              >
                We&apos;re sorry to hear that. Your feedback will be reviewed by
                our team within 2 hours and we&apos;ll reach out to make it
                right.
              </motion.div>
            )}

            <button
              disabled={rating === 0 || mutation.isPending}
              onClick={() => mutation.mutate()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {mutation.isPending ? "Submitting…" : "Submit Review"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
