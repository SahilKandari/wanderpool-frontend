"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  animate as motionAnimate,
  type MotionValue,
} from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFeaturedReviews, reviewKeys } from "@/lib/api/reviews";
import type { Review } from "@/lib/types/review";

// ── Avatar colours cycling per card index ─────────────────────────────────────
const AVATAR_COLORS = [
  "from-teal-500 to-emerald-400",
  "from-blue-500 to-cyan-400",
  "from-rose-500 to-pink-400",
  "from-amber-500 to-orange-400",
  "from-violet-500 to-purple-400",
  "from-slate-600 to-slate-400",
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

// ── Desktop: DECK-TO-FAN config ────────────────────────────────────────────────
type CardConfig = {
  startX: number; startY: number; startRot: number;
  endX:   number; endY:   number; endRot:   number;
  inputRange: [number, number];
  zOrder: number;
};

const CARD_CONFIG: CardConfig[] = [
  { startX:  3, startY:  8, startRot:  -8, endX: -405, endY:  42, endRot: -16, inputRange: [0.0, 0.88], zOrder: 1 },
  { startX: -3, startY:  4, startRot:  -5, endX: -232, endY:  -5, endRot:  -8, inputRange: [0.0, 0.88], zOrder: 3 },
  { startX: -1, startY:  2, startRot:  -2, endX:  -60, endY: -38, endRot:   1, inputRange: [0.0, 0.88], zOrder: 5 },
  { startX:  1, startY: -2, startRot:   2, endX:  115, endY:  -8, endRot:   8, inputRange: [0.0, 0.88], zOrder: 6 },
  { startX:  3, startY: -4, startRot:   5, endX:  290, endY:  22, endRot:  13, inputRange: [0.0, 0.88], zOrder: 4 },
  { startX: -3, startY: -8, startRot:   8, endX:  418, endY:  55, endRot:  19, inputRange: [0.0, 0.88], zOrder: 2 },
];

const CARD_W = 144;
const CARD_H = 115;

// ── Shared ─────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 mt-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
          )}
        />
      ))}
    </div>
  );
}

function SectionHeader({ className }: { className?: string }) {
  return (
    <div className={cn("text-center px-4", className)}>
      <span className="text-primary text-sm font-semibold uppercase tracking-widest">
        Traveller Stories
      </span>
      <h2 className="text-3xl sm:text-4xl font-black text-foreground mt-2">
        What Adventurers Say
      </h2>
      <p className="text-muted-foreground mt-3 max-w-md mx-auto text-sm">
        Real reviews from verified travellers who explored the best of Uttarakhand.
      </p>
    </div>
  );
}

// ── Desktop animated card ──────────────────────────────────────────────────────
function DesktopCard({
  review,
  color,
  config,
  scrollProgress,
  isHovered,
  onHover,
  onHoverEnd,
}: {
  review: Review;
  color: string;
  config: CardConfig;
  scrollProgress: MotionValue<number>;
  isHovered: boolean;
  onHover: () => void;
  onHoverEnd: () => void;
}) {
  const x      = useTransform(scrollProgress, config.inputRange, [config.startX, config.endX]);
  const y      = useTransform(scrollProgress, config.inputRange, [config.startY, config.endY]);
  const rotate = useTransform(scrollProgress, config.inputRange, [config.startRot, config.endRot]);

  const href = review.experience_slug
    ? `/experiences/${review.experience_slug}`
    : "/experiences";

  return (
    <motion.div
      style={{
        position: "absolute",
        left: "50%",
        top: "50%",
        marginLeft: -CARD_W,
        marginTop: -CARD_H,
        x, y, rotate,
        zIndex: isHovered ? 20 : config.zOrder,
      }}
      whileHover={{ scale: 1.06 }}
      transition={{ type: "spring", stiffness: 340, damping: 26 }}
      onHoverStart={onHover}
      onHoverEnd={onHoverEnd}
    >
      <Link href={href} className="block cursor-pointer">
        <div className="w-72 bg-white rounded-2xl p-6 border border-slate-200 shadow-2xl hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.28)] transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "h-12 w-12 rounded-full bg-linear-to-br flex items-center justify-center shrink-0 shadow-md",
              color
            )}>
              <span className="text-white text-sm font-bold">{getInitials(review.customer_name)}</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-slate-900 text-sm truncate">{review.customer_name}</p>
              <Stars rating={review.rating} />
            </div>
          </div>
          <p className="text-slate-800 text-sm leading-relaxed mb-5 line-clamp-3 font-medium">
            &ldquo;{review.body}&rdquo;
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold border-t border-slate-100 pt-4">
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            {review.experience_title}
            <span className="mx-0.5 text-slate-300">•</span>
            {formatDate(review.created_at)}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Mobile: card face ──────────────────────────────────────────────────────────
function MobileCardFace({ review, color }: { review: Review; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
      <div className={cn("h-1.5 w-full bg-linear-to-r", color)} />
      <div className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "h-13 w-13 rounded-full bg-linear-to-br flex items-center justify-center shrink-0 shadow-md",
            color
          )}>
            <span className="text-white text-base font-bold">{getInitials(review.customer_name)}</span>
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 text-base">{review.customer_name}</p>
            <Stars rating={review.rating} />
          </div>
        </div>
        <p className="text-slate-800 text-[15px] leading-relaxed mb-5 font-medium">
          &ldquo;{review.body}&rdquo;
        </p>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold border-t border-slate-100 pt-4">
          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          {review.experience_title}
          <span className="mx-1 text-slate-300">•</span>
          {formatDate(review.created_at)}
        </div>
      </div>
    </div>
  );
}

// ── Mobile: draggable top card ─────────────────────────────────────────────────
function SwipeCard({
  review,
  color,
  onSwipe,
}: {
  review: Review;
  color: string;
  onSwipe: () => void;
}) {
  const x      = useMotionValue(0);
  const rotate = useTransform(x, [-160, 0, 160], [-14, 0, 14]);

  const handleDragEnd = (
    _: unknown,
    info: { offset: { x: number }; velocity: { x: number } }
  ) => {
    const swiped =
      Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 400;
    if (swiped) {
      void motionAnimate(x, info.offset.x > 0 ? 520 : -520, {
        duration: 0.22,
        ease: "easeOut",
      });
      setTimeout(onSwipe, 210);
    } else {
      void motionAnimate(x, 0, { type: "spring", stiffness: 500, damping: 32 });
    }
  };

  const href = review.experience_slug
    ? `/experiences/${review.experience_slug}`
    : "/experiences";

  return (
    <motion.div
      className="absolute w-75 cursor-grab active:cursor-grabbing select-none"
      style={{ x, rotate, touchAction: "pan-y" }}
      initial={{ scale: 0.93, y: 11 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 310, damping: 28 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDragEnd={handleDragEnd}
    >
      <Link href={href} className="block">
        <MobileCardFace review={review} color={color} />
      </Link>
    </motion.div>
  );
}

// ── Mobile: full swipe stack section ──────────────────────────────────────────
function MobileSwipeStack({ reviews }: { reviews: Review[] }) {
  const total = reviews.length;
  const [topIdx, setTopIdx] = useState(0);

  const advance = () => setTopIdx((p) => (p + 1) % total);
  const goBack  = () => setTopIdx((p) => (p - 1 + total) % total);
  const card    = (offset: number) => reviews[(topIdx + offset) % total];
  const color   = (offset: number) => AVATAR_COLORS[(topIdx + offset) % AVATAR_COLORS.length];

  return (
    <div className="px-4">
      <div className="relative h-115 flex items-center justify-center">
        <motion.div
          animate={{ scale: 0.87, y: 22 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute w-75 pointer-events-none"
        >
          <MobileCardFace review={card(2)} color={color(2)} />
        </motion.div>

        <motion.div
          animate={{ scale: 0.935, y: 11 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute w-75 pointer-events-none"
        >
          <MobileCardFace review={card(1)} color={color(1)} />
        </motion.div>

        <SwipeCard key={topIdx} review={card(0)} color={color(0)} onSwipe={advance} />
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-6">
        {reviews.map((_, i) => (
          <div
            key={i}
            className={cn(
              "rounded-full transition-all duration-300",
              i === topIdx ? "h-2 w-6 bg-primary" : "h-2 w-2 bg-slate-300"
            )}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-4 mt-5">
        <button
          onClick={goBack}
          className="h-11 w-11 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-colors"
          aria-label="Previous review"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <span className="text-sm text-slate-400 tabular-nums w-10 text-center">
          {topIdx + 1} / {total}
        </span>

        <button
          onClick={advance}
          className="h-11 w-11 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 hover:border-primary hover:text-primary transition-colors"
          aria-label="Next review"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 mt-3 font-medium">
        Swipe the card or use arrows to browse reviews
      </p>
    </div>
  );
}

// ── Inner component — only mounted when reviews are ready ─────────────────────
// Keeps useScroll's ref always attached to a real DOM element.
function ScrollFanReviewsInner({ reviews }: { reviews: Review[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const desktopReviews = reviews.slice(0, 6);
  const desktopConfigs = CARD_CONFIG.slice(0, desktopReviews.length);

  return (
    <>
      {/* ── Desktop (≥1024px): scroll-driven deck-to-fan ──────────────────── */}
      <section
        ref={sectionRef}
        className="relative bg-slate-50 hidden lg:block"
        style={{ height: "200vh" }}
      >
        <div className="sticky top-0 h-screen flex flex-col overflow-hidden">
          <SectionHeader className="pt-20 pb-6 shrink-0 relative z-30" />
          <div className="flex-1 relative">
            {desktopReviews.map((review, i) => (
              <DesktopCard
                key={review.id}
                review={review}
                color={AVATAR_COLORS[i % AVATAR_COLORS.length]}
                config={desktopConfigs[i]}
                scrollProgress={scrollYProgress}
                isHovered={hoveredIndex === i}
                onHover={() => setHoveredIndex(i)}
                onHoverEnd={() => setHoveredIndex(null)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Mobile / tablet (<1024px): Tinder-style swipe stack ───────────── */}
      <section className="lg:hidden bg-slate-50 py-16">
        <SectionHeader className="mb-10" />
        <MobileSwipeStack reviews={reviews} />
      </section>
    </>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export function ScrollFanReviews() {
  const { data: reviews = [] } = useQuery({
    queryKey: reviewKeys.featured(),
    queryFn: getFeaturedReviews,
    staleTime: 5 * 60 * 1000,
  });

  // Wait for enough reviews before mounting the inner component.
  // This ensures useScroll's ref is always attached to a real DOM node.
  if (reviews.length < 3) return null;

  return <ScrollFanReviewsInner reviews={reviews} />;
}
