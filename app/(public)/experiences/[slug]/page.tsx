import type { Metadata } from "next";
import { getExperienceBySlug } from "@/lib/api/experiences";
import { toCitySlug } from "@/lib/api/destinations";
import ExperienceDetailClient from "./ExperienceDetailClient";

const BASE_URL = "https://wanderpool.com";

const POLICY_LABELS: Record<string, string> = {
  free_48h: "Free cancellation up to 48 hours before the activity. No refund if cancelled within 48 hours.",
  half_refund_24h: "50% refund if cancelled at least 24 hours before the activity. No refund within 24 hours.",
  no_refund: "This experience is non-refundable.",
};

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const exp = await getExperienceBySlug(slug);
    const titleWithCity = `${exp.title} in ${exp.location_city}`;
    const location = [exp.location_name, exp.location_city, exp.location_state]
      .filter(Boolean)
      .join(", ");
    const priceStr = `from ₹${Math.round(exp.base_price_paise / 100).toLocaleString("en-IN")}`;
    const desc = `${exp.description.slice(0, 130)}. ${location}. Book online ${priceStr}.`;
    const image = exp.cover_image_url ?? `${BASE_URL}/opengraph-image`;

    return {
      title: titleWithCity,
      description: desc,
      openGraph: {
        title: titleWithCity,
        description: desc,
        url: `${BASE_URL}/experiences/${slug}`,
        images: [{ url: image, width: 1200, height: 630, alt: titleWithCity }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: titleWithCity,
        description: desc,
        images: [image],
      },
    };
  } catch {
    return { title: "Experience" };
  }
}

export default async function ExperiencePage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const scripts: { key: string; ld: unknown }[] = [];

  try {
    const exp = await getExperienceBySlug(slug);
    const price = Math.round(exp.base_price_paise / 100);
    const titleWithCity = `${exp.title} in ${exp.location_city}`;

    // ── Product schema ──────────────────────────────────────────────────────
    const product: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: titleWithCity,
      description: exp.description,
      image: exp.cover_image_url,
      url: `${BASE_URL}/experiences/${exp.slug}`,
      offers: {
        "@type": "Offer",
        price: price.toFixed(2),
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
      },
      brand: { "@type": "Organization", name: exp.agency_name ?? "WanderPool" },
    };
    if (exp.review_count > 0) {
      product.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: exp.avg_rating.toFixed(1),
        reviewCount: exp.review_count,
      };
    }
    scripts.push({ key: "product", ld: product });

    // ── FAQPage schema ──────────────────────────────────────────────────────
    const faqItems: { name: string; acceptedAnswer: { "@type": string; text: string } }[] = [];

    if (exp.inclusions?.length > 0) {
      faqItems.push({
        name: `What is included in the ${exp.title}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: exp.inclusions.join(", ") + ".",
        },
      });
    }

    faqItems.push({
      name: `What is the cancellation policy for ${exp.title}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: POLICY_LABELS[exp.cancellation_policy] ?? POLICY_LABELS.free_48h,
      },
    });

    faqItems.push({
      name: `How many people can join the ${exp.title}?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `This experience accommodates ${exp.min_participants} to ${exp.max_participants} participants.`,
      },
    });

    const durationHours = Math.round(exp.duration_minutes / 60);
    faqItems.push({
      name: `How long does the ${exp.title} last?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: exp.duration_minutes < 60
          ? `The experience lasts approximately ${exp.duration_minutes} minutes.`
          : `The experience lasts approximately ${durationHours} hour${durationHours > 1 ? "s" : ""}.`,
      },
    });

    faqItems.push({
      name: `Where does the ${exp.title} take place?`,
      acceptedAnswer: {
        "@type": "Answer",
        text: `This experience is located in ${exp.location_city}, ${exp.location_state}, India.${exp.meeting_point ? ` Meeting point: ${exp.meeting_point}.` : ""}`,
      },
    });

    scripts.push({
      key: "faq",
      ld: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.name,
          acceptedAnswer: item.acceptedAnswer,
        })),
      },
    });

    // ── BreadcrumbList schema ───────────────────────────────────────────────
    scripts.push({
      key: "breadcrumb",
      ld: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Experiences", item: `${BASE_URL}/experiences` },
          {
            "@type": "ListItem",
            position: 3,
            name: exp.location_city,
            item: `${BASE_URL}/destinations/${toCitySlug(exp.location_city)}`,
          },
          { "@type": "ListItem", position: 4, name: titleWithCity },
        ],
      },
    });
  } catch {
    // JSON-LD is non-critical; client component handles 404
  }

  return (
    <>
      {scripts.map(({ key, ld }) => (
        <script
          key={key}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
        />
      ))}
      <ExperienceDetailClient params={params} />
    </>
  );
}
