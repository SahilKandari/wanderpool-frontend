"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useFavourite } from "@/lib/hooks/useFavourite";
import {
  Search,
  MapPin,
  Star,
  Clock,
  Users,
  SlidersHorizontal,
  ChevronDown,
  X,
  Zap,
  Mountain,
  Waves,
  Tent,
  Wind,
  Heart,
  Filter,
} from "lucide-react";
import { listPublicExperiences, experienceKeys } from "@/lib/api/experiences";
import { listRootCategories, categoryKeys } from "@/lib/api/categories";
import type { Experience } from "@/lib/types/experience";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "water-sports": <Waves className="h-4 w-4" />,
  trekking: <Mountain className="h-4 w-4" />,
  camping: <Tent className="h-4 w-4" />,
  paragliding: <Wind className="h-4 w-4" />,
  default: <Zap className="h-4 w-4" />,
};

const CITIES = ["All Cities", "Rishikesh", "Mussoorie", "Haridwar", "Dehradun"];
const DURATION_FILTERS = [
  { label: "Any", value: "" },
  { label: "< 2 hours", value: "short" },
  { label: "Half day", value: "half" },
  { label: "Full day", value: "full" },
  { label: "Multi-day", value: "multi" },
];
const PRICE_FILTERS = [
  { label: "Any Price", value: "" },
  { label: "Under ₹999", value: "999" },
  { label: "Under ₹2,499", value: "2499" },
  { label: "Under ₹4,999", value: "4999" },
];

function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const h = Math.round(minutes / 60);
    return `${h} hr${h > 1 ? "s" : ""}`;
  }
  const d = Math.round(minutes / 1440);
  return `${d} day${d > 1 ? "s" : ""}`;
}


const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80",
  "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80",
  "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=600&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
];

function ExperienceCard({ exp, index }: { exp: Experience; index: number }) {
  const pathname = usePathname();
  const { isFavourited, toggle, isLoading: favLoading } = useFavourite(exp.id);
  const price = Math.round(exp.base_price_paise / 100);

  const img = exp.cover_image_url ?? PLACEHOLDERS[index % PLACEHOLDERS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
    >
      <Link href={`/experiences/${exp.slug}`} className="block">
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <Image
            src={img}
            alt={exp.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />

          {/* Featured badge */}
          {exp.is_featured && (
            <span className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Featured
            </span>
          )}

          {/* Duration badge */}
          <span className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {durationLabel(exp.duration_minutes)}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-xs text-primary font-semibold uppercase tracking-wide flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {exp.location_city}
            </p>
            {exp.avg_rating > 0 && (
              <span className="flex items-center gap-0.5 text-xs font-semibold text-slate-700">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {exp.avg_rating.toFixed(1)}
                <span className="font-normal text-slate-400">({exp.review_count})</span>
              </span>
            )}
          </div>

          <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {exp.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {exp.min_participants}–{exp.max_participants} people
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">from</span>
              <p className="text-lg font-bold text-slate-900">
                ₹{price.toLocaleString("en-IN")}
              </p>
              <span className="text-xs text-slate-400">per person</span>
            </div>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
              Book now →
            </span>
          </div>
        </div>
      </Link>

      {/* Favourite button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          toggle(pathname);
        }}
        disabled={favLoading}
        aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
        className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform disabled:opacity-60"
      >
        <Heart
          className={cn(
            "h-4 w-4 transition-colors",
            isFavourited ? "fill-rose-500 text-rose-500" : "text-slate-500"
          )}
        />
      </button>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
      <div className="h-52 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-slate-200 rounded w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-8 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}

function ExperiencesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [duration, setDuration] = useState("");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");
  const [categoryId, setCategoryId] = useState(searchParams.get("category_id") ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const cityRef = useRef<HTMLDivElement>(null);

  // Sync filter state → URL so the URL is shareable / bookmarkable
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (city) params.set("city", city);
    if (categoryId) params.set("category_id", categoryId);
    if (duration) params.set("duration", duration);
    if (maxPrice) params.set("max_price", maxPrice);
    const qs = params.toString();
    router.replace(qs ? `/experiences?${qs}` : "/experiences", { scroll: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, city, categoryId, duration, maxPrice]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: categories = [] } = useQuery({
    queryKey: categoryKeys.roots(),
    queryFn: listRootCategories,
  });

  const queryParams = {
    city: city || undefined,
    category_id: categoryId || undefined,
    max_price: maxPrice ? Number(maxPrice) * 100 : undefined,
    duration: duration || undefined,
    limit: 24,
  };

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: experienceKeys.list({ city, max_price: maxPrice, category_id: categoryId, duration }),
    queryFn: () => listPublicExperiences(queryParams),
  });

  // Client-side filter: search text only (all other filters are server-side)
  const filtered = experiences.filter((exp) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      exp.title.toLowerCase().includes(q) ||
      exp.location_city.toLowerCase().includes(q) ||
      exp.description.toLowerCase().includes(q)
    );
  });

  const activeFilterCount = [city, duration, maxPrice, categoryId].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      {/* Search header */}
      <div className="bg-white border-b border-slate-100 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search experiences, activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-slate-50 placeholder:text-slate-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* City picker */}
            <div className="relative" ref={cityRef}>
              <button
                onClick={() => setCityOpen(!cityOpen)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors min-w-35",
                  city
                    ? "border-primary text-primary bg-primary/5"
                    : "border-slate-200 text-slate-600 bg-slate-50 hover:border-slate-300"
                )}
              >
                <MapPin className="h-4 w-4" />
                {city || "All Cities"}
                <ChevronDown className={cn("h-3.5 w-3.5 ml-auto transition-transform", cityOpen && "rotate-180")} />
              </button>
              <AnimatePresence>
                {cityOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full mt-1 left-0 bg-white rounded-xl border border-slate-200 shadow-lg py-1 min-w-40 z-50"
                  >
                    {CITIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setCity(c === "All Cities" ? "" : c);
                          setCityOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors",
                          (c === "All Cities" ? !city : city === c)
                            ? "text-primary font-medium"
                            : "text-slate-700"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                showFilters || activeFilterCount > 0
                  ? "border-primary text-primary bg-primary/5"
                  : "border-slate-200 text-slate-600 bg-slate-50 hover:border-slate-300"
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="h-4.5 min-w-4.5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Expanded filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-4 flex flex-wrap gap-6">
                  {/* Duration */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Duration</p>
                    <div className="flex flex-wrap gap-2">
                      {DURATION_FILTERS.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => setDuration(duration === f.value ? "" : f.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                            duration === f.value
                              ? "border-primary bg-primary text-white"
                              : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Max Price</p>
                    <div className="flex flex-wrap gap-2">
                      {PRICE_FILTERS.map((f) => (
                        <button
                          key={f.value}
                          onClick={() => setMaxPrice(maxPrice === f.value ? "" : f.value)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                            maxPrice === f.value
                              ? "border-primary bg-primary text-white"
                              : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear */}
                  {activeFilterCount > 0 && (
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          setCity("");
                          setDuration("");
                          setMaxPrice("");
                          setCategoryId("");
                        }}
                        className="text-xs text-slate-500 hover:text-red-500 flex items-center gap-1 transition-colors"
                      >
                        <X className="h-3 w-3" />
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Category pills */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-2 overflow-x-auto py-3 scrollbar-hide">
              <button
                onClick={() => setCategoryId("")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
                  !categoryId
                    ? "bg-primary text-white"
                    : "border border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                )}
              >
                <Filter className="h-3 w-3" />
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(categoryId === cat.id ? "" : cat.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
                    categoryId === cat.id
                      ? "border-primary bg-primary text-white"
                      : "border-slate-200 text-slate-600 hover:border-primary hover:text-primary"
                  )}
                >
                  {CATEGORY_ICONS[cat.slug] ?? CATEGORY_ICONS.default}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {city ? `Adventures in ${city}` : "All Experiences"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isLoading ? "Searching..." : `${filtered.length} experience${filtered.length !== 1 ? "s" : ""} found`}
            </p>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <Mountain className="h-10 w-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No experiences found</h3>
            <p className="text-sm text-slate-500 max-w-xs">
              Try adjusting your search or filters to find the perfect adventure.
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCity("");
                setDuration("");
                setMaxPrice("");
                setCategoryId("");
              }}
              className="mt-6 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Reset filters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((exp, i) => (
              <ExperienceCard key={exp.id} exp={exp} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExperiencesPage() {
  return (
    <Suspense>
      <ExperiencesContent />
    </Suspense>
  );
}
