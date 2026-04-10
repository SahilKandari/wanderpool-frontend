"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2, Upload, Loader2, FileText, ChevronRight,
  ChevronLeft, BadgeCheck, Banknote, ShieldCheck, FileSignature,
  AlertTriangle, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/providers/AuthProvider";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface OnboardingData {
  id: string;
  status: string;
  aadhaar_number: string | null;
  aadhaar_doc_url: string | null;
  pan_number: string | null;
  pan_doc_url: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  bank_doc_url: string | null;
  cert_doc_url: string | null;
  bank_verified: boolean;
  certs_verified: boolean;
  video_call_done: boolean;
  agreement_signed: boolean;
  onboarding_submitted_at: string | null;
}

interface SignedParams {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowed_formats: string;
  resource_type: string;
  upload_url: string;
}

const ONBOARDING_KEY = ["agency", "onboarding"];

// ── Cloudinary upload helper ──────────────────────────────────────────────────
// All Cloudinary assets (images and PDFs) are publicly accessible once
// "PDF and ZIP delivery" is enabled in the Cloudinary account settings.
function openFileInBrowser(url: string) {
  const win = window.open(url, "_blank");
  if (!win) toast.error("Pop-up blocked — please allow pop-ups for this site.");
}

async function uploadDoc(
  agencyId: string,
  file: File,
  folderType: "agency_cert" | "agency_profile"
): Promise<string> {
  const signed = await apiFetch<SignedParams>(
    `/upload/sign?folder_type=${folderType}&resource_id=${agencyId}`
  );
  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", signed.api_key);
  fd.append("timestamp", String(signed.timestamp));
  fd.append("signature", signed.signature);
  fd.append("folder", signed.folder);
  fd.append("allowed_formats", signed.allowed_formats);

  const res = await fetch(signed.upload_url, { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "Upload failed");
  return data.secure_url as string;
}

// ── Step indicator ────────────────────────────────────────────────────────────
const STEPS = [
  { label: "Identity",  icon: BadgeCheck },
  { label: "Banking",   icon: Banknote },
  { label: "Documents", icon: FileText },
  { label: "Agreement", icon: FileSignature },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const Icon = step.icon;
        const done = i < current;
        const active = i === current;
        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center border-2 transition-colors",
                done   ? "bg-primary border-primary text-white"
                : active ? "border-primary text-primary bg-primary/5"
                : "border-border text-muted-foreground bg-muted"
              )}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <span className={cn(
                "text-[11px] font-medium whitespace-nowrap",
                active ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-2 mb-5 transition-colors",
                i < current ? "bg-primary" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Doc upload field ──────────────────────────────────────────────────────────
function DocUploadField({
  label, hint, accept, currentUrl, uploading,
  onUpload,
}: {
  label: string;
  hint: string;
  accept: string;
  currentUrl: string | null;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>
      <div className="flex items-center gap-2 mt-1">
        <button
          type="button"
          disabled={uploading}
          onClick={() => ref.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {uploading ? "Uploading…" : currentUrl ? "Replace file" : "Upload file"}
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={() => openFileInBrowser(currentUrl)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            View uploaded
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
        {currentUrl && (
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
        )}
      </div>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AgencyOnboardingPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Form state
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarDocUrl, setAadhaarDocUrl] = useState<string | null>(null);
  const [panNumber, setPanNumber] = useState("");
  const [panDocUrl, setPanDocUrl] = useState<string | null>(null);
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [bankDocUrl, setBankDocUrl] = useState<string | null>(null);
  const [certDocUrl, setCertDocUrl] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const agencyId = user?.actorId ?? "";

  const { data: onboarding, isLoading } = useQuery<OnboardingData>({
    queryKey: ONBOARDING_KEY,
    queryFn: () => apiFetch("/agency/onboarding"),
    enabled: !!agencyId,
  });

  // Populate form from saved data
  useEffect(() => {
    if (!onboarding) return;
    if (onboarding.aadhaar_number) setAadhaarNumber(onboarding.aadhaar_number);
    if (onboarding.aadhaar_doc_url) setAadhaarDocUrl(onboarding.aadhaar_doc_url);
    if (onboarding.pan_number) setPanNumber(onboarding.pan_number);
    if (onboarding.pan_doc_url) setPanDocUrl(onboarding.pan_doc_url);
    if (onboarding.bank_account_number) setBankAccount(onboarding.bank_account_number);
    if (onboarding.bank_ifsc) setBankIfsc(onboarding.bank_ifsc);
    if (onboarding.bank_doc_url) setBankDocUrl(onboarding.bank_doc_url);
    if (onboarding.cert_doc_url) setCertDocUrl(onboarding.cert_doc_url);
    if (onboarding.agreement_signed) setAgreedToTerms(onboarding.agreement_signed);
  }, [onboarding]);

  const saveMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      apiFetch("/agency/onboarding", { method: "PUT", body: JSON.stringify(payload) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ONBOARDING_KEY });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function handleUpload(
    file: File,
    field: string,
    folderType: "agency_cert" | "agency_profile",
    onDone: (url: string) => void
  ) {
    setUploadingField(field);
    try {
      const url = await uploadDoc(agencyId, file, folderType);
      onDone(url);
      // Auto-save the URL immediately
      saveMutation.mutate({ [field]: url });
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingField(null);
    }
  }

  function saveAndNext(payload: Record<string, unknown>) {
    saveMutation.mutate(payload, {
      onSuccess: () => setStep((s) => s + 1),
    });
  }

  const alreadySubmitted = !!onboarding?.onboarding_submitted_at && !editing;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Submitted state ─────────────────────────────────────────────────────────
  if (alreadySubmitted) {
    const allGatesDone =
      onboarding?.bank_verified &&
      onboarding?.certs_verified &&
      onboarding?.video_call_done &&
      onboarding?.agreement_signed;

    return (
      <div className="max-w-2xl">
        <PageHeader
          title="Onboarding"
          description="Your KYC and verification documents."
        />
        <Card>
          <CardContent className="pt-6 space-y-4">
            {allGatesDone ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <ShieldCheck className="h-7 w-7 text-emerald-600" />
                </div>
                <h2 className="text-lg font-semibold">Onboarding Complete!</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  All verifications are done. Your account is cleared to go live.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center">
                  <Loader2 className="h-7 w-7 text-amber-600 animate-spin" />
                </div>
                <h2 className="text-lg font-semibold">Documents Under Review</h2>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Submitted on{" "}
                  {new Date(onboarding!.onboarding_submitted_at!).toLocaleDateString("en-IN", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                  . Our team will verify your documents within 1–2 business days.
                </p>
              </div>
            )}

            {/* Gate status */}
            <div className="border rounded-xl divide-y">
              {[
                { label: "Bank Account Verified", done: onboarding?.bank_verified },
                { label: "Certifications Verified", done: onboarding?.certs_verified },
                { label: "Video Call Done", done: onboarding?.video_call_done },
                { label: "Agreement Signed", done: onboarding?.agreement_signed },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className={done ? "font-medium" : "text-muted-foreground"}>{label}</span>
                  {done
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    : <span className="text-xs text-amber-600 font-medium">Pending</span>
                  }
                </div>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Need to update a document?{" "}
              <button
                className="text-primary underline"
                onClick={() => { setEditing(true); setStep(0); }}
              >
                Edit submission
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Steps ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Onboarding"
        description="Complete KYC to activate your account and go live on WanderPool."
      />

      <StepBar current={step} />

      {/* Step 0: Identity */}
      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-primary" /> Identity Verification
            </CardTitle>
            <CardDescription>
              Enter your Aadhaar and PAN details. These are required for KYC compliance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="aadhaar">Aadhaar Number</Label>
              <Input
                id="aadhaar"
                placeholder="1234 5678 9012"
                maxLength={14}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
              />
              <p className="text-xs text-muted-foreground">12-digit Aadhaar number without spaces.</p>
            </div>

            <DocUploadField
              label="Aadhaar / Identity Proof"
              hint="Upload a clear photo or scan of your Aadhaar card (front & back). PDF, JPG, PNG accepted."
              accept="image/*,.pdf"
              currentUrl={aadhaarDocUrl}
              uploading={uploadingField === "aadhaar_doc_url"}
              onUpload={(f) => handleUpload(f, "aadhaar_doc_url", "agency_cert", setAadhaarDocUrl)}
            />

            <div className="space-y-1.5">
              <Label htmlFor="pan">PAN Number</Label>
              <Input
                id="pan"
                placeholder="ABCDE1234F"
                maxLength={10}
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase().slice(0, 10))}
              />
            </div>

            <DocUploadField
              label="PAN Card"
              hint="Upload a clear photo or scan of your PAN card. PDF, JPG, PNG accepted."
              accept="image/*,.pdf"
              currentUrl={panDocUrl}
              uploading={uploadingField === "pan_doc_url"}
              onUpload={(f) => handleUpload(f, "pan_doc_url", "agency_cert", setPanDocUrl)}
            />

            <div className="flex justify-end pt-2">
              <Button
                disabled={!aadhaarNumber || !aadhaarDocUrl || !panNumber || !panDocUrl || saveMutation.isPending}
                onClick={() => saveAndNext({
                  aadhaar_number: aadhaarNumber,
                  aadhaar_doc_url: aadhaarDocUrl,
                  pan_number: panNumber,
                  pan_doc_url: panDocUrl,
                })}
              >
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save & Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Banking */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Banknote className="h-4 w-4 text-primary" /> Bank Account Details
            </CardTitle>
            <CardDescription>
              Payouts will be transferred to this account after every completed activity.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="bank_account">Account Number</Label>
              <Input
                id="bank_account"
                placeholder="123456789012"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bank_ifsc">IFSC Code</Label>
              <Input
                id="bank_ifsc"
                placeholder="SBIN0001234"
                maxLength={11}
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase().slice(0, 11))}
              />
              <p className="text-xs text-muted-foreground">11-character IFSC code of your branch.</p>
            </div>

            <DocUploadField
              label="Bank Proof"
              hint="Upload a cancelled cheque, bank passbook first page, or account statement. PDF, JPG, PNG accepted."
              accept="image/*,.pdf"
              currentUrl={bankDocUrl}
              uploading={uploadingField === "bank_doc_url"}
              onUpload={(f) => handleUpload(f, "bank_doc_url", "agency_cert", setBankDocUrl)}
            />

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(0)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button
                disabled={!bankAccount || !bankIfsc || !bankDocUrl || saveMutation.isPending}
                onClick={() => saveAndNext({
                  bank_account_number: bankAccount,
                  bank_ifsc: bankIfsc,
                  bank_doc_url: bankDocUrl,
                })}
              >
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save & Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Safety Certifications */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Safety Certifications
            </CardTitle>
            <CardDescription>
              Upload the required safety certificates for your activity type. Water sports require AIRI certification; paragliding requires APPI/DGCA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Certifications are mandatory for water sports and aerial activities. If you run trekking or tours, upload any relevant guide licenses or experience certificates.
              </p>
            </div>

            <DocUploadField
              label="Safety Certification(s)"
              hint="Accepted: AIRI for rafting, APPI/DGCA for paragliding, guide license for trekking. PDF, JPG, PNG. Max 20 MB."
              accept="image/*,.pdf"
              currentUrl={certDocUrl}
              uploading={uploadingField === "cert_doc_url"}
              onUpload={(f) => handleUpload(f, "cert_doc_url", "agency_cert", setCertDocUrl)}
            />

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button
                disabled={!certDocUrl || saveMutation.isPending}
                onClick={() => saveAndNext({ cert_doc_url: certDocUrl })}
              >
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save & Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Agreement + Submit */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSignature className="h-4 w-4 text-primary" /> Operator Agreement
            </CardTitle>
            <CardDescription>
              Review and accept the WanderPool Operator Agreement to complete your onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="h-56 overflow-y-auto rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground space-y-3 leading-relaxed">
              <p className="font-semibold text-foreground text-sm">WanderPool Operator Agreement</p>
              <p>By accepting this agreement, you agree to the following terms as a WanderPool operator:</p>
              <p><strong>1. Price Parity.</strong> You agree not to list your experiences at a lower price on any other platform or channel, including your own website or social media.</p>
              <p><strong>2. Safety Standards.</strong> You are solely responsible for the safety of your guests during activities. All required safety certifications must remain valid. Any safety incident must be reported to WanderPool within 24 hours.</p>
              <p><strong>3. Commission.</strong> WanderPool deducts a commission (as set by the platform) from each booking. The net payout is transferred to your registered bank account within 3 business days of activity completion.</p>
              <p><strong>4. Cancellations.</strong> You must honour the cancellation policy selected for each listing. Operator no-shows will result in a full refund to the customer and a penalty deducted from your next payout.</p>
              <p><strong>5. Reviews.</strong> You may not incentivise guests to leave reviews. Genuine reviews are protected — WanderPool will not remove negative reviews except in cases of fraud.</p>
              <p><strong>6. Data.</strong> Customer contact details shared for booking purposes may not be used for unsolicited marketing.</p>
              <p><strong>7. Termination.</strong> WanderPool reserves the right to suspend or ban your account for repeated policy violations, safety incidents, or fraudulent behaviour.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm">
                I have read and agree to the{" "}
                <span className="font-medium text-foreground">WanderPool Operator Agreement</span>. I confirm that all submitted documents are genuine and accurate.
              </span>
            </label>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <Button
                disabled={!agreedToTerms || saveMutation.isPending}
                onClick={() =>
                  saveMutation.mutate(
                    { agreement_signed: true, submit: true },
                    {
                      onSuccess: () => {
                        qc.invalidateQueries({ queryKey: ONBOARDING_KEY });
                        setEditing(false);
                      },
                    }
                  )
                }
              >
                {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Onboarding
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
