"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Mail, KeyRound, Lock, ChevronLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestOTP, verifyOTP, resetPassword, type PasswordResetRole } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

type Step = "request" | "verify" | "reset" | "done";

const roles: { value: PasswordResetRole; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "agency",   label: "Agency / Solo Operator" },
  { value: "operator", label: "Guide / Operator" },
  { value: "admin",    label: "Admin" },
];

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep]               = useState<Step>("request");
  const [loading, setLoading]         = useState(false);
  const [email, setEmail]             = useState("");
  const [role, setRole]               = useState<PasswordResetRole>("customer");
  const [otp, setOtp]                 = useState("");
  const [resetToken, setResetToken]   = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw]     = useState("");

  // ── Step 1: Request OTP ────────────────────────────────────────────────────
  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await requestOTP(email, role);
      toast.success("OTP sent! Check your email.");
      setStep("verify");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      toast.error("Enter the 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyOTP(email, role, otp);
      setResetToken(res.reset_token);
      setStep("reset");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  }

  // ── Step 3: Set new password ───────────────────────────────────────────────
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPw) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, role, resetToken, newPassword);
      setStep("done");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm p-8">

        {/* Back to login */}
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to login
        </Link>

        {/* Progress dots */}
        {step !== "done" && (
          <div className="flex items-center gap-2 mb-6">
            {(["request", "verify", "reset"] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  step === s ? "bg-primary" :
                  (["request","verify","reset"].indexOf(step) > i) ? "bg-primary/40" : "bg-slate-200"
                )} />
                {i < 2 && <div className="h-px w-6 bg-slate-200" />}
              </div>
            ))}
          </div>
        )}

        {/* ── Step 1: Email + role ── */}
        {step === "request" && (
          <>
            <h1 className="text-xl font-bold text-slate-900 mb-1">Forgot password?</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Enter your email and we&apos;ll send a 6-digit OTP to reset your password.
            </p>
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Account type</Label>
                <Select value={role} onValueChange={(v) => setRole(v as PasswordResetRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? "Sending OTP…" : "Send OTP via Email"}
              </Button>
            </form>
          </>
        )}

        {/* ── Step 2: OTP entry ── */}
        {step === "verify" && (
          <>
            <h1 className="text-xl font-bold text-slate-900 mb-1">Enter OTP</h1>
            <p className="text-sm text-muted-foreground mb-6">
              We sent a 6-digit code to <strong>{email}</strong>. It expires in 5 minutes.
            </p>
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-1.5">
                <Label>6-digit OTP</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="pl-9 text-center tracking-[0.4em] font-mono text-lg"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? "Verifying…" : "Verify OTP"}
              </Button>
              <button
                type="button"
                className="w-full text-sm text-muted-foreground hover:text-primary text-center"
                onClick={() => { setOtp(""); handleRequestOTP({ preventDefault: () => {} } as React.FormEvent); }}
              >
                Resend OTP
              </button>
            </form>
          </>
        )}

        {/* ── Step 3: New password ── */}
        {step === "reset" && (
          <>
            <h1 className="text-xl font-bold text-slate-900 mb-1">Set new password</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Choose a strong password for your account.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label>New password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Min. 8 characters"
                    className="pl-9"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Repeat password"
                    className="pl-9"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    required
                  />
                </div>
                {confirmPw && newPassword !== confirmPw && (
                  <p className="text-xs text-destructive">Passwords do not match</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || newPassword.length < 8 || newPassword !== confirmPw}
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? "Saving…" : "Reset Password"}
              </Button>
            </form>
          </>
        )}

        {/* ── Done ── */}
        {step === "done" && (
          <div className="text-center space-y-4 py-4">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <h1 className="text-xl font-bold text-slate-900">Password reset!</h1>
            <p className="text-sm text-muted-foreground">
              Your password has been updated successfully. You can now log in.
            </p>
            <Button className="w-full" onClick={() => router.push("/login")}>
              Back to Login
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
