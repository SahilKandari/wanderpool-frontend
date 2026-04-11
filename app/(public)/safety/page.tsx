import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  Phone,
  CheckCircle2,
  XCircle,
  FileText,
  Waves,
  Wind,
  Mountain,
  ArrowRight,
} from "lucide-react";

export const metadata = { title: "Safety — WanderPool" };

export default function SafetyPage() {
  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero */}
      <div className="bg-slate-900 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <ShieldCheck className="h-3.5 w-3.5" />
            Safety First
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            Your Safety is Our<br />Top Priority
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto">
            Every operator on WanderPool is identity-verified and certified. Here's exactly how we keep you safe.
          </p>
        </div>
      </div>

      {/* Operator vetting */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">How we vet every operator</h2>
        <p className="text-slate-500 mb-8">No operator goes live until all these checks pass:</p>
        <div className="space-y-3">
          {[
            { title: "Government ID verification", desc: "Aadhaar and PAN verified for every operator and solo guide before listing approval." },
            { title: "Bank account verification", desc: "Penny drop verification confirms the operator's bank account is real and linked to their identity." },
            { title: "Activity-specific safety certifications", desc: "Rafting operators must hold AIRI certification. Paragliding operators require APPI or DGCA certification. We verify the original documents." },
            { title: "Minimum 5 real photos", desc: "We require genuine photos of actual activities. Stock imagery is not accepted." },
            { title: "Video verification call", desc: "Every new operator completes a 10-minute video call with our team before going live." },
            { title: "Digital operator agreement", desc: "Operators sign a digital agreement committing to safety standards, price parity, and customer care." },
          ].map(({ title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 text-sm">{title}</p>
                <p className="text-sm text-slate-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ongoing monitoring */}
      <div className="bg-slate-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Ongoing monitoring</h2>
          <p className="text-slate-500 mb-8">Operator quality is tracked continuously — not just at signup.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              {
                icon: AlertTriangle,
                color: "text-amber-500",
                bg: "bg-amber-50 border-amber-100",
                title: "Yellow Flag",
                desc: "Operator rating drops below 3.8★ or 3+ complaints in 30 days. Listing is demoted in search results and operator is notified.",
              },
              {
                icon: XCircle,
                color: "text-red-500",
                bg: "bg-red-50 border-red-100",
                title: "Red Flag",
                desc: "Rating drops below 3.0★ or a safety complaint is received. All listings are paused immediately pending review.",
              },
              {
                icon: ShieldCheck,
                color: "text-slate-600",
                bg: "bg-slate-100 border-slate-200",
                title: "Permanent Ban",
                desc: "Fraud, safety incident, or third red flag results in permanent removal from the platform and payout hold.",
              },
            ].map(({ icon: Icon, color, bg, title, desc }) => (
              <div key={title} className={`p-5 rounded-2xl border ${bg}`}>
                <Icon className={`h-6 w-6 ${color} mb-3`} />
                <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per activity safety */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Activity-specific safety standards</h2>
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Waves className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900">River Rafting</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> AIRI (Adventure International Rafting Institute) certification required for all guides</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Life jackets, helmets, and paddles provided for all participants</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Grade of rapids disclosed on listing — no surprises</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Safety briefing mandatory before every trip</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Weather-dependent — trips cancelled in unsafe conditions with full refunds</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <Wind className="h-5 w-5 text-sky-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Paragliding</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> APPI or DGCA certification required for all pilots</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Equipment checked before every flight</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Weight limits strictly enforced as per equipment specs</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Flights cancelled in adverse weather with full refunds</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Mountain className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-slate-900">Trekking & Camping</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Experienced, locally certified guides required</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Altitude restrictions and fitness requirements disclosed on listing</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> First aid kit mandatory on all treks</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" /> Route details and emergency contacts shared before departure</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-slate-50 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Verified reviews only</h2>
          <p className="text-slate-500 mb-6">
            Only customers who have completed a booking on WanderPool can leave a review. No anonymous reviews, no fake ratings. All 1–2 star reviews trigger an immediate admin alert and response within 2 hours.
          </p>
          <div className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-xl">
            <FileText className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              Operators can reply publicly to reviews (max 300 characters). Incentivised reviews are strictly banned. We investigate all suspicious review patterns.
            </p>
          </div>
        </div>
      </div>

      {/* Emergency & support */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">In case something goes wrong</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl">
            <Phone className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">On-site emergency — contact your guide or agency directly</h3>
              <p className="text-sm text-slate-600">
                For any on-site emergency, your first call should be to your assigned guide or the agency. Their contact details are shared with you at the time of booking confirmation. For non-urgent support, email us at hello@wanderpool.in — we respond within 2 hours for complaints.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-100 rounded-2xl">
            <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Operator no-show</h3>
              <p className="text-sm text-slate-600">
                If your operator doesn't show up, email us at hello@wanderpool.in immediately. You will receive a full refund within 24 hours. No questions asked.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
            <ShieldCheck className="h-6 w-6 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Weather cancellations</h3>
              <p className="text-sm text-slate-600">
                If an activity is cancelled for safety reasons due to weather or other uncontrollable conditions, you receive a full refund regardless of the cancellation policy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-slate-900 py-14 px-4 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Adventure safely with WanderPool</h2>
        <p className="text-slate-400 text-sm mb-6">Every experience is vetted. Every operator is verified.</p>
        <Link
          href="/experiences"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
        >
          Browse experiences <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
