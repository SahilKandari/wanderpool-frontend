import Link from "next/link";
import { Mountain, Target, Heart, Users, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "About Us",
  description: "WanderPool is India's adventure experience marketplace. We connect travelers with verified local operators for rafting, trekking, paragliding and more in Uttarakhand.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero */}
      <div className="bg-slate-900 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary border border-primary/30 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Mountain className="h-3.5 w-3.5" />
            Our Story
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            India's Adventure<br />Experience Marketplace
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            WanderPool connects adventure seekers with the best local operators across Uttarakhand — making it easy to discover, book, and experience the Himalayas.
          </p>
        </div>
      </div>

      {/* Mission */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Why we built WanderPool</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              India's adventure tourism is booming — but finding reliable, vetted local operators has always been a challenge. Travellers end up on aggregator sites with outdated listings, inflated prices, and no trust signals.
            </p>
            <p className="text-slate-600 leading-relaxed mb-4">
              On the other side, small local businesses — rafting operators in Rishikesh, trekking guides in Mussoorie — struggle to reach customers digitally. They rely on word-of-mouth and middlemen who take unfair cuts.
            </p>
            <p className="text-slate-600 leading-relaxed">
              WanderPool fixes this. A transparent, fair marketplace where operators keep 85–88% of every booking and travellers get authentic experiences at honest prices.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Target, label: "Mission", desc: "Make adventure accessible and operators sustainable" },
              { icon: Heart, label: "Values", desc: "Transparency, safety, and fair economics" },
              { icon: Users, label: "Community", desc: "Built with operators, for adventurers" },
              { icon: MapPin, label: "Focus", desc: "Uttarakhand first, then all of India" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-slate-50 rounded-2xl p-5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <p className="font-semibold text-slate-900 text-sm mb-1">{label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">How WanderPool works</h2>
          <p className="text-slate-500 text-center mb-10">From discovery to adventure in three steps</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "01", title: "Discover", desc: "Browse verified experiences across Rishikesh, Mussoorie, and more — filtered by activity type, date, and group size." },
              { step: "02", title: "Book safely", desc: "Secure Razorpay checkout. Instant email confirmation. Transparent cancellation policies — no hidden charges." },
              { step: "03", title: "Adventure awaits", desc: "Your guide contacts you 48 hours before. Show up ready. WanderPool support is available via email through your entire trip." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-white rounded-2xl p-6 border border-slate-100">
                <span className="text-3xl font-black text-primary/20">{step}</span>
                <h3 className="font-bold text-slate-900 mt-2 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust stats */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { num: "Uttarakhand", label: "First market" },
            { num: "Vetted", label: "All operators" },
            { num: "15 min", label: "Support response" },
            { num: "100%", label: "Transparent pricing" },
          ].map(({ num, label }) => (
            <div key={label} className="bg-slate-50 rounded-2xl p-5">
              <p className="text-2xl font-bold text-primary">{num}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quality commitment */}
      <div className="bg-primary/5 border-t border-primary/10 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">Our quality commitment</h2>
          <div className="space-y-3">
            {[
              "Every operator is identity-verified with Aadhaar/PAN before going live",
              "Safety certifications required for water and aerial activities (AIRI, APPI/DGCA)",
              "Health score monitoring — low-rated operators are flagged and paused automatically",
              "1–2 star reviews trigger immediate admin review within 2 hours",
              "Weather-related cancellations are always fully refunded",
              "Operators must maintain real photos — no stock imagery allowed",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-slate-600 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to explore?</h2>
        <p className="text-slate-500 mb-6">Hundreds of adventures are waiting for you in Uttarakhand.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/experiences"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Browse experiences <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/for-operators"
            className="inline-flex items-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors"
          >
            List your activity
          </Link>
        </div>
      </div>
    </div>
  );
}
