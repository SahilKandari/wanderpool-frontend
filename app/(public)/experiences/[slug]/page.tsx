import type { Metadata } from "next";
import { getExperienceBySlug } from "@/lib/api/experiences";
import ExperienceDetailClient from "./ExperienceDetailClient";

const BASE_URL = "https://wanderpool.com";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  try {
    const exp = await getExperienceBySlug(slug);
    const location = [exp.location_name, exp.location_city, exp.location_state]
      .filter(Boolean)
      .join(", ");
    const priceStr = `from ₹${Math.round(exp.base_price_paise / 100).toLocaleString("en-IN")}`;
    const desc = `${exp.description.slice(0, 130)}. ${location}. Book online ${priceStr}.`;
    const image = exp.cover_image_url ?? `${BASE_URL}/opengraph-image`;

    return {
      title: exp.title,
      description: desc,
      openGraph: {
        title: exp.title,
        description: desc,
        url: `${BASE_URL}/experiences/${slug}`,
        images: [{ url: image, width: 1200, height: 630, alt: exp.title }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: exp.title,
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

  // Fetch is deduplicated by Next.js with the generateMetadata call above
  let jsonLd: string | null = null;
  try {
    const exp = await getExperienceBySlug(slug);
    const structured: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: exp.title,
      description: exp.description,
      image: exp.cover_image_url,
      url: `${BASE_URL}/experiences/${exp.slug}`,
      offers: {
        "@type": "Offer",
        price: (exp.base_price_paise / 100).toFixed(2),
        priceCurrency: "INR",
        availability: "https://schema.org/InStock",
      },
      brand: { "@type": "Organization", name: exp.agency_name ?? "WanderPool" },
    };
    if (exp.review_count > 0) {
      structured.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: exp.avg_rating.toFixed(1),
        reviewCount: exp.review_count,
      };
    }
    jsonLd = JSON.stringify(structured);
  } catch {
    // JSON-LD is non-critical; client component handles 404
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      <ExperienceDetailClient params={params} />
    </>
  );
}
