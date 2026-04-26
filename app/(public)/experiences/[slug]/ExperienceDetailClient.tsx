"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
  ChevronDown,
  Shield,
  Calendar,
  Share2,
  Heart,
  ArrowRight,
  Info,
  AlertTriangle,
  Phone,
  Loader2,
  MessageSquare,
  ThumbsUp,
  Copy,
  ExternalLink,
  ListChecks,
  Route,
  X,
  Expand,
} from "lucide-react";
import { getExperienceBySlug, experienceKeys } from "@/lib/api/experiences";
import { listExperienceSlots, bookingKeys } from "@/lib/api/bookings";
import {
  getExperienceReviews,
  checkReviewEligibility,
  reviewKeys,
} from "@/lib/api/reviews";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useFavourite } from "@/lib/hooks/useFavourite";
import { cn } from "@/lib/utils";

const POLICY_MAP: Record<string, { label: string; description: string; color: string; icon: React.ReactNode }> = {
  free_48h: {
    label: "Free cancellation",
    description: "Cancel at least 48 hours before the activity and get a full refund (minus the non-refundable booking fee). No refund if cancelled within 48 hours.",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    icon: <Shield className="h-4 w-4 text-emerald-600" />,
  },
  half_refund_24h: {
    label: "50% refund up to 24 hours before",
    description: "Cancel at least 24 hours before the activity and receive a 50% refund (minus the non-refundable booking fee). No refund if cancelled within 24 hours.",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
  },
  no_refund: {
    label: "Non-refundable",
    description: "This experience does not offer refunds for cancellations. The full amount paid is non-refundable once payment is confirmed.",
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

// Sections shown in the sticky nav
type NavSection = "overview" | "inclusions" | "itinerary" | "reviews";

export default function ExperienceDetailClient({
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
  const [reviewPage, setReviewPage] = useState(1);
  const [shareCopied, setShareCopied] = useState(false);
  const [meetingCopied, setMeetingCopied] = useState(false);
  const [showMobileBook, setShowMobileBook] = useState(true);

  // Description expand/collapse
  const [descExpanded, setDescExpanded] = useState(false);
  const [descClamped, setDescClamped] = useState(false);
  const descRef = useRef<HTMLParagraphElement>(null);

  // Gallery lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Itinerary accordion — which day is open (null = all closed)
  const [openDay, setOpenDay] = useState<number | null>(null);

  // Sticky nav active section
  const [activeSection, setActiveSection] = useState<NavSection>("overview");

  const bookingCardRef = useRef<HTMLDivElement>(null);
  // Observe the actual Book Now CTA so the mobile bar hides when it's visible
  const bookNowActionRef = useRef<HTMLDivElement>(null);

  // Hide the mobile fixed "Book Now" bar when the book-now action area is in view
  useEffect(() => {
    const el = bookNowActionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowMobileBook(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { data: exp, isLoading, isError } = useQuery({
    queryKey: experienceKeys.detail(slug),
    queryFn: () => getExperienceBySlug(slug),
  });

  // Reset to min_participants once experience loads
  useEffect(() => {
    if (exp?.min_participants) setParticipants(exp.min_participants);
  }, [exp?.min_participants]);

  // Determine if description is clamped — runs after exp loads and text is painted
  useEffect(() => {
    if (!exp?.description) return;
    const raf = requestAnimationFrame(() => {
      const el = descRef.current;
      if (!el) return;
      setDescClamped(el.scrollHeight > el.clientHeight + 4);
    });
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exp?.description]);

  // Hook needs exp.id — safe to call unconditionally (disabled when id is empty)
  const { isFavourited, toggle: toggleFavourite, isLoading: favLoading } =
    useFavourite(exp?.id ?? "");

  // Fetch reviews
  const { data: reviewsData } = useQuery({
    queryKey: reviewKeys.forExperience(exp?.id ?? "", reviewPage),
    queryFn: () => getExperienceReviews(exp!.id, reviewPage),
    enabled: !!exp?.id,
  });

  // Check if the logged-in customer can write a review for this experience
  const { data: eligibility } = useQuery({
    queryKey: reviewKeys.eligible(exp?.id ?? ""),
    queryFn: () => checkReviewEligibility(exp!.id),
    enabled: !!exp?.id && !!user && user.actorKind === "customer",
  });

  // Fetch slots for the selected date only (re-fetches when date changes)
  const { data: daySlots = [], isLoading: slotsLoading } = useQuery({
    queryKey: [...bookingKeys.all, "slots", exp?.id, bookingDate],
    queryFn: () => listExperienceSlots(exp!.id, bookingDate),
    enabled: !!exp?.id && bookingDate !== "",
  });

  // Scroll-spy: track which section is in view
  useEffect(() => {
    const ids: NavSection[] = ["overview", "inclusions", "itinerary", "reviews"];
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, [exp]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const title = exp?.title ?? "Check out this experience on WanderPool";
    if (navigator.share) {
      try { await navigator.share({ title, url }); } catch { /* dismissed */ }
    } else {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  }, [exp?.title]);

  if (isLoading) return <LoadingSkeleton />;
  if (isError || !exp) return <NotFound />;

  const images = buildGallery(exp);
  const price = Math.round(exp.base_price_paise / 100);
  const totalPrice = price * participants;
  const policy = POLICY_MAP[exp.cancellation_policy] ?? POLICY_MAP.free_48h;
  const hasItinerary = Array.isArray(exp.itinerary) && exp.itinerary.length > 0;
  const hasInclusions = (exp.inclusions?.length ?? 0) > 0 || (exp.exclusions?.length ?? 0) > 0;

  function prevImg() {
    setImgIndex((i) => (i - 1 + images.length) % images.length);
  }
  function nextImg() {
    setImgIndex((i) => (i + 1) % images.length);
  }

  function scrollTo(id: NavSection) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Nav items — conditionally include itinerary
  const navItems: { id: NavSection; label: string }[] = [
    { id: "overview", label: "Overview" },
    ...(hasInclusions ? [{ id: "inclusions" as NavSection, label: "What's Included" }] : []),
    ...(hasItinerary ? [{ id: "itinerary" as NavSection, label: "Itinerary" }] : []),
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <div className="min-h-screen bg-white pt-16 pb-24 lg:pb-0">
      {/* ── Gallery ──────────────────────────────────────────────────────── */}
      <div className="relative h-[55vh] min-h-90 bg-slate-900 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={imgIndex}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => setLightboxOpen(true)}
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

        {/* Expand / lightbox trigger */}
        <button
          onClick={() => setLightboxOpen(true)}
          className="absolute bottom-4 right-16 h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          title="View full size"
        >
          <Expand className="h-4 w-4" />
        </button>

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

        {/* Image count pill */}
        {images.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {imgIndex + 1} / {images.length}
          </div>
        )}

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
          <button
            onClick={handleShare}
            title={shareCopied ? "Link copied!" : "Share this experience"}
            className="h-9 w-9 rounded-full bg-black/30 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/50 transition-colors relative"
          >
            <Share2 className="h-4 w-4" />
            {shareCopied && (
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                Copied!
              </span>
            )}
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

      {/* ── Sticky Section Navbar ─────────────────────────────────────────── */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-0 overflow-x-auto scrollbar-none">
            {navItems.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={cn(
                  "flex-shrink-0 px-4 py-3.5 text-sm font-medium transition-all border-b-2 whitespace-nowrap",
                  activeSection === id
                    ? "text-primary border-primary"
                    : "text-slate-500 border-transparent hover:text-slate-800 hover:border-slate-300"
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left — Details */}
          <div className="lg:col-span-2 space-y-10">

            {/* ── Overview ───────────────────────────────────────────────── */}
            <section id="overview" className="scroll-mt-32">
              {/* Title + meta */}
              <div className="mb-6">
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
                      {exp.total_bookings.toLocaleString("en-IN")} booked
                    </span>
                  )}
                </div>
              </div>

              {/* About — expandable description */}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-3">About this experience</h2>
                <p
                  ref={descRef}
                  className={cn(
                    "text-slate-600 leading-relaxed whitespace-pre-line transition-all",
                    !descExpanded && "line-clamp-5"
                  )}
                >
                  {exp.description}
                </p>
                {(descClamped || descExpanded) && (
                  <button
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-2 flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    {descExpanded ? (
                      <>Show less <ChevronDown className="h-4 w-4 rotate-180" /></>
                    ) : (
                      <>Read more <ChevronDown className="h-4 w-4" /></>
                    )}
                  </button>
                )}
              </div>
            </section>

            {/* ── Inclusions / Exclusions ────────────────────────────────── */}
            {hasInclusions && (
              <section id="inclusions" className="scroll-mt-32">
                <div className="flex items-center gap-2 mb-4">
                  <ListChecks className="h-5 w-5 text-slate-700" />
                  <h2 className="text-lg font-semibold text-slate-900">What's Included</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {exp.inclusions?.length > 0 && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 bg-emerald-100/60 border-b border-emerald-100">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-sm font-semibold text-emerald-800">Included</span>
                        <span className="ml-auto text-xs font-medium bg-emerald-200/70 text-emerald-700 px-2 py-0.5 rounded-full">
                          {exp.inclusions.length} item{exp.inclusions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <ul className="p-4 space-y-2.5">
                        {exp.inclusions.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {exp.exclusions?.length > 0 && (
                    <div className="rounded-2xl border border-rose-100 bg-rose-50/50 overflow-hidden">
                      <div className="flex items-center gap-2 px-4 py-3 bg-rose-100/60 border-b border-rose-100">
                        <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        <span className="text-sm font-semibold text-rose-800">Not Included</span>
                        <span className="ml-auto text-xs font-medium bg-rose-200/70 text-rose-700 px-2 py-0.5 rounded-full">
                          {exp.exclusions.length} item{exp.exclusions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <ul className="p-4 space-y-2.5">
                        {exp.exclusions.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                            <XCircle className="h-4 w-4 text-rose-400 mt-0.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* ── Itinerary ──────────────────────────────────────────────── */}
            {hasItinerary && (
              <section id="itinerary" className="scroll-mt-32">
                <div className="flex items-center gap-2 mb-4">
                  <Route className="h-5 w-5 text-slate-700" />
                  <h2 className="text-lg font-semibold text-slate-900">Itinerary</h2>
                  <span className="ml-1 text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {exp.itinerary!.length} day{exp.itinerary!.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-2">
                  {exp.itinerary!.map((day, index) => {
                    const isOpen = openDay === index;
                    return (
                      <div
                        key={index}
                        className={cn(
                          "rounded-xl border transition-colors overflow-hidden",
                          isOpen ? "border-primary/30 bg-primary/5" : "border-slate-200 bg-white hover:border-slate-300"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenDay(isOpen ? null : index)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                        >
                          <span className={cn(
                            "shrink-0 h-7 w-12 rounded-lg text-xs font-bold flex items-center justify-center transition-colors",
                            isOpen ? "bg-primary text-white" : "bg-slate-100 text-slate-600"
                          )}>
                            Day {String(day.day).padStart(2, "0")}
                          </span>
                          <span className="flex-1 text-sm font-semibold text-slate-800 truncate">
                            {day.title}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
                              isOpen && "rotate-180"
                            )}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              key="content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <p className="px-4 pb-4 pt-0 text-sm text-slate-600 leading-relaxed whitespace-pre-line border-t border-primary/10">
                                {day.description}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── Meeting point ──────────────────────────────────────────── */}
            {exp.meeting_point && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  Meeting Point
                </h3>
                <p className="text-sm text-slate-600 wrap-break-word line-clamp-2 mb-2 leading-relaxed">
                  {exp.meeting_point}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(exp.meeting_point!);
                      setMeetingCopied(true);
                      setTimeout(() => setMeetingCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    {meetingCopied ? "Copied!" : "Copy"}
                  </button>
                  {exp.meeting_point.startsWith("http") && (
                    <a
                      href={exp.meeting_point}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg hover:border-primary hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open in Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* ── Cancellation policy ────────────────────────────────────── */}
            <div className={cn("flex items-start gap-3 p-4 rounded-xl border", policy.color)}>
              {policy.icon}
              <div>
                <p className="text-sm font-semibold">{policy.label}</p>
                <p className="text-xs mt-1 opacity-80 leading-relaxed">{policy.description}</p>
              </div>
            </div>

            {/* ── Important info ─────────────────────────────────────────── */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="flex items-start gap-3">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-900 mb-1">Good to know</p>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Booking confirmation via email within 30 minutes</li>
                    <li>• Guide will contact you 48 hours before the activity</li>
                    <li>• Weather-dependent activity — cancellations due to safety are fully refunded</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* ── Support ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-200">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Need help?</p>
                <p className="text-sm text-slate-500">Email or call us 7am–8pm · Response within 15 min</p>
              </div>
            </div>

            {/* ── Reviews ────────────────────────────────────────────────── */}
            <section id="reviews" className="scroll-mt-32">
              {/* Section header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">Reviews</h2>
                  {exp.review_count > 0 && (
                    <span className="flex items-center gap-1 text-sm text-slate-600">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <strong>{exp.avg_rating.toFixed(1)}</strong>
                      <span className="text-slate-400">({exp.review_count})</span>
                    </span>
                  )}
                </div>
                {eligibility?.can_review && eligibility.booking_id && (
                  <a
                    href={`/bookings/${eligibility.booking_id}/review`}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Write a Review
                  </a>
                )}
              </div>

              {/* Rating distribution */}
              {reviewsData && reviewsData.total > 0 && (
                <div className="bg-slate-50 rounded-2xl p-4 mb-5 flex gap-6 items-center">
                  <div className="text-center shrink-0">
                    <p className="text-4xl font-bold text-slate-900 leading-none">
                      {exp.avg_rating.toFixed(1)}
                    </p>
                    <div className="flex justify-center gap-0.5 mt-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={cn(
                            "h-3.5 w-3.5",
                            n <= Math.round(exp.avg_rating)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-slate-200 text-slate-200"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {exp.review_count} review{exp.review_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((star) => {
                      const dist = reviewsData.distribution.find(
                        (d) => d.rating === star
                      );
                      const count = dist?.count ?? 0;
                      const pct =
                        exp.review_count > 0
                          ? Math.round((count / exp.review_count) * 100)
                          : 0;
                      return (
                        <div key={star} className="flex items-center gap-2 text-xs">
                          <span className="w-3 text-right text-slate-500">{star}</span>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-6 text-slate-400">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Review list */}
              {!reviewsData || reviewsData.reviews.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm mb-3">No reviews yet. Be the first!</p>
                  {eligibility?.can_review && eligibility.booking_id && (
                    <a
                      href={`/bookings/${eligibility.booking_id}/review`}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 bg-primary/5 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                    >
                      <Star className="h-3.5 w-3.5" />
                      Write the first review
                    </a>
                  )}
                </div>
              ) : (
                <div className="max-h-120 overflow-y-auto space-y-4 pr-1">
                  {reviewsData.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm"
                    >
                      {/* Reviewer + rating */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">
                              {review.customer_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {review.customer_name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {new Date(review.created_at).toLocaleDateString(
                                "en-IN",
                                { day: "numeric", month: "short", year: "numeric" }
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className={cn(
                                "h-3.5 w-3.5",
                                n <= review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-slate-200 text-slate-200"
                              )}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Body */}
                      {review.body && (
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {review.body}
                        </p>
                      )}

                      {/* Operator reply */}
                      {review.operator_reply && (
                        <div className="mt-3 pl-3 border-l-2 border-primary/30">
                          <div className="flex items-center gap-1.5 mb-1">
                            <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-semibold text-primary">
                              Response from the host
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {review.operator_reply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pagination */}
                  {reviewsData.total > 10 && (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        disabled={reviewPage === 1}
                        onClick={() => setReviewPage((p) => p - 1)}
                        className="text-sm text-slate-600 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        ← Previous
                      </button>
                      <span className="text-xs text-slate-400">
                        Page {reviewPage} of{" "}
                        {Math.ceil(reviewsData.total / 10)}
                      </span>
                      <button
                        disabled={reviewPage >= Math.ceil(reviewsData.total / 10)}
                        onClick={() => setReviewPage((p) => p + 1)}
                        className="text-sm text-slate-600 hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* Right — Booking card (sticky) */}
          <div className="lg:col-span-1" ref={bookingCardRef}>
            <div className="sticky top-28">
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
                <div ref={bookNowActionRef}>
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
                </div>

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

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-100 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium z-10">
              {imgIndex + 1} / {images.length}
            </div>

            {/* Prev */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); prevImg(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Image */}
            <motion.div
              key={imgIndex}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full max-w-5xl max-h-[85vh] mx-auto my-auto px-16 py-12"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[imgIndex]}
                alt={exp.title}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </motion.div>

            {/* Next */}
            {images.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); nextImg(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setImgIndex(i); }}
                    className={cn(
                      "h-12 w-16 rounded-lg overflow-hidden border-2 transition-all shrink-0",
                      i === imgIndex ? "border-white opacity-100" : "border-white/30 opacity-50 hover:opacity-75"
                    )}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile fixed Book Now button — hidden when booking card is in view */}
      <AnimatePresence>
        {showMobileBook && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-0 inset-x-0 z-50 lg:hidden px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
              <div>
                <p className="text-xs text-slate-500">from</p>
                <p className="text-lg font-bold text-slate-900">
                  ₹{price.toLocaleString("en-IN")}
                  <span className="text-xs font-normal text-slate-400 ml-1">/ person</span>
                </p>
              </div>
              <button
                onClick={() => {
                  const el = bookingCardRef.current;
                  if (!el) return;
                  // 64px site nav + 52px section nav = ~116px of sticky headers
                  const top = el.getBoundingClientRect().top + window.scrollY - 120;
                  window.scrollTo({ top, behavior: "smooth" });
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
              >
                Book Now
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen pt-16 animate-pulse">
      <div className="h-[55vh] bg-slate-200" />
      <div className="h-12 bg-white border-b border-slate-100" />
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
