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

          {/* Non-refundable booking fee notice */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-slate-900 mb-1">Non-refundable booking fee (12–15%)</h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  Regardless of the cancellation policy, WanderPool retains a <strong>non-refundable booking fee of 12–15%</strong> of the activity price on all customer-initiated cancellations. This fee covers payment processing, platform costs, and service charges.
                </p>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  The refund percentages below apply to the <strong>remaining amount after deducting the booking fee</strong>.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Tier 1 */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <h3 className="font-semibold text-slate-900">Free cancellation — up to 48 hours before</h3>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed ml-7">
                Cancel at least 48 hours before the scheduled activity start time and receive a refund of the full amount you paid, <strong>minus the non-refundable booking fee (12–15%)</strong>.
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
                Cancel at least 24 hours before the scheduled start time and receive a <strong>50% refund</strong> of the amount paid after deducting the non-refundable booking fee (12–15%).
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
                This experience does not offer refunds for cancellations. The entire amount paid is non-refundable once payment is confirmed.
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
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Operator or WanderPool cancellation</h2>
          <p className="text-slate-600 leading-relaxed">
            If an operator cancels your booking, fails to show up, or WanderPool cancels the booking on your behalf (e.g. force majeure, safety reasons), you will receive a <strong>complete refund of the full amount paid — including the booking fee</strong>, regardless of the experience&apos;s cancellation policy. This exception does not apply to customer-initiated cancellations.
          </p>
          <p className="text-slate-600 leading-relaxed mt-3">
            Operator no-show refunds are processed within <strong>24 hours</strong>. Please contact <a href="mailto:support@wanderpool.com" className="text-primary hover:underline">support@wanderpool.com</a> immediately if your operator does not show up. Do not leave the meeting point without notifying us first.
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
          <h2 className="text-xl font-semibold text-slate-900 mb-3">Partial payment (booking fee only)</h2>
          <p className="text-slate-600 leading-relaxed">
            If you chose the partial payment option (paying only the booking fee upfront), the amount you paid <strong>equals the non-refundable booking fee</strong>. This means customer-initiated cancellations will result in <strong>no refund</strong> regardless of the experience&apos;s cancellation policy — since the booking fee is always retained by WanderPool.
          </p>
          <p className="text-slate-600 leading-relaxed mt-3">
            However, if the operator or WanderPool cancels the booking, the full booking fee paid will be refunded to you.
          </p>
          <p className="text-slate-600 leading-relaxed mt-3">
            The remaining balance due at the venue is paid directly to the guide in cash and is not handled by WanderPool.
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
