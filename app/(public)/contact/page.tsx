"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Clock,
  MapPin,
  CheckCircle2,
  Send,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8080";
      const res = await fetch(`${BACKEND}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Something went wrong");
      }
      setSubmitted(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* Hero */}
      <div className="bg-slate-900 py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <Mail className="h-3.5 w-3.5" />
            We're here to help
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-slate-400 text-lg">
            Questions about a booking, safety concerns, or want to partner with us? We respond fast.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Left — contact info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-5">Get in touch</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Email (Primary)</p>
                    <p className="text-sm text-slate-500 mt-0.5">hello@wanderpool.in</p>
                    <p className="text-xs text-slate-400 mt-0.5">Response within 4 business hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Operations base</p>
                    <p className="text-sm text-slate-500 mt-0.5">Rishikesh, Uttarakhand, India</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support hours */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-slate-900">Support hours</p>
              </div>
              <div className="space-y-1.5 text-sm text-slate-500">
                <div className="flex justify-between">
                  <span>Email support</span>
                  <span className="font-medium text-slate-700">Mon – Sat</span>
                </div>
                <div className="flex justify-between">
                  <span>Response time</span>
                  <span className="font-medium text-slate-700">Within 4 hrs</span>
                </div>
              </div>
            </div>

            {/* Coming soon note */}
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
              <p className="text-sm font-semibold text-amber-900 mb-1">WhatsApp support — coming soon</p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Real-time WhatsApp support is on our roadmap. For now, email is the fastest way to reach us.
              </p>
            </div>

            {/* Quick links */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-900">Quick links</p>
              <Link href="/safety" className="block text-sm text-primary hover:underline">Safety & certifications →</Link>
              <Link href="/for-operators" className="block text-sm text-primary hover:underline">List your experience →</Link>
              <Link href="/about" className="block text-sm text-primary hover:underline">About WanderPool →</Link>
            </div>
          </div>

          {/* Right — form */}
          <div className="md:col-span-3">
            {submitted ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Message received!</h3>
                <p className="text-slate-500 text-sm max-w-xs">
                  We'll get back to you at <strong>{form.email}</strong> within 4 business hours.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: "", email: "", subject: "", message: "" }); }}
                  className="mt-6 text-sm text-primary hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-xl font-bold text-slate-900 mb-5">Send us a message</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                      Your name *
                    </label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Priya Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                      Email *
                    </label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="priya@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Subject *
                  </label>
                  <select
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                  >
                    <option value="">Select a topic…</option>
                    <option value="booking">Booking question</option>
                    <option value="refund">Refund / cancellation</option>
                    <option value="safety">Safety concern</option>
                    <option value="operator">Operator partnership</option>
                    <option value="technical">Technical issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us how we can help you…"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {submitting ? "Sending…" : "Send message"}
                </button>
                <p className="text-xs text-slate-400">
                  We'll reply to your email address within 4 business hours.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
