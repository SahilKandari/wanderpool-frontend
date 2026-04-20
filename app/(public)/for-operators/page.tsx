import Link from "next/link";
import {
  TrendingUp,
  ShieldCheck,
  Smartphone,
  IndianRupee,
  Star,
  CheckCircle2,
  ArrowRight,
  Users,
  Calendar,
  BarChart3,
} from "lucide-react";

export const metadata = {
  title: "List Your Adventure Business",
  description: "Join WanderPool as a verified operator. List your rafting, trekking, or adventure experiences — get bookings, manage slots, and receive payouts within 3 days of activity completion.",
};

export default function ForOperatorsPage() {
  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero */}
      <div className="bg-slate-900 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <TrendingUp className="h-3.5 w-3.5" />
            Grow your business
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            Reach More Customers.<br />Keep More Earnings.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto">
            WanderPool is India's premier adventure marketplace. List your experiences, manage bookings, and grow your business — with zero setup cost and transparent payouts.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/agency/register"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Get started — it's free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-slate-600 text-slate-300 rounded-xl font-semibold text-sm hover:bg-slate-800 transition-colors"
            >
              Talk to our team
            </Link>
          </div>
        </div>
      </div>

      {/* Key numbers */}
      <div className="border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          {[
            { num: "85–88%", label: "Payout per booking" },
            { num: "₹0", label: "Setup fee" },
            { num: "3 days", label: "Payout after activity" },
            { num: "15 min", label: "Support response time" },
          ].map(({ num, label }) => (
            <div key={label}>
              <p className="text-2xl font-bold text-primary">{num}</p>
              <p className="text-sm text-slate-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">Everything you need to run your business</h2>
        <p className="text-slate-500 text-center mb-10">Built specifically for India's adventure operators</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: IndianRupee,
              title: "Transparent payouts",
              desc: "You see exactly what you earn per booking. No hidden fees. 85–88% of every booking goes directly to you within 3 days of activity completion.",
            },
            {
              icon: Smartphone,
              title: "Email notifications (WhatsApp coming soon)",
              desc: "Booking confirmations and customer notifications go out via email. WhatsApp messaging is on our roadmap — stay tuned.",
            },
            {
              icon: Calendar,
              title: "Smart slot management",
              desc: "Create recurring weekly slots or one-off dates. Set capacity per slot. Block dates when you're unavailable. Manage everything from your dashboard.",
            },
            {
              icon: Users,
              title: "Guide management",
              desc: "Add your guides as sub-operators. Assign bookings to specific guides. Each guide gets their own login and sees only their assigned trips.",
            },
            {
              icon: BarChart3,
              title: "Earnings dashboard",
              desc: "Track weekly payouts, booking counts, and revenue trends. Filter by date range. Download earnings history.",
            },
            {
              icon: Star,
              title: "Reviews & reputation",
              desc: "Only verified customers who completed your experience can leave reviews. You can reply publicly. Low-quality reviews are flagged for admin review.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How onboarding works */}
      <div className="bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-3">Getting listed in 4 steps</h2>
          <p className="text-slate-500 text-center mb-10">Takes less than 30 minutes to complete your profile</p>
          <div className="space-y-4">
            {[
              { step: 1, title: "Create your account", desc: "Register your business — solo operator or multi-guide agency. Takes 2 minutes." },
              { step: 2, title: "Complete identity & banking KYC", desc: "Upload Aadhaar, PAN, and bank details for fast payouts. Required by Indian regulations." },
              { step: 3, title: "Add safety certifications", desc: "Water and aerial activities require certifications (AIRI for rafting, APPI/DGCA for paragliding). Upload once, valid ongoing." },
              { step: 4, title: "Get verified and go live", desc: "Our team reviews your profile within 48 hours. Once approved, your listings are live and accepting bookings." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4 bg-white rounded-2xl p-5 border border-slate-100">
                <div className="h-10 w-10 rounded-full bg-primary text-white font-bold flex items-center justify-center shrink-0 text-sm">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What we need */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center">What we look for in operators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            "Valid Aadhaar and PAN",
            "Bank account for payout (penny drop verified)",
            "Safety certifications for relevant activities",
            "Minimum 5 real photos of your experience",
            "10-minute video verification call with our team",
            "Signed digital operator agreement",
            "Commitment to price parity (no cheaper listings elsewhere)",
            "Active email address for customer communication",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Safety */}
      <div className="bg-emerald-50 border-t border-emerald-100 py-12 px-4">
        <div className="max-w-3xl mx-auto flex items-start gap-4">
          <ShieldCheck className="h-8 w-8 text-emerald-600 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-emerald-900 mb-2">Safety first — always</h3>
            <p className="text-sm text-emerald-800 leading-relaxed">
              WanderPool has a zero-tolerance policy for safety violations. Operators who receive safety complaints have their listings paused immediately pending investigation. We take customer safety as seriously as you do — it's why customers trust our platform.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to grow your bookings?</h2>
        <p className="text-slate-500 mb-6">Join WanderPool and start reaching thousands of adventure seekers today.</p>
        <Link
          href="/agency/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          Register as an operator — free <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="text-xs text-slate-400 mt-3">No setup fees · No monthly subscriptions until you scale</p>
      </div>
    </div>
  );
}
