import type { MetadataRoute } from "next";
import { toCitySlug } from "@/lib/api/destinations";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
const BASE_URL = "https://wanderpool.com";

const staticRoutes: MetadataRoute.Sitemap = [
  { url: BASE_URL,                         lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
  { url: `${BASE_URL}/experiences`,         lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
  { url: `${BASE_URL}/for-operators`,       lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE_URL}/about`,               lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE_URL}/safety`,              lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  { url: `${BASE_URL}/contact`,             lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
];

interface ExpRow {
  slug: string;
  updated_at: string;
  location_city: string;
  category_id: string;
}

interface CategoryRow {
  id: string;
  slug: string;
  parent_id: string | null;
  is_leaf: boolean;
  is_active: boolean;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    // Fetch experiences and root categories in parallel
    const [expRes, catRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/v1/experiences?limit=1000`, { next: { revalidate: 3600 } }),
      fetch(`${BACKEND_URL}/api/v1/categories`, { next: { revalidate: 3600 } }),
    ]);

    if (!expRes.ok) return staticRoutes;
    const experiences: ExpRow[] = await expRes.json();

    // Build category id→slug map from root categories + their children
    const categorySlugMap = new Map<string, string>();
    if (catRes.ok) {
      const rootCats: CategoryRow[] = await catRes.json();
      rootCats.forEach((c) => categorySlugMap.set(c.id, c.slug));

      // Fetch children for each root; only map leaf categories
      const childResults = await Promise.allSettled(
        rootCats.map((c) =>
          fetch(`${BACKEND_URL}/api/v1/categories/${c.slug}/children`, {
            next: { revalidate: 3600 },
          }).then((r) => (r.ok ? (r.json() as Promise<CategoryRow[]>) : []))
        )
      );
      childResults.forEach((result) => {
        if (result.status === "fulfilled") {
          result.value
            .filter((c) => c.is_leaf && c.is_active)
            .forEach((c) => categorySlugMap.set(c.id, c.slug));
        }
      });

      // Also map root-level leaf categories (if a root is itself a leaf)
      rootCats
        .filter((c) => c.is_leaf && c.is_active)
        .forEach((c) => categorySlugMap.set(c.id, c.slug));
    }

    // Experience pages
    const expRoutes: MetadataRoute.Sitemap = experiences.map((exp) => ({
      url: `${BASE_URL}/experiences/${exp.slug}`,
      lastModified: new Date(exp.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    // Destination city pages — one per unique city
    const cities = [...new Set(experiences.map((e) => e.location_city).filter(Boolean))];
    const cityRoutes: MetadataRoute.Sitemap = cities.map((city) => ({
      url: `${BASE_URL}/destinations/${toCitySlug(city)}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    }));

    // Destination city+category pages — one per unique {city, category_slug} pair
    const cityCategory = new Map<string, { city: string; catSlug: string }>();
    for (const exp of experiences) {
      if (!exp.location_city || !exp.category_id) continue;
      const catSlug = categorySlugMap.get(exp.category_id);
      if (!catSlug) continue;
      const key = `${toCitySlug(exp.location_city)}/${catSlug}`;
      if (!cityCategory.has(key)) {
        cityCategory.set(key, { city: toCitySlug(exp.location_city), catSlug });
      }
    }
    const cityCategoryRoutes: MetadataRoute.Sitemap = [...cityCategory.values()].map(({ city, catSlug }) => ({
      url: `${BASE_URL}/destinations/${city}/${catSlug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    }));

    return [...staticRoutes, ...expRoutes, ...cityRoutes, ...cityCategoryRoutes];
  } catch {
    return staticRoutes;
  }
}
