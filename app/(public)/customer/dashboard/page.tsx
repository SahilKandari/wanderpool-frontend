"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ArrowRight,
  Star,
  Gift,
  ChevronRight,
  Package,
  Clock,
} from "lucide-react";
import { useAuth } from "@/lib/providers/AuthProvider";
import { listCustomerBookings, bookingKeys } from "@/lib/api/bookings";
import type { Booking, BookingStatus } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  confirmed: {
    label: "Confirmed",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  completed: {
    label: "Completed",
    color: "text-slate-700 bg-slate-100 border-slate-200",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  pending: {
    label: "Awaiting Payment",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "text-red-700 bg-red-50 border-red-200",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  disputed: {
    label: "Disputed",
    color: "text-orange-700 bg-orange-50 border-orange-200",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
};

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&q=80",
  "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=400&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=80",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80",
];

function BookingCard({ booking, index }: { booking: Booking; index: number }) {
  const status = STATUS_CONFIG[booking.status];
  const price = Math.round(booking.total_paise / 100);
  const img = PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length];
  const isUpcoming =
    booking.status === "confirmed" &&
    new Date(booking.slot_date) >= new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="flex">
        {/* Image */}
        <div className="relative w-28 sm:w-36 flex-shrink-0">
          <Image
            src={img}
            alt={booking.experience_title}
            fill
            className="object-cover"
          />
          {isUpcoming && (
            <div className="absolute inset-0 bg-primary/20 flex items-end justify-center pb-2">
              <span className="text-[10px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full">
                UPCOMING
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold text-slate-900 line-clamp-1">
                {booking.experience_title}
              </h3>
              <span
                className={cn(
                  "flex-shrink-0 flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
                  status.color
                )}
              >
                {status.icon}
                {status.label}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(booking.slot_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {booking.slot_start_time}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div>
              <p className="text-xs text-slate-400">
                Booking #{booking.booking_code?.slice(-6)}
              </p>
              <p className="text-sm font-bold text-slate-900">
                ₹{price.toLocaleString("en-IN")}
              </p>
            </div>
            {booking.status === "completed" && (
              <Link
                href={`/bookings/${booking.id}/review`}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Star className="h-3 w-3" />
                Write review
              </Link>
            )}
            {booking.status === "confirmed" && (
              <Link
                href={`/bookings/${booking.id}`}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700"
              >
                View details
                <ChevronRight className="h-3 w-3" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function CustomerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.actorKind !== "customer")) {
      router.replace("/customer/login");
    }
  }, [user, authLoading, router]);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: bookingKeys.mine(),
    queryFn: () => listCustomerBookings({ limit: 50 }),
    enabled: !!user && user.actorKind === "customer",
  });

  const today = new Date().toISOString().split("T")[0];
  const upcoming = bookings.filter(
    (b) => b.status === "confirmed" && b.slot_date >= today
  );
  const past = bookings.filter(
    (b) =>
      b.status === "completed" ||
      (b.status === "confirmed" && b.slot_date < today)
  );
  const cancelled = bookings.filter((b) => b.status === "cancelled");
  const attention = bookings.filter(
    (b) => b.status === "pending" || b.status === "disputed"
  );

  if (authLoading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.actorKind !== "customer") return null;

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm text-slate-500 mb-1">Welcome back</p>
            <h1 className="text-2xl font-bold text-slate-900">
              {user.email.split("@")[0]}&apos;s adventures
            </h1>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            {[
              {
                label: "Total Bookings",
                value: bookings.length,
                color: "text-primary",
              },
              {
                label: "Upcoming",
                value: upcoming.length,
                color: "text-emerald-600",
              },
              {
                label: "Completed",
                value: past.length,
                color: "text-slate-700",
              },
            ].map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100"
              >
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Upcoming ({upcoming.length})
                </h2>
                <div className="space-y-3">
                  {upcoming.map((b, i) => (
                    <BookingCard key={b.id} booking={b} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Past */}
            {past.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-slate-400" />
                  Past adventures ({past.length})
                </h2>
                <div className="space-y-3">
                  {past.map((b, i) => (
                    <BookingCard key={b.id} booking={b} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Needs attention (pending / disputed) */}
            {attention.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-amber-700 mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  Needs attention ({attention.length})
                </h2>
                <div className="space-y-3">
                  {attention.map((b, i) => (
                    <BookingCard key={b.id} booking={b} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Cancelled */}
            {cancelled.length > 0 && (
              <section>
                <h2 className="text-base font-semibold text-slate-500 mb-4 flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-slate-400" />
                  Cancelled ({cancelled.length})
                </h2>
                <div className="space-y-3">
                  {cancelled.map((b, i) => (
                    <BookingCard key={b.id} booking={b} index={i} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Referral banner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white p-6"
        >
          <div className="absolute right-4 top-4 opacity-10">
            <Gift className="h-24 w-24" />
          </div>
          <div className="relative">
            <p className="text-sm font-medium text-white/80 mb-1">Earn ₹200</p>
            <h3 className="text-lg font-bold mb-1">Refer a friend</h3>
            <p className="text-sm text-white/70 mb-4 max-w-xs">
              Share your referral code and both you and your friend get ₹200 off your next booking.
            </p>
            <button className="flex items-center gap-2 bg-white text-primary text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/90 transition-colors">
              <Gift className="h-4 w-4" />
              Get referral code
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Package className="h-10 w-10 text-slate-300" />
      </div>
      <h3 className="text-lg font-semibold text-slate-700 mb-2">
        No bookings yet
      </h3>
      <p className="text-sm text-slate-500 max-w-xs mb-6">
        Start your Himalayan adventure — book your first experience today.
      </p>
      <Link
        href="/experiences"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
      >
        Explore experiences
        <ArrowRight className="h-4 w-4" />
      </Link>
    </motion.div>
  );
}
