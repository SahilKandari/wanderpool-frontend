import Link from "next/link";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

export const metadata = { title: "Refund Policy — WanderPool" };

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero */}
      <div className="bg-slate-900 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-slate-400 text-sm mb-2">Last updated: April 17, 2025</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Refund &amp; Cancellation Policy</h1>
          <p className="text-slate-400 leading-relaxed">
            We want your adventure to go perfectly. If plans change, here&apos;s exactly how cancellations and refunds work on WanderPool.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">

        {/* Cancellation tiers */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Cancellation policies</h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            Every experience on WanderPool operates under one of three cancellation policies. The applicable policy is clearly shown on the experience page and at checkout before you pay.
          </p>

          <div className="space-y-4">
            {/* Tier 1 */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <h3 className="font-semibold text-slate-900">Free cancellation — up to 48 hours before</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed ml-7">
                Cancel at least 48 hours before the scheduled activity start time and receive a <strong>full refund</strong> of the amount you paid.
              </p>
              <p className="text-xs text-slate-500 mt-2 ml-7">Cancellations less than 48 hours before the start time receive no refund.</p>
            </div>

            {/* Tier 2 */}
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                <h3 className="font-semibold text-slate-900">50% refund — up to 24 hours before</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed ml-7">
                Cancel at least 24 hours before the scheduled start time and receive a <strong>50% refund</strong> of the amount you paid.
              </p>
              <p className="text-xs text-slate-500 mt-2 ml-7">Cancellations less than 24 hours before the start time receive no refund.</p>
            </div>

            {/* Tier 3 */}
            <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                <h3 className="font-semibold text-slate-900">Non-refundable</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed ml-7">
                This experience does not offer refunds for cancellations. The booking fee is non-refundable once payment is confirmed.
              </p>
            </div>
          </div>
        </section>

        {/* How to cancel */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">How to cancel a booking</h2>
          <div className="space-y-3">
            {[
              { step: "1", text: "Log in to WanderPool and go to My Bookings." },
              { step: "2", text: "Find the booking you wish to cancel and tap View Details." },
              { step: "3", text: "Tap Cancel Booking. Confirm the cancellation on the next screen." },
              { step: "4", text: "You will receive an email confirming the cancellation and the refund amount (if eligible)." },
            ].map(({ step, text }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">{step}</span>
                <p className="text-slate-600 text-sm leading-relaxed pt-1">{text}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-sm mt-4">
            Need help? Email <a href="mailto:support@wanderpool.com" className="text-primary hover:underline">support@wanderpool.com</a> and we will assist you.
          </p>
        </section>

        {/* Refund timeline */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Refund timeline</h2>
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
            <p className="text-slate-600 leading-relaxed">
              Approved refunds are processed within <strong>5–7 business days</strong> to your original payment method (credit/debit card or UPI) via Razorpay. The exact credit date depends on your bank&apos;s processing times.
            </p>
            <p className="text-slate-600 leading-relaxed mt-3">
              You will receive an email from WanderPool when the refund is initiated. If you do not receive the refund within 7 business days, contact your bank and share the Razorpay refund reference from your confirmation email.
            </p>
          </div>
        </section>

        {/* Operator no-show */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Operator cancellation or no-show</h2>
          <p className="text-slate-600 leading-relaxed">
            If an Operator cancels your booking or fails to show up, WanderPool will issue a <strong>full refund</strong> of the amount you paid, regardless of the experience&apos;s cancellation policy. Refunds in this case are processed within <strong>24 hours</strong> of the confirmed no-show or cancellation.
          </p>
          <p className="text-slate-600 leading-relaxed mt-3">
            Please contact <a href="mailto:support@wanderpool.com" className="text-primary hover:underline">support@wanderpool.com</a> immediately if your Operator does not show up. Do not leave the meeting point without notifying us.
          </p>
        </section>

        {/* Weather & force majeure */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Weather and force majeure cancellations</h2>
          <p className="text-slate-600 leading-relaxed">
            Activities cancelled by the Operator due to unsafe weather conditions, natural disasters, government orders, or other force majeure events qualify for a <strong>full refund</strong>, regardless of the cancellation policy. The Operator must notify WanderPool support to trigger such a refund.
          </p>
        </section>

        {/* Disputes */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Disputes</h2>
          <p className="text-slate-600 leading-relaxed">
            If you believe your booking did not match the description, or there was a safety issue, contact us within <strong>48 hours</strong> of the activity end time at <a href="mailto:support@wanderpool.com" className="text-primary hover:underline">support@wanderpool.com</a>. We will investigate and respond within 2 business days. WanderPool&apos;s decision in disputes is final.
          </p>
          <p className="text-slate-600 leading-relaxed mt-3">
            Initiating a chargeback with your bank before contacting WanderPool support may result in suspension of your account.
          </p>
        </section>

        {/* Partial payment */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Partial payment (booking fee) refunds</h2>
          <p className="text-slate-600 leading-relaxed">
            If you paid only the booking fee (partial payment option), the refund amount is calculated as a percentage of the booking fee paid — not the full activity price. The remaining balance due at the venue is not collected by WanderPool and is not subject to our refund process.
          </p>
        </section>

        {/* Contact */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Need help with a refund?</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Email <a href="mailto:support@wanderpool.com" className="text-primary hover:underline">support@wanderpool.com</a> with your booking reference. We respond within 15 minutes during support hours (7 am – 8 pm IST).
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="text-sm text-primary font-medium hover:underline">Contact support →</Link>
            <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-700">Terms & Conditions</Link>
            <Link href="/privacy-policy" className="text-sm text-slate-500 hover:text-slate-700">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
