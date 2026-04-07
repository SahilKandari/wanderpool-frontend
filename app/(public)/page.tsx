"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Search, MapPin, Star, ArrowRight, ChevronDown,
  Waves, Mountain, Wind, Tent, Heart, Shield, Clock, TrendingUp,
} from "lucide-react";
import { experienceKeys, listPublicExperiences } from "@/lib/api/experiences";
import { categoryKeys, listRootCategories } from "@/lib/api/categories";
import { paiseToCurrency } from "@/lib/utils/currency";
import type { Experience } from "@/lib/types/experience";
import type { Category } from "@/lib/types/experience";
import { cn } from "@/lib/utils";
console.log("Home page rendered");
// ── Hero background images ────────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    url: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1600&q=80",
    tag: "River Rafting",
    location: "Rishikesh, Uttarakhand",
  },
  {
    url: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=80",
    tag: "High Altitude Trekking",
    location: "Nag Tibba, Uttarakhand",
  },
  {
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80",
    tag: "Paragliding",
    location: "Mussoorie, Uttarakhand",
  },
];

// ── Category icons mapping ────────────────────────────────────────────────────
const CAT_ICONS: Record<string, React.ElementType> = {
  "water-sports": Waves,
  "trekking": Mountain,
  "aerial": Wind,
  "camping": Tent,
};

const CAT_COLORS: Record<string, string> = {
  "water-sports": "from-blue-500 to-cyan-400",
  "trekking": "from-emerald-500 to-teal-400",
  "aerial": "from-violet-500 to-purple-400",
  "camping": "from-amber-500 to-orange-400",
  "yoga-wellness": "from-rose-500 to-pink-400",
  "sightseeing": "from-indigo-500 to-blue-400",
};

// ── Stat counter ──────────────────────────────────────────────────────────────
function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let frame = 0;
    const total = 60;
    const timer = setInterval(() => {
      frame++;
      setCount(Math.round((frame / total) * target));
      if (frame >= total) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [started, target]);

  return <span ref={ref}>{count.toLocaleString("en-IN")}{suffix}</span>;
}

// ── Experience card ────────────────────────────────────────────────────────────
function ExperienceCard({ exp, index }: { exp: Experience; index: number }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link href={`/experiences/${exp.slug}`}>
        <div
          className="group relative rounded-2xl overflow-hidden bg-slate-900 cursor-pointer"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Image */}
          <div className="aspect-[4/3] overflow-hidden">
            <div
              className={cn(
                "w-full h-full bg-gradient-to-br transition-transform duration-700",
                hovered ? "scale-110" : "scale-100",
                CAT_COLORS["trekking"]
              )}
            >
              <div className="w-full h-full flex items-center justify-center opacity-20">
                <Mountain className="h-24 w-24 text-white" />
              </div>
            </div>
          </div>

          {/* Featured badge */}
          {exp.is_featured && (
            <div className="absolute top-3 left-3 flex items-center gap-1 bg-amber-400 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
              <TrendingUp className="h-3 w-3" />
              Featured
            </div>
          )}

          {/* Wishlist */}
          <button className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            <Heart className="h-4 w-4" />
          </button>

          {/* Info overlay */}
          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <div className="flex items-center gap-1 text-xs text-white/70 mb-1">
              <MapPin className="h-3 w-3" />
              {exp.location_city}
            </div>
            <h3 className="font-bold text-white text-sm leading-snug line-clamp-2 mb-2">
              {exp.title}
            </h3>
            <div className="flex items-center justify-between">
              <div>
                {exp.avg_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-semibold text-white">{exp.avg_rating.toFixed(1)}</span>
                    <span className="text-xs text-white/60">({exp.review_count})</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60">from</p>
                <p className="text-sm font-bold text-white">{paiseToCurrency(exp.base_price_paise)}</p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Category pill ─────────────────────────────────────────────────────────────
function CategoryCard({ cat, index }: { cat: Category; index: number }) {
  const Icon = CAT_ICONS[cat.slug] ?? Mountain;
  const gradient = CAT_COLORS[cat.slug] ?? "from-slate-500 to-slate-400";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.07 }}
    >
      <Link href={`/experiences?category=${cat.slug}`}>
        <div className="group flex flex-col items-center gap-3 cursor-pointer">
          <div className={cn(
            "h-16 w-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
            "group-hover:scale-110 group-hover:shadow-xl transition-all duration-300",
            gradient
          )}>
            <Icon className="h-7 w-7 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors text-center">
            {cat.name}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [slide, setSlide] = useState(0);
  const [search, setSearch] = useState("");
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Auto-advance slides
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const { data: experiences = [] } = useQuery({
    queryKey: experienceKeys.list(),
    queryFn: () => listPublicExperiences({ limit: 6 }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: categoryKeys.roots(),
    queryFn: listRootCategories,
  });

  const featured = experiences.filter(e => e.is_featured);
  const allExps = experiences.slice(0, 6);

  return (
    <div className="bg-white">
      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
        {/* Slides */}
        <AnimatePresence mode="sync">
          <motion.div
            key={slide}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            style={{ y: heroY }}
          >
            <Image
              src={HERO_SLIDES[slide].url}
              alt={HERO_SLIDES[slide].tag}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        {/* Slide label */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute top-24 left-6 sm:left-12"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 text-white/80 text-sm font-medium"
            >
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              {HERO_SLIDES[slide].location}
              <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-xs">
                {HERO_SLIDES[slide].tag}
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity }}
          className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 text-amber-400 text-sm font-semibold tracking-widest uppercase mb-4">
              <span className="h-px w-8 bg-amber-400 inline-block" />
              Uttarakhand Adventures
              <span className="h-px w-8 bg-amber-400 inline-block" />
            </span>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-[1.05] mb-6 max-w-4xl">
              Your Next
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                Adventure
              </span>{" "}
              Awaits
            </h1>
            <p className="text-lg text-white/75 max-w-lg mx-auto mb-10 leading-relaxed">
              Book verified river rafting, treks, camping and more with trusted local guides in Rishikesh & Mussoorie.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="w-full max-w-xl"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = `/experiences?q=${encodeURIComponent(search)}`;
              }}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 shadow-2xl"
            >
              <div className="flex items-center gap-3 flex-1 px-3">
                <Search className="h-4 w-4 text-white/60 shrink-0" />
                <input
                  type="text"
                  placeholder="Search rafting, trekking, paragliding…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm outline-none"
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-semibold transition-colors shadow-lg"
              >
                Search
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Quick tags */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {["River Rafting", "Trekking", "Camping", "Paragliding"].map(tag => (
                <Link
                  key={tag}
                  href={`/experiences?q=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white/90 text-xs font-medium border border-white/20 hover:bg-white/25 transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Slide dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === slide ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 right-8 flex flex-col items-center gap-1 text-white/50"
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-[10px] uppercase tracking-widest">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <section className="bg-primary py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            {[
              { value: 500, suffix: "+", label: "Adventures Booked" },
              { value: 50, suffix: "+", label: "Local Guides" },
              { value: 4.8, suffix: "★", label: "Average Rating" },
              { value: 12, suffix: "+", label: "Activity Types" },
            ].map(({ value, suffix, label }) => (
              <div key={label}>
                <p className="text-3xl font-black mb-1">
                  <AnimatedNumber target={value} suffix={suffix} />
                </p>
                <p className="text-sm text-white/70 font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">What We Offer</span>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground mt-2">
            Explore by Activity
          </h2>
          <p className="text-muted-foreground mt-3 max-w-md mx-auto">
            From wild rapids to mountain peaks — find your perfect adventure.
          </p>
        </motion.div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-6">
          {categories.slice(0, 8).map((cat, i) => (
            <CategoryCard key={cat.id} cat={cat} index={i} />
          ))}
        </div>
      </section>

      {/* ── FEATURED EXPERIENCES ──────────────────────────────────────────── */}
      {allExps.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-end justify-between mb-10"
            >
              <div>
                <span className="text-primary text-sm font-semibold uppercase tracking-widest">Top Picks</span>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground mt-2">
                  Trending Adventures
                </h2>
              </div>
              <Link
                href="/experiences"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-3 transition-all"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allExps.map((exp, i) => (
                <ExperienceCard key={exp.id} exp={exp} index={i} />
              ))}
            </div>

            <div className="mt-10 text-center sm:hidden">
              <Link
                href="/experiences"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm"
              >
                View all experiences <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── WHY WANDERPOOL ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">Why Us</span>
          <h2 className="text-3xl sm:text-4xl font-black mt-2">Book with Confidence</h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Shield,
              color: "bg-emerald-50 text-emerald-600",
              title: "Verified Operators",
              desc: "Every guide is background-checked, certified, and reviewed by our safety team before listing.",
            },
            {
              icon: Star,
              color: "bg-amber-50 text-amber-600",
              title: "Real Reviews",
              desc: "Only verified travellers who completed the activity can leave reviews. No fake ratings.",
            },
            {
              icon: Clock,
              color: "bg-blue-50 text-blue-600",
              title: "Instant Confirmation",
              desc: "Get your booking confirmed instantly via WhatsApp with the guide's contact and meeting point.",
            },
          ].map(({ icon: Icon, color, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group p-8 rounded-2xl border border-slate-100 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 bg-white"
            >
              <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center mb-5", color)}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ────────────────────────────────────────────────────── */}
      <section className="mx-4 sm:mx-6 lg:mx-8 mb-16 max-w-7xl md:mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-indigo-600 to-violet-700 p-12 text-center"
        >
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative z-10">
            <span className="text-white/70 text-sm font-semibold uppercase tracking-widest">Ready to explore?</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-3 mb-4">
              Your Mountain Story Starts Here
            </h2>
            <p className="text-white/70 max-w-md mx-auto mb-8 text-sm leading-relaxed">
              Join thousands of adventurers who've discovered Uttarakhand's best kept secrets with WanderPool.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/experiences"
                className="px-8 py-3.5 rounded-2xl bg-white text-primary font-bold text-sm hover:shadow-xl hover:scale-105 transition-all"
              >
                Browse Adventures
              </Link>
              <Link
                href="/customer/register"
                className="px-8 py-3.5 rounded-2xl bg-white/15 border border-white/30 text-white font-bold text-sm hover:bg-white/25 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
