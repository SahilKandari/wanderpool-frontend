import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, Star, Clock, Users, ChevronRight, ChevronDown } from "lucide-react";
import { getDestinationExperiences, getCategoryBySlug, toDisplayCity, toCitySlug } from "@/lib/api/destinations";
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
  { params }: { params: Promise<{ city: string; category: string }> }
): Promise<Metadata> {
  const { city, category } = await params;
  const displayCity = toDisplayCity(city);

  try {
    const cat = await getCategoryBySlug(category);
    const count = (await getDestinationExperiences(displayCity, cat.id, { next: { revalidate: 3600 } })).length;
    const title = `${cat.name} in ${displayCity} — Book Online`;
    const description = `Book ${cat.name.toLowerCase()} in ${displayCity}. ${count > 0 ? `${count} verified experience${count !== 1 ? "s" : ""} available.` : ""} Verified operators, instant booking on WanderPool.`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${BASE_URL}/destinations/${city}/${category}`,
        type: "website",
      },
      twitter: { card: "summary_large_image", title, description },
    };
  } catch {
    return { title: "Experiences" };
  }
}

export default async function CityCategory(
  { params }: { params: Promise<{ city: string; category: string }> }
) {
  const { city, category } = await params;
  const displayCity = toDisplayCity(city);

  let cat;
  try {
    cat = await getCategoryBySlug(category, { next: { revalidate: 3600 } });
  } catch {
    notFound();
  }

  const experiences = await getDestinationExperiences(displayCity, cat.id, { next: { revalidate: 3600 } });

  const prices = experiences.map((e) => Math.round(e.base_price_paise / 100));
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const durations = experiences.map((e) => e.duration_minutes);
  const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;

  // ── FAQ questions — built from real experience data ──────────────────────
  const faqs: { q: string; a: string }[] = [
    {
      q: `How much does ${cat.name} cost in ${displayCity}?`,
      a: prices.length > 1
        ? `Prices for ${cat.name} in ${displayCity} range from ₹${minPrice.toLocaleString("en-IN")} to ₹${maxPrice.toLocaleString("en-IN")} per person, depending on the experience and group size.`
        : prices.length === 1
        ? `${cat.name} in ${displayCity} starts from ₹${minPrice.toLocaleString("en-IN")} per person.`
        : `Contact us for current pricing for ${cat.name} in ${displayCity}.`,
    },
    {
      q: `How long does ${cat.name} last in ${displayCity}?`,
      a: avgDuration > 0
        ? `Most ${cat.name} experiences in ${displayCity} last approximately ${durationLabel(avgDuration)}, though duration varies by operator and package.`
        : `Duration varies by experience. Check individual listing pages for exact timings.`,
    },
    {
      q: `Is ${cat.name} safe in ${displayCity}?`,
      a: `All ${cat.name} operators on WanderPool are verified. We check safety certifications, equipment quality, and guide credentials before listing any experience. We also review guest feedback continuously to maintain quality standards.`,
    },
    {
      q: `What should I bring for ${cat.name} in ${displayCity}?`,
      a: `Requirements vary by experience — check the inclusions section on each listing page. Generally, wear comfortable clothes, carry water, a light snack, and sunscreen. Safety equipment is provided by the operator.`,
    },
    {
      q: `How do I book ${cat.name} in ${displayCity}?`,
      a: `Select an experience from the list below, choose your date and time slot, pick the number of participants, and proceed to checkout. You'll receive an email confirmation within minutes. No advance payment hassle — pay online or opt for partial payment.`,
    },
    {
      q: `Can I cancel my ${cat.name} booking?`,
      a: `Each experience has its own cancellation policy (free cancellation, 50% refund, or non-refundable). The policy is clearly shown on the booking page before you pay. GST is always fully refunded on cancellations.`,
    },
  ];

  // ── JSON-LD ──────────────────────────────────────────────────────────────
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Experiences", item: `${BASE_URL}/experiences` },
      { "@type": "ListItem", position: 3, name: displayCity, item: `${BASE_URL}/destinations/${city}` },
      { "@type": "ListItem", position: 4, name: `${cat.name} in ${displayCity}` },
    ],
  };

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${cat.name} in ${displayCity}`,
    numberOfItems: experiences.length,
    itemListElement: experiences.slice(0, 20).map((exp, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: exp.title,
      url: `${BASE_URL}/experiences/${exp.slug}`,
    })),
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: { "@type": "Answer", text: faq.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />

      <div className="min-h-screen bg-white pt-16">
        {/* Hero */}
        <div className="bg-linear-to-br from-slate-900 via-slate-800 to-primary/80 text-white py-16 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-6 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <Link href="/experiences" className="hover:text-white transition-colors">Experiences</Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <Link href={`/destinations/${city}`} className="hover:text-white transition-colors">{displayCity}</Link>
              <ChevronRight className="h-3 w-3 shrink-0" />
              <span className="text-white">{cat.name}</span>
            </nav>

            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {cat.name} in {displayCity}
            </h1>
            <p className="text-white/80 text-lg max-w-2xl mb-8">
              {experiences.length > 0
                ? `Choose from ${experiences.length} verified ${cat.name.toLowerCase()} experience${experiences.length !== 1 ? "s" : ""} in ${displayCity}. All operators are vetted and certified.`
                : `Explore ${cat.name.toLowerCase()} experiences in ${displayCity} with verified operators and instant booking.`}
            </p>

            {/* Stats */}
            {experiences.length > 0 && (
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-2xl font-bold">{experiences.length}</p>
                  <p className="text-sm text-white/60">Experience{experiences.length !== 1 ? "s" : ""}</p>
                </div>
                {minPrice > 0 && (
                  <div>
                    <p className="text-2xl font-bold">₹{minPrice.toLocaleString("en-IN")}+</p>
                    <p className="text-sm text-white/60">Starting from</p>
                  </div>
                )}
                {avgDuration > 0 && (
                  <div>
                    <p className="text-2xl font-bold">{durationLabel(avgDuration)}</p>
                    <p className="text-sm text-white/60">Avg. duration</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Experience grid */}
          {experiences.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-400 text-lg mb-4">No {cat.name.toLowerCase()} experiences available in {displayCity} yet.</p>
              <Link
                href={`/destinations/${toCitySlug(displayCity)}`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90"
              >
                View all {displayCity} experiences
              </Link>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-5">
                Available Experiences
                <span className="ml-2 text-sm font-normal text-slate-400">({experiences.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
                {experiences.map((exp, i) => (
                  <StaticExperienceCard key={exp.id} exp={exp} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* FAQ Section */}
          <div className="border-t border-slate-100 pt-12">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-500 mb-6">
              Everything you need to know about {cat.name.toLowerCase()} in {displayCity}.
            </p>
            <div className="space-y-0 divide-y divide-slate-100">
              {faqs.map((faq, i) => (
                <details key={i} className="group py-4">
                  <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
                    <h3 className="text-sm font-semibold text-slate-900 group-open:text-primary transition-colors">
                      {faq.q}
                    </h3>
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 group-open:rotate-180 transition-transform" />
                  </summary>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 bg-slate-50 rounded-2xl p-8 text-center border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              More to explore in {displayCity}
            </h2>
            <p className="text-slate-500 mb-5">Browse all adventure experiences across activities.</p>
            <Link
              href={`/destinations/${city}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              All {displayCity} Experiences
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
