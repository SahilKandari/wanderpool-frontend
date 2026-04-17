"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, CheckCircle2, XCircle, PauseCircle,
  FileText, BadgeCheck, Phone, Mail, MapPin, Calendar,
  TrendingUp, BookOpen, Users, Star, ShieldCheck, ShieldAlert,
  ExternalLink, ToggleLeft, ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import {
  adminKeys, adminGetAgency, adminApproveAgency, adminRejectAgency,
  adminSuspendAgency, adminUpdateGates,
} from "@/lib/api/admin";
import type { Agency } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

function statusColor(status: string) {
  switch (status) {
    case "active":    return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "pending":   return "text-amber-600 bg-amber-50 border-amber-200";
    case "suspended": return "text-red-600 bg-red-50 border-red-200";
    case "banned":    return "text-slate-500 bg-slate-50 border-slate-200";
    default:          return "text-slate-500 bg-slate-50 border-slate-200";
  }
}

function healthColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-500";
}

// All Cloudinary assets (images and PDFs) are publicly accessible once
// "PDF and ZIP delivery" is enabled in the Cloudinary account settings.
function openFileInBrowser(url: string) {
  const win = window.open(url, "_blank");
  if (!win) alert("Pop-up blocked — please allow pop-ups for this site.");
}

function DocLink({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="flex items-center gap-2 py-2 text-sm">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-muted-foreground">{label}</span>
        <span className="ml-auto text-xs text-muted-foreground italic">Not uploaded</span>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => openFileInBrowser(url)}
      className="flex items-center gap-2 py-2 text-sm w-full text-left hover:underline"
    >
      <FileText className="h-4 w-4 text-primary shrink-0" />
      <span className="font-medium">{label}</span>
      <ExternalLink className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
    </button>
  );
}

function GateToggle({
  label, checked, onChange, disabled,
}: {
  label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 w-full py-2.5 px-0 text-sm hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className={checked ? "text-emerald-700 font-medium" : "text-muted-foreground"}>
        {label}
      </span>
      {checked
        ? <ToggleRight className="h-5 w-5 text-emerald-600 shrink-0" />
        : <ToggleLeft  className="h-5 w-5 text-slate-400 shrink-0" />
      }
    </button>
  );
}

export default function AdminAgencyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const { data: agency, isLoading } = useQuery({
    queryKey: adminKeys.agency(id),
    queryFn: () => adminGetAgency(id),
  });

  const approveMutation = useMutation({
    mutationFn: () => adminApproveAgency(id),
    onSuccess: () => {
      toast.success("Agency approved");
      qc.invalidateQueries({ queryKey: adminKeys.agency(id) });
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminRejectAgency(id),
    onSuccess: () => {
      toast.success("Agency rejected/suspended");
      qc.invalidateQueries({ queryKey: adminKeys.agency(id) });
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const suspendMutation = useMutation({
    mutationFn: () => adminSuspendAgency(id),
    onSuccess: () => {
      toast.success("Agency suspended");
      qc.invalidateQueries({ queryKey: adminKeys.agency(id) });
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const gatesMutation = useMutation({
    mutationFn: (gates: Parameters<typeof adminUpdateGates>[1]) =>
      adminUpdateGates(id, gates),
    onSuccess: () => {
      toast.success("Gate updated");
      qc.invalidateQueries({ queryKey: adminKeys.agency(id) });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-5xl">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!agency) return null;

  const onboardingComplete =
    agency.bank_verified && agency.certs_verified && agency.video_call_done && agency.agreement_signed;

  return (
    <div className="max-w-5xl space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 shrink-0"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold truncate">{agency.business_name}</h1>
            <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", statusColor(agency.status))}>
              {agency.status}
            </span>
            {agency.health_flag === "red" && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border text-red-600 bg-red-50 border-red-200 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Red Flag
              </span>
            )}
            {agency.health_flag === "yellow" && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full border text-amber-600 bg-amber-50 border-amber-200 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> Yellow Flag
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">
            {agency.account_type?.replace("_", " ")} · Joined{" "}
            {new Date(agency.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {agency.status !== "active" && (
            <Button
              size="sm"
              variant="outline"
              className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
              disabled={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
            >
              <CheckCircle2 className="mr-1.5 h-4 w-4" />
              Approve
            </Button>
          )}
          {agency.status === "active" && (
            <Button
              size="sm"
              variant="outline"
              className="text-amber-600 border-amber-300 hover:bg-amber-50"
              disabled={suspendMutation.isPending}
              onClick={() => suspendMutation.mutate()}
            >
              <PauseCircle className="mr-1.5 h-4 w-4" />
              Suspend
            </Button>
          )}
          {agency.status !== "suspended" && agency.status !== "banned" && (
            <Button
              size="sm"
              variant="outline"
              className="text-destructive border-destructive/40 hover:bg-destructive/10"
              disabled={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Reject
            </Button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Health Score", value: Number(agency.health_score).toFixed(1), sub: "/ 100", color: healthColor(agency.health_score ?? 0) },
          { label: "Experiences",  value: agency.experience_count ?? 0, sub: "listings" },
          { label: "Bookings",     value: agency.total_bookings ?? 0,   sub: "total" },
          { label: "Guides",       value: agency.operator_count ?? 0,   sub: "operators" },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-card rounded-xl border p-4 text-center">
            <p className={cn("text-2xl font-bold", color ?? "text-foreground")}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            <p className="text-[11px] text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — 2/3 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Business Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-1.5 mt-0.5">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {agency.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-1.5 mt-0.5">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {agency.phone || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium flex items-center gap-1.5 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {agency.city && agency.state ? `${agency.city}, ${agency.state}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Commission</p>
                  <p className="font-medium mt-0.5">
                    {((agency.commission_rate_bps ?? 1300) / 100).toFixed(2)}%
                  </p>
                </div>
              </div>
              {agency.description && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Description</p>
                    <p className="text-sm leading-relaxed">{agency.description}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* KYC Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-primary" /> KYC Details
              </CardTitle>
              <CardDescription>
                Identity and banking information submitted by the agency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Aadhaar Number</p>
                  <p className="font-medium mt-0.5 font-mono">{agency.aadhaar_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PAN Number</p>
                  <p className="font-medium mt-0.5 font-mono">{agency.pan_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bank Account</p>
                  <p className="font-medium mt-0.5 font-mono">{agency.bank_account_number || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IFSC Code</p>
                  <p className="font-medium mt-0.5 font-mono">{agency.bank_ifsc || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" /> Uploaded Documents
              </CardTitle>
              <CardDescription>
                Click a document to open it in a new tab for review.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <DocLink label="Aadhaar / Identity Proof" url={agency.aadhaar_doc_url} />
              <DocLink label="PAN Card"                 url={agency.pan_doc_url} />
              <DocLink label="Bank Proof (Passbook/Statement)" url={agency.bank_doc_url} />
              <DocLink label="Safety Certifications"   url={agency.cert_doc_url} />
            </CardContent>
          </Card>
        </div>

        {/* Right column — 1/3 */}
        <div className="space-y-6">

          {/* Onboarding Gates */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" /> Onboarding Gates
              </CardTitle>
              <CardDescription>
                Toggle gates after manually verifying each step.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {agency.onboarding_submitted_at ? (
                <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 mb-3 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  Submitted {new Date(agency.onboarding_submitted_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              ) : (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
                  Agency has not submitted onboarding yet.
                </p>
              )}
              <div className="divide-y">
                <GateToggle
                  label="Bank Account Verified"
                  checked={agency.bank_verified}
                  disabled={gatesMutation.isPending}
                  onChange={(v) => gatesMutation.mutate({ bank_verified: v })}
                />
                <GateToggle
                  label="Certifications Verified"
                  checked={agency.certs_verified}
                  disabled={gatesMutation.isPending}
                  onChange={(v) => gatesMutation.mutate({ certs_verified: v })}
                />
                <GateToggle
                  label="Video Call Done"
                  checked={agency.video_call_done}
                  disabled={gatesMutation.isPending}
                  onChange={(v) => gatesMutation.mutate({ video_call_done: v })}
                />
                <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className={agency.agreement_signed ? "text-emerald-700 font-medium" : "text-muted-foreground"}>
                    Agreement Signed
                  </span>
                  {agency.agreement_signed
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    : <XCircle className="h-4 w-4 text-slate-300 shrink-0" />
                  }
                </div>
              </div>
              {onboardingComplete && (
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                  All gates cleared — ready to go live.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registered</span>
                <span className="font-medium">
                  {new Date(agency.created_at).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium">
                  {agency.updated_at
                    ? new Date(agency.updated_at).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })
                    : "—"}
                </span>
              </div>
              {agency.onboarding_submitted_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">KYC Submitted</span>
                  <span className="font-medium">
                    {new Date(agency.onboarding_submitted_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
