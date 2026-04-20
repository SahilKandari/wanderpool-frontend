import type { MetadataRoute } from "next";

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/experiences?limit=1000`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return staticRoutes;
    const experiences: Array<{ slug: string; updated_at: string }> = await res.json();
    const expRoutes: MetadataRoute.Sitemap = experiences.map(exp => ({
      url: `${BASE_URL}/experiences/${exp.slug}`,
      lastModified: new Date(exp.updated_at),
      changeFrequency: "weekly",
      priority: 0.8,
    }));
    return [...staticRoutes, ...expRoutes];
  } catch {
    return staticRoutes;
  }
}
