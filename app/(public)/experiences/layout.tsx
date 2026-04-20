import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Adventure Experiences",
  description:
    "Discover and book adventure experiences in India — river rafting, trekking, paragliding, camping and more. Verified operators, instant booking in Rishikesh & Uttarakhand.",
  openGraph: {
    title: "Browse Adventure Experiences | WanderPool",
    description:
      "Discover adventure experiences in Rishikesh, Uttarakhand and across India. Verified operators, instant booking.",
    url: "https://wanderpool.com/experiences",
  },
};

export default function ExperiencesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
