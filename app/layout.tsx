import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { AuthProvider } from "@/lib/providers/AuthProvider";
import { NotificationProvider } from "@/lib/providers/NotificationProvider";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://wanderpool.com"),
  title: {
    default: "WanderPool — Adventure Experiences in India",
    template: "%s | WanderPool",
  },
  description: "Book verified adventure experiences in India — river rafting, trekking, paragliding, camping and more. Instant booking, verified operators, best prices in Rishikesh & Uttarakhand.",
  keywords: ["adventure experiences India", "river rafting Rishikesh", "trekking Uttarakhand", "paragliding booking", "adventure sports booking India", "WanderPool"],
  authors: [{ name: "WanderPool", url: "https://wanderpool.com" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://wanderpool.com",
    siteName: "WanderPool",
    title: "WanderPool — Adventure Experiences in India",
    description: "Book verified adventure experiences in India — river rafting, trekking, paragliding and more. Instant booking, verified operators.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WanderPool — Adventure Experiences in India",
    description: "Book verified adventure experiences — rafting, trekking, paragliding. Instant booking.",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

const orgJsonLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "WanderPool",
  url: "https://wanderpool.com",
  logo: "https://wanderpool.com/icon.svg",
  description: "Adventure experience marketplace for India",
  areaServed: "India",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    url: "https://wanderpool.com/contact",
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geist.variable} ${playfair.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground" suppressHydrationWarning>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgJsonLd }} />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""}>
          <QueryProvider>
            <AuthProvider>
              <NotificationProvider>
                {children}
                <Toaster richColors position="top-right" />
                <Analytics />
              </NotificationProvider>
            </AuthProvider>
          </QueryProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
