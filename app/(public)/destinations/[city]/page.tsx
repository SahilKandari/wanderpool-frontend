import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Star, Clock, Users, ChevronRight } from "lucide-react";
import { getDestinationExperiences, listLeafCategories, toDisplayCity, toCitySlug } from "@/lib/api/destinations";
import type { Experience } from "@/lib/types/experience";

const BASE_URL = "https://wanderpool.com";
export const revalidate = 3600;

const PLACEHOLDERS = [
  "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&q=80",
  "https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=600&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&q=80",
  "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?w=600&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
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

function StaticExperienceCard({ exp, index }: { exp: Experience; index: number }) {
  const price = Math.round(exp.base_price_paise / 100);
  const img = exp.cover_image_url ?? PLACEHOLDERS[index % PLACEHOLDERS.length];

  return (
    <Link
      href={`/experiences/${exp.slug}`}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100"
    >
      <div className="relative h-52 overflow-hidden">
        <Image
          src={img}
          alt={exp.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
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
  );
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> }
): Promise<Metadata> {
  const { city } = await params;
  const displayCity = toDisplayCity(city);
  const title = `Adventure Experiences in ${displayCity}`;
  const description = `Book the best adventure experiences in ${displayCity} — river rafting, trekking, camping, paragliding and more. Verified operators, instant booking on WanderPool.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/destinations/${city}`,
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CityPage(
  { params }: { params: Promise<{ city: string }> }
) {
  const { city } = await params;
  const displayCity = toDisplayCity(city);

  const [experiences, leafCategories] = await Promise.all([
    getDestinationExperiences(displayCity, undefined, { next: { revalidate: 3600 } }),
    listLeafCategories({ next: { revalidate: 3600 } }),
  ]);

  // Only show categories that actually have experiences in this city
  const cityExperienceCategoryIds = new Set(experiences.map((e) => e.category_id));
  const categories = leafCategories.filter((c) => cityExperienceCategoryIds.has(c.id));

  if (experiences.length === 0) notFound();

  const minPrice = Math.min(...experiences.map((e) => e.base_price_paise));
  const totalBookings = experiences.reduce((s, e) => s + e.total_bookings, 0);

  // JSON-LD
  const touristDestinationLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: displayCity,
    description: `${displayCity} is a premier adventure destination in India offering ${experiences.length} verified experiences including river rafting, trekking, camping and more.`,
    url: `${BASE_URL}/destinations/${city}`,
    touristType: "Adventure Travellers",
    geo: { "@type": "GeoCoordinates" },
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Adventure Experiences in ${displayCity}`,
    numberOfItems: experiences.length,
    itemListElement: experiences.slice(0, 20).map((exp, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: exp.title,
      url: `${BASE_URL}/experiences/${exp.slug}`,
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Destinations", item: `${BASE_URL}/destinations` },
      { "@type": "ListItem", position: 3, name: displayCity },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(touristDestinationLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="min-h-screen bg-white pt-16">
        {/* Hero */}
        <div className="bg-linear-to-br from-slate-900 via-slate-800 to-primary/80 text-white py-16 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-6">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/experiences" className="hover:text-white transition-colors">Experiences</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white">{displayCity}</span>
            </nav>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Adventure Experiences in {displayCity}
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mb-8">
              Discover and book the best outdoor adventures in {displayCity}. Verified local operators, instant confirmation.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-2xl font-bold">{experiences.length}</p>
                <p className="text-sm text-white/60">Experiences</p>
              </div>
              <div>
                <p className="text-2xl font-bold">₹{Math.round(minPrice / 100).toLocaleString("en-IN")}+</p>
                <p className="text-sm text-white/60">Starting from</p>
              </div>
              {totalBookings > 0 && (
                <div>
                  <p className="text-2xl font-bold">{totalBookings.toLocaleString("en-IN")}+</p>
                  <p className="text-sm text-white/60">Bookings</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Category filter links */}
          {categories.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">
                Browse by Activity
              </h2>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/destinations/${city}`}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-primary text-white"
                >
                  All Activities
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/destinations/${city}/${cat.slug}`}
                    className="px-4 py-2 rounded-full text-sm font-medium border border-slate-200 text-slate-600 hover:border-primary hover:text-primary transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Experience grid */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-5">
              All Experiences in {displayCity}
              <span className="ml-2 text-sm font-normal text-slate-400">({experiences.length})</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {experiences.map((exp, i) => (
                <StaticExperienceCard key={exp.id} exp={exp} index={i} />
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-16 bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Are you a local operator in {displayCity}?
            </h2>
            <p className="text-slate-500 mb-5 max-w-xl mx-auto">
              List your experience on WanderPool and reach thousands of adventure seekers every month.
            </p>
            <Link
              href="/agency/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              List Your Experience
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
