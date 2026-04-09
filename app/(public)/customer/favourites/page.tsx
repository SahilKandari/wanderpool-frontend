"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  MapPin,
  Clock,
  Star,
  ArrowRight,
  Trash2,
  Mountain,
} from "lucide-react";
import { useAuth } from "@/lib/providers/AuthProvider";
import {
  listFavouriteExperiences,
  removeFavourite,
  favouriteKeys,
  type FavouriteExperience,
} from "@/lib/api/favourites";
import { cn } from "@/lib/utils";

function durationLabel(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 1440) {
    const h = Math.round(minutes / 60);
    return `${h} hr${h > 1 ? "s" : ""}`;
  }
  const d = Math.round(minutes / 1440);
  return `${d} day${d > 1 ? "s" : ""}`;
}

function FavouriteCard({ exp }: { exp: FavouriteExperience }) {
  const qc = useQueryClient();
  const price = Math.round(exp.base_price_paise / 100);

  const removeMutation = useMutation({
    mutationFn: () => removeFavourite(exp.id),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: favouriteKeys.experiences() });
      const prev = qc.getQueryData<FavouriteExperience[]>(favouriteKeys.experiences()) ?? [];
      qc.setQueryData<FavouriteExperience[]>(
        favouriteKeys.experiences(),
        (old = []) => old.filter((e) => e.id !== exp.id)
      );
      // Also update the IDs list used by the heart buttons on other pages
      qc.setQueryData<string[]>(
        favouriteKeys.list(),
        (old = []) => old.filter((id) => id !== exp.id)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(favouriteKeys.experiences(), ctx?.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: favouriteKeys.experiences() });
      qc.invalidateQueries({ queryKey: favouriteKeys.list() });
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
    >
      <Link href={`/experiences/${exp.slug}`} className="block">
        <div className="relative h-52 overflow-hidden">
          {exp.cover_image_url ? (
            <Image
              src={exp.cover_image_url}
              alt={exp.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-indigo-400 to-violet-500 flex items-center justify-center">
              <Mountain className="h-16 w-16 text-white/30" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/30 via-transparent to-transparent" />

          {exp.is_featured && (
            <span className="absolute top-3 left-3 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              Featured
            </span>
          )}

          <span className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {durationLabel(exp.duration_minutes)}
          </span>
        </div>

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

          <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-3 line-clamp-2 group-hover:text-primary transition-colors">
            {exp.title}
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400">from</span>
              <p className="text-lg font-bold text-slate-900">
                ₹{price.toLocaleString("en-IN")}
              </p>
              <span className="text-xs text-slate-400">per person</span>
            </div>
            <span className="text-xs font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors flex items-center gap-1">
              Book now <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>

      {/* Remove button */}
      <button
        onClick={() => removeMutation.mutate()}
        disabled={removeMutation.isPending}
        title="Remove from favourites"
        className={cn(
          "absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-all",
          removeMutation.isPending ? "opacity-50" : "hover:bg-rose-50"
        )}
      >
        <Trash2 className="h-4 w-4 text-rose-500" />
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
        <div className="h-8 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function FavouritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user === null) {
      router.replace("/customer/login?next=/customer/favourites");
    }
  }, [user, authLoading, router]);

  const { data: favourites = [], isLoading } = useQuery({
    queryKey: favouriteKeys.experiences(),
    queryFn: listFavouriteExperiences,
    enabled: !!user && user.actorKind === "customer",
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user || user.actorKind !== "customer") {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <Heart className="h-5 w-5 text-rose-500 fill-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Favourites</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {isLoading
                ? "Loading…"
                : `${favourites.length} saved experience${favourites.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : favourites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-28 text-center"
          >
            <div className="h-20 w-20 rounded-full bg-rose-50 flex items-center justify-center mb-5">
              <Heart className="h-10 w-10 text-rose-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No saved experiences yet</h3>
            <p className="text-sm text-slate-500 max-w-xs mb-6">
              Tap the heart icon on any experience to save it for later.
            </p>
            <Link
              href="/experiences"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Browse experiences <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {favourites.map((exp) => (
              <FavouriteCard key={exp.id} exp={exp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
