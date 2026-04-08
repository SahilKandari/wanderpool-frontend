"use client";

import { useState } from "react";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Star,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Calendar,
  Share2,
  Heart,
  ArrowRight,
  Info,
  AlertTriangle,
  Phone,
  Loader2,
} from "lucide-react";
import { getExperienceBySlug, experienceKeys } from "@/lib/api/experiences";
import { listExperienceSlots, bookingKeys } from "@/lib/api/bookings";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useFavourite } from "@/lib/hooks/useFavourite";
import { cn } from "@/lib/utils";

const POLICY_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  free_48h: {
    label: "Free cancellation up to 48 hours before",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    icon: <Shield className="h-4 w-4 text-emerald-600" />,
  },
  half_refund_24h: {
    label: "50% refund if cancelled 24 hours before",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  },
  no_refund: {
    label: "Non-refundable",
    color: "text-red-700 bg-red-50 border-red-200",
    icon: <XCircle className="h-4 w-4 text-red-500" />,
  },
};

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=1200&q=80",
  "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&q=80",
];

function buildGallery(exp: { cover_image_url?: string | null; images?: { url: string }[] }): string[] {
  if (exp.images && exp.images.length > 0) {
    return exp.images.map((img) => img.url);
  }
  if (exp.cover_image_url) return [exp.cover_image_url];
  return PLACEHOLDER_IMAGES;
}

function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const h = Math.round(minutes / 60);
    return `${h} hour${h > 1 ? "s" : ""}`;
  }
  const d = Math.round(minutes / 1440);
  return `${d} day${d > 1 ? "s" : ""}`;
}

export default function ExperienceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user } = useAuth();
  const [imgIndex, setImgIndex] = useState(0);
  const [participants, setParticipants] = useState(2);
  const [bookingDate, setBookingDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");


  const { data: exp, isLoading, isError } = useQuery({
    queryKey: experienceKeys.detail(slug),
    queryFn: () => getExperienceBySlug(slug),
  });

  // Hook needs exp.id — safe to call unconditionally (disabled when id is empty)
  const { isFavourited, toggle: toggleFavourite, isLoading: favLoading } =
    useFavourite(exp?.id ?? "");

  // Fetch slots for the selected date only (re-fetches when date changes)
  const { data: daySlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: [...bookingKeys.all, "slots", exp?.id, bookingDate],
    queryFn: () => listExperienceSlots(exp!.id, bookingDate),
    enabled: !!exp?.id && bookingDate !== "",
  });

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !exp) return <NotFound />;

  const images = buildGallery(exp);
  const price = Math.round(exp.base_price_paise / 100);
  const totalPrice = price * participants;
  const policy = POLICY_MAP[exp.cancellation_policy] ?? POLICY_MAP.free_48h;

  function prevImg() {
    setImgIndex((i) => (i - 1 + images.length) % images.length);
  }
  function nextImg() {
    setImgIndex((i) => (i + 1) % images.length);
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Gallery */}
      <div className="relative h-[55vh] min-h-90 bg-slate-900 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={imgIndex}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <Image
              src={images[imgIndex]}
              alt={exp.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-b from-black/20 via-transparent to-black/60" />
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows */}
        <button
          onClick={prevImg}
          className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={nextImg}
          className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setImgIndex(i)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === imgIndex ? "w-6 bg-white" : "w-1.5 bg-white/50"
              )}
            />
          ))}
        </div>

        {/* Top actions */}
        <div className="absolute top-4 left-4">
          <Link
            href="/experiences"
            className="flex items-center gap-1.5 text-white text-sm font-medium bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-black/50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors">
            <Share2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => toggleFavourite(`/experiences/${slug}`)}
            disabled={favLoading}
            aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
            className="h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors disabled:opacity-60"
          >
            <Heart
              className={cn(
                "h-4 w-4 transition-colors",
                isFavourited ? "fill-rose-500 text-rose-500" : "text-white"
              )}
            />
          </button>
        </div>

        {/* Featured badge */}
        {exp.is_featured && (
          <div className="absolute bottom-4 left-4">
            <span className="bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Featured Experience
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left — Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title + meta */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-primary uppercase tracking-wide flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {exp.location_city}, {exp.location_state}
                </span>
                {exp.avg_rating > 0 && (
                  <span className="text-slate-300">·</span>
                )}
                {exp.avg_rating > 0 && (
                  <span className="flex items-center gap-1 text-sm text-slate-600">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <strong>{exp.avg_rating.toFixed(1)}</strong>
                    <span className="text-slate-400">({exp.review_count} reviews)</span>
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-slate-900 leading-tight mb-3">
                {exp.title}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  {durationLabel(exp.duration_minutes)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-slate-400" />
                  {exp.min_participants}–{exp.max_participants} participants
                </span>
                {exp.total_bookings > 0 && (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {exp.total_bookings}+ booked
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3">About this experience</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{exp.description}</p>
            </div>

            {/* Inclusions / Exclusions */}
            {(exp.inclusions?.length > 0 || exp.exclusions?.length > 0) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {exp.inclusions?.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-3">What's included</h3>
                    <ul className="space-y-2">
                      {exp.inclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {exp.exclusions?.length > 0 && (
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 mb-3">Not included</h3>
                    <ul className="space-y-2">
                      {exp.exclusions.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <XCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Meeting point */}
            {exp.meeting_point && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Meeting Point
                </h3>
                <p className="text-sm text-slate-600">{exp.meeting_point}</p>
              </div>
            )}

            {/* Cancellation policy */}
            <div className={cn("flex items-start gap-3 p-4 rounded-xl border", policy.color)}>
              {policy.icon}
              <div>
                <p className="text-sm font-semibold">Cancellation Policy</p>
                <p className="text-sm mt-0.5">{policy.label}</p>
              </div>
            </div>

            {/* Important info */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Good to know</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Booking confirmation via WhatsApp within 30 minutes</li>
                    <li>• Guide will contact you 48 hours before the activity</li>
                    <li>• Weather-dependent activity — cancellations due to safety are fully refunded</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Support */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Need help?</p>
                <p className="text-sm text-slate-500">WhatsApp us 7am–8pm · Response within 15 min</p>
              </div>
            </div>
          </div>

          {/* Right — Booking card (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6"
              >
                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-slate-900">
                      ₹{price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-slate-500 text-sm">/ person</span>
                  </div>
                  {exp.avg_rating > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "h-3.5 w-3.5",
                            i < Math.round(exp.avg_rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-200 fill-slate-200"
                          )}
                        />
                      ))}
                      <span className="text-xs text-slate-500 ml-1">
                        ({exp.review_count} reviews)
                      </span>
                    </div>
                  )}
                </div>

                {/* Step 1: Date picker */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                    1. Select Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => {
                        setBookingDate(e.target.value);
                        setSelectedSlotId(""); // reset slot when date changes
                      }}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>

                {/* Step 2: Time slot picker — only shown after date selected */}
                {bookingDate && (
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                      2. Select Time
                    </label>
                    {slotsLoading ? (
                      <div className="flex items-center justify-center py-4 text-slate-400 text-sm gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading available times…
                      </div>
                    ) : daySlots.length === 0 ? (
                      <div className="text-center py-4 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
                        No slots available for this date.
                        <br />
                        <span className="text-xs">Try a different date.</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {daySlots.map((slot) => {
                          const time = new Date(slot.starts_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          });
                          const isSelected = selectedSlotId === slot.id;
                          return (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => setSelectedSlotId(slot.id)}
                              className={cn(
                                "py-2.5 px-2 rounded-xl border text-sm font-medium transition-all text-center",
                                isSelected
                                  ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                                  : "border-slate-200 text-slate-700 hover:border-primary/50 hover:bg-slate-50"
                              )}
                            >
                              <span className="block font-semibold">{time}</span>
                              <span className="block text-xs text-slate-400 mt-0.5">
                                {slot.spots_left} spot{slot.spots_left !== 1 ? "s" : ""} left
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Participants — only shown after slot selected */}
                {selectedSlotId && (
                  <div className="mb-5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide block mb-1.5">
                      3. Participants
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setParticipants(Math.max(exp.min_participants, participants - 1))}
                        className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors font-semibold text-slate-700"
                      >
                        −
                      </button>
                      <span className="flex-1 text-center font-semibold text-slate-900 text-lg">
                        {participants}
                      </span>
                      <button
                        onClick={() => setParticipants(Math.min(exp.max_participants, participants + 1))}
                        className="h-9 w-9 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors font-semibold text-slate-700"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-1">
                      {exp.min_participants}–{exp.max_participants} people
                    </p>
                  </div>
                )}

                {/* Price breakdown — only shown after slot selected */}
                {selectedSlotId && (
                  <div className="bg-slate-50 rounded-xl p-3 mb-5 space-y-1.5 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <span>₹{price.toLocaleString("en-IN")} × {participants} persons</span>
                      <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                      <span>Total</span>
                      <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                )}

                {/* Book button — disabled until date + slot selected */}
                {selectedSlotId ? (
                  <Link
                    href={
                      user && user.actorKind === "customer"
                        ? `/experiences/${slug}/book?pax=${participants}&slot=${selectedSlotId}`
                        : `/customer/login?next=/experiences/${slug}/book?pax=${participants}%26slot=${selectedSlotId}`
                    }
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25 group"
                  >
                    Book Now
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ) : (
                  <div className="w-full py-3.5 rounded-xl bg-slate-100 text-slate-400 font-semibold text-sm text-center select-none">
                    {!bookingDate ? "Select a date to continue" : "Select a time slot to continue"}
                  </div>
                )}

                <p className="text-xs text-slate-400 text-center mt-3">
                  {user && user.actorKind === "customer"
                    ? "You won't be charged until checkout"
                    : "Sign in to complete your booking"}
                </p>
              </motion.div>

              {/* Trust badges */}
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { icon: Shield, label: "Safe & Verified" },
                  { icon: Star, label: "Top Rated" },
                  { icon: CheckCircle2, label: "Instant Confirm" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="p-2">
                    <Icon className="h-4 w-4 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen pt-16 animate-pulse">
      <div className="h-[55vh] bg-slate-200" />
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-10 bg-slate-200 rounded w-3/4" />
          <div className="space-y-2">
            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 bg-slate-200 rounded" />
            <div className="h-4 bg-slate-200 rounded w-2/3" />
          </div>
        </div>
        <div className="h-96 bg-slate-200 rounded-2xl" />
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen pt-16 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Experience not found</h1>
        <p className="text-slate-500 mb-6">This experience may no longer be available.</p>
        <Link
          href="/experiences"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90"
        >
          Browse all experiences
        </Link>
      </div>
    </div>
  );
}
