import Link from "next/link";

export const metadata = { title: "Terms & Conditions" };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero */}
      <div className="bg-slate-900 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-slate-400 text-sm mb-2">Last updated: April 17, 2025</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Terms &amp; Conditions</h1>
          <p className="text-slate-400 leading-relaxed">
            Please read these terms carefully before using WanderPool. By creating an account or making a booking, you agree to these terms.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">

        {/* 1 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. About WanderPool</h2>
          <p className="text-slate-600 leading-relaxed">
            WanderPool is an online marketplace that connects adventure travellers with independent local activity operators (&quot;Operators&quot;) across India, starting with Uttarakhand. WanderPool is a technology intermediary only — we do not employ guides, own equipment, or deliver the adventure activities ourselves. The contractual relationship for the activity is between you (the customer) and the Operator.
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Eligibility</h2>
          <p className="text-slate-600 leading-relaxed">
            You must be at least 18 years old to create an account and make bookings on WanderPool. By registering, you confirm that you are of legal age and that all information you provide is accurate and truthful.
          </p>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Bookings and payments</h2>
          <div className="space-y-3 text-slate-600 leading-relaxed">
            <p>All prices displayed are in Indian Rupees (INR) and are inclusive of all platform charges. Activity-specific taxes may apply and will be shown at checkout.</p>
            <p>Payments are processed securely by Razorpay. WanderPool does not store card or bank account credentials. Your payment is subject to Razorpay&apos;s payment processing terms.</p>
            <p>A booking is confirmed only after successful payment verification. You will receive an email confirmation with your booking reference.</p>
            <p>WanderPool charges a platform service fee as a percentage of the booking value. This fee is deducted before the Operator receives their payout and is non-refundable except where WanderPool is at fault.</p>
          </div>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Cancellations and refunds</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            Each experience has one of three cancellation policies, clearly shown before you book:
          </p>
          <div className="space-y-3">
            {[
              { title: "Free cancellation (48 hours)", desc: "Full refund if you cancel at least 48 hours before the scheduled start time." },
              { title: "Partial refund (24 hours)", desc: "50% refund if you cancel at least 24 hours before the scheduled start time. No refund for cancellations within 24 hours." },
              { title: "Non-refundable", desc: "No refund for cancellations after booking." },
            ].map(({ title, desc }) => (
              <div key={title} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="font-medium text-slate-800 text-sm mb-1">{title}</p>
                <p className="text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-600 leading-relaxed mt-3">
            Refunds for eligible cancellations are processed within 5–7 business days to your original payment method via Razorpay. See our <Link href="/refund-policy" className="text-primary hover:underline">Refund Policy</Link> for full details.
          </p>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Customer responsibilities</h2>
          <ul className="space-y-2 text-slate-600 leading-relaxed list-disc list-inside">
            <li>Arrive at the meeting point on time. Late arrivals may result in forfeiture of the booking without refund.</li>
            <li>Disclose any relevant health conditions, fitness limitations, or medical information to the Operator before the activity.</li>
            <li>Follow all safety instructions given by the Operator and their guides.</li>
            <li>Ensure all participants meet any minimum age or health requirements listed in the experience description.</li>
            <li>Not engage in behaviour that endangers yourself, other participants, or the Operator&apos;s team.</li>
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Operator responsibilities</h2>
          <p className="text-slate-600 leading-relaxed">
            Operators listed on WanderPool have agreed to a separate Operator Agreement and are responsible for:
          </p>
          <ul className="mt-3 space-y-2 text-slate-600 leading-relaxed list-disc list-inside">
            <li>Delivering the experience as described in their listing</li>
            <li>Maintaining valid safety certifications required for their activity type</li>
            <li>Providing appropriate safety equipment and briefing</li>
            <li>Pricing parity — not offering the same experience at a lower price on any other platform</li>
            <li>Timely communication with booked customers</li>
          </ul>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Reviews</h2>
          <p className="text-slate-600 leading-relaxed">
            Only customers who have completed a booked activity may submit a review for that experience. Reviews must be honest and based on personal experience. Incentivised reviews (paid, gifted, or coerced) are strictly prohibited and will result in account suspension. WanderPool reserves the right to remove reviews that violate these terms.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Prohibited conduct</h2>
          <ul className="space-y-2 text-slate-600 leading-relaxed list-disc list-inside">
            <li>Attempting to circumvent WanderPool&apos;s platform to book directly with an Operator found on WanderPool</li>
            <li>Providing false information during registration or KYC verification</li>
            <li>Submitting fraudulent bookings or chargebacks</li>
            <li>Using the platform to harass, threaten, or defame any user or Operator</li>
            <li>Scraping, crawling, or reproducing WanderPool content without permission</li>
          </ul>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Limitation of liability</h2>
          <p className="text-slate-600 leading-relaxed mb-3">
            WanderPool is a marketplace platform and is not responsible for the quality, safety, or legality of the activities delivered by Operators. Our maximum liability to you for any claim arising from use of the platform is limited to the amount you paid for the booking in question.
          </p>
          <p className="text-slate-600 leading-relaxed">
            Adventure activities carry inherent risks. By booking an activity, you acknowledge these risks and agree that WanderPool shall not be liable for any injury, death, loss, or damage arising from participation in an activity, except where caused by WanderPool&apos;s own gross negligence.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Intellectual property</h2>
          <p className="text-slate-600 leading-relaxed">
            All content on WanderPool — including the brand, logo, design, code, and text — is the property of WanderPool and may not be reproduced without written permission. Operators retain ownership of their listing photos and descriptions but grant WanderPool a license to display them on the platform.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Account termination</h2>
          <p className="text-slate-600 leading-relaxed">
            WanderPool reserves the right to suspend or terminate any account that violates these terms, engages in fraudulent activity, or harms the platform or its users. You may delete your account at any time via Account Settings.
          </p>
        </section>

        {/* 12 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">12. Governing law</h2>
          <p className="text-slate-600 leading-relaxed">
            These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts of Uttarakhand, India.
          </p>
        </section>

        {/* 13 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">13. Changes to these terms</h2>
          <p className="text-slate-600 leading-relaxed">
            We may update these terms from time to time. Material changes will be communicated via email. Continued use of WanderPool after the updated terms are published constitutes acceptance.
          </p>
        </section>

        {/* Contact */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Questions?</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Contact us at <a href="mailto:support@wanderpool.com" className="text-primary hover:underline">support@wanderpool.com</a>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/refund-policy" className="text-sm text-primary font-medium hover:underline">Refund Policy →</Link>
            <Link href="/privacy-policy" className="text-sm text-slate-500 hover:text-slate-700">Privacy Policy</Link>
            <Link href="/contact" className="text-sm text-slate-500 hover:text-slate-700">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
