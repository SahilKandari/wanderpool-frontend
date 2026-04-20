import Link from "next/link";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero */}
      <div className="bg-slate-900 py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-slate-400 text-sm mb-2">Last updated: April 17, 2025</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-slate-400 leading-relaxed">
            WanderPool is committed to protecting your personal information. This policy explains what we collect, why we collect it, and how we use it.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">

        {/* 1 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Who we are</h2>
          <p className="text-slate-600 leading-relaxed">
            WanderPool is an online marketplace for adventure travel experiences, operated from India, initially serving Uttarakhand. We connect travellers with local activity operators. When this policy says &quot;WanderPool&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;, it refers to WanderPool.
          </p>
          <p className="text-slate-600 leading-relaxed mt-3">
            Contact: <a href="mailto:support@wanderpool.com" className="text-primary hover:underline">support@wanderpool.com</a>
          </p>
        </section>

        {/* 2 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Information we collect</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <div>
              <p className="font-medium text-slate-800 mb-1">Account information</p>
              <p>When you register as a customer or operator, we collect your name, email address, phone number, and password (stored as a secure hash).</p>
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-1">Booking information</p>
              <p>When you book an experience, we collect participant counts, selected dates and time slots, and booking preferences.</p>
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-1">Payment information</p>
              <p>Payments are processed by Razorpay. WanderPool does not store your card numbers, CVV, or bank account credentials. We receive a payment confirmation reference from Razorpay after a successful transaction.</p>
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-1">Operator KYC documents</p>
              <p>Operators are required to submit identity documents (Aadhaar, PAN), bank account details, and safety certifications. These are stored securely and used solely for verification purposes.</p>
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-1">Usage data</p>
              <p>We collect standard web server logs (IP address, browser type, pages visited, timestamps) to operate and improve the platform.</p>
            </div>
          </div>
        </section>

        {/* 3 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">3. How we use your information</h2>
          <ul className="space-y-2 text-slate-600 leading-relaxed list-disc list-inside">
            <li>To create and manage your account</li>
            <li>To process bookings and payments</li>
            <li>To send booking confirmations, reminders, and receipts via email</li>
            <li>To connect customers with their assigned guide before the activity</li>
            <li>To send post-activity review requests</li>
            <li>To verify operator identity and safety certifications</li>
            <li>To calculate and process payouts to operators</li>
            <li>To resolve disputes and provide customer support</li>
            <li>To improve the platform through usage analytics</li>
            <li>To send occasional platform updates and offers (you can opt out at any time)</li>
          </ul>
        </section>

        {/* 4 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Third-party services</h2>
          <div className="space-y-4 text-slate-600 leading-relaxed">
            <div>
              <p className="font-medium text-slate-800 mb-1">Razorpay</p>
              <p>We use Razorpay to process all payments. Your payment information is transmitted directly to Razorpay and is subject to <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Razorpay&apos;s Privacy Policy</a>.</p>
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-1">Amazon SES</p>
              <p>We use Amazon Simple Email Service to deliver transactional emails (booking confirmations, reminders, receipts). Email content may transit Amazon&apos;s servers in accordance with <a href="https://aws.amazon.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Amazon&apos;s Privacy Policy</a>.</p>
            </div>
            <div>
              <p className="font-medium text-slate-800 mb-1">Cloudinary</p>
              <p>Experience photos and operator documents are stored on Cloudinary&apos;s cloud storage. Files are subject to <a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Cloudinary&apos;s Privacy Policy</a>.</p>
            </div>
          </div>
        </section>

        {/* 5 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Data sharing</h2>
          <p className="text-slate-600 leading-relaxed">
            We do not sell your personal information. We share your data only:
          </p>
          <ul className="mt-3 space-y-2 text-slate-600 leading-relaxed list-disc list-inside">
            <li>With the operator you have booked (name and phone shared for guide introduction only)</li>
            <li>With payment processors to complete transactions</li>
            <li>With cloud service providers listed above, solely to operate the platform</li>
            <li>When required by law or a valid government authority order</li>
          </ul>
        </section>

        {/* 6 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Email communications & opt-out</h2>
          <p className="text-slate-600 leading-relaxed">
            We send two types of emails:
          </p>
          <ul className="mt-3 space-y-2 text-slate-600 leading-relaxed list-disc list-inside">
            <li><strong>Transactional emails</strong> — booking confirmations, receipts, reminders, and review requests. These are required for the service and cannot be opted out of while you have an active account.</li>
            <li><strong>Marketing emails</strong> — occasional offers, adventure ideas, and platform updates. You may unsubscribe from these at any time by emailing <a href="mailto:support@wanderpool.com" className="text-primary hover:underline">support@wanderpool.com</a> with subject &quot;Unsubscribe&quot;.</li>
          </ul>
        </section>

        {/* 7 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Data retention</h2>
          <p className="text-slate-600 leading-relaxed">
            We retain your account and booking data for as long as your account is active and for up to 7 years thereafter to comply with Indian financial and tax regulations. You may request deletion of your account at any time via Account Settings; we will delete personal data within 30 days, except where retention is required by law.
          </p>
        </section>

        {/* 8 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Cookies</h2>
          <p className="text-slate-600 leading-relaxed">
            We use an HTTP-only cookie to store your login session token. This cookie is strictly necessary for the platform to function and does not track you across other websites. No third-party advertising cookies are used.
          </p>
        </section>

        {/* 9 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Security</h2>
          <p className="text-slate-600 leading-relaxed">
            All data is transmitted over HTTPS (TLS). Passwords are hashed using bcrypt. Payment data is handled exclusively by Razorpay&apos;s PCI-DSS compliant infrastructure. We perform regular security reviews of our backend systems.
          </p>
        </section>

        {/* 10 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">10. Your rights</h2>
          <p className="text-slate-600 leading-relaxed">
            You have the right to:
          </p>
          <ul className="mt-3 space-y-2 text-slate-600 leading-relaxed list-disc list-inside">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate data</li>
            <li>Request deletion of your account and associated data</li>
            <li>Opt out of marketing communications</li>
          </ul>
          <p className="text-slate-600 leading-relaxed mt-3">
            To exercise any of these rights, contact us at <a href="mailto:support@wanderpool.com" className="text-primary hover:underline">support@wanderpool.com</a>.
          </p>
        </section>

        {/* 11 */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-3">11. Changes to this policy</h2>
          <p className="text-slate-600 leading-relaxed">
            We may update this policy periodically. Material changes will be communicated via email. Continued use of WanderPool after changes are posted constitutes acceptance of the updated policy. The &quot;Last updated&quot; date at the top of this page reflects the most recent revision.
          </p>
        </section>

        {/* Contact */}
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Questions about this policy?</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            Email us at <a href="mailto:support@wanderpool.com" className="text-primary hover:underline">support@wanderpool.com</a> and we&apos;ll respond within 2 business days.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="text-sm text-primary font-medium hover:underline">Contact us →</Link>
            <Link href="/terms" className="text-sm text-slate-500 hover:text-slate-700">Terms & Conditions</Link>
            <Link href="/refund-policy" className="text-sm text-slate-500 hover:text-slate-700">Refund Policy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
