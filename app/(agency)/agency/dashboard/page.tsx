"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Map, BookOpen, Star, TrendingUp, ClipboardList, Users, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { experienceKeys, listMyExperiences } from "@/lib/api/experiences";
import { useAuth } from "@/lib/providers/AuthProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExperienceStatusBadge } from "@/components/shared/StatusBadge";
import { paiseToCurrency } from "@/lib/utils/currency";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OnboardingStatus {
  onboarding_submitted_at: string | null;
  bank_verified: boolean;
  certs_verified: boolean;
  video_call_done: boolean;
  agreement_signed: boolean;
}

export default function AgencyDashboardPage() {
  const { user, refresh } = useAuth();
  const isSoloOperator = user?.accountType === "solo_operator";
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  async function handleUpgrade() {
    setUpgradeLoading(true);
    try {
      const res = await fetch("/api/auth/upgrade", { method: "POST" });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? "Upgrade failed");
        return;
      }
      await refresh();
      toast.success("Upgraded to Agency! You can now invite guides.");
      setUpgradeOpen(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUpgradeLoading(false);
    }
  }

  const { data: onboarding } = useQuery<OnboardingStatus>({
    queryKey: ["agency", "onboarding"],
    queryFn: () => apiFetch("/agency/onboarding"),
  });

  const onboardingDone = !!onboarding?.onboarding_submitted_at;
  const allGatesCleared =
    onboarding?.bank_verified &&
    onboarding?.certs_verified &&
    onboarding?.video_call_done &&
    onboarding?.agreement_signed;

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: experienceKeys.mine(),
    queryFn: listMyExperiences,
  });

  const activeCount = experiences.filter((e) => e.status === "active").length;
  const draftCount = experiences.filter((e) => e.status === "draft").length;
  const pendingCount = experiences.filter(
    (e) => e.status === "pending_review"
  ).length;

  const stats = [
    {
      title: "Total Listings",
      value: experiences.length,
      icon: Map,
      description: `${activeCount} active, ${draftCount} draft`,
    },
    {
      title: "Pending Review",
      value: pendingCount,
      icon: TrendingUp,
      description: "Awaiting admin approval",
    },
    {
      title: "Total Bookings",
      value: experiences.reduce((sum, e) => sum + e.total_bookings, 0),
      icon: BookOpen,
      description: "Across all experiences",
    },
    {
      title: "Avg. Rating",
      value:
        experiences.length > 0
          ? (
              experiences.reduce((sum, e) => sum + e.avg_rating, 0) /
              experiences.length
            ).toFixed(1)
          : "—",
      icon: Star,
      description: "Platform average",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back 👋`}
        description={isSoloOperator ? "Here's an overview of your Solo Operator account" : "Here's an overview of your Agency account"}
        action={
          <Button asChild>
            <Link href="/agency/experiences/new">+ New Experience</Link>
          </Button>
        }
      />

      {/* Onboarding banner */}
      {!onboardingDone && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800">
          <ClipboardList className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Complete your onboarding</p>
            <p className="text-xs mt-0.5">Upload your KYC documents and sign the operator agreement to activate your account.</p>
          </div>
          <Button size="sm" asChild className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white border-0">
            <Link href="/agency/onboarding">Start Now</Link>
          </Button>
        </div>
      )}
      {onboardingDone && !allGatesCleared && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-800">
          <ClipboardList className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Documents under review</p>
            <p className="text-xs mt-0.5">Our team is verifying your documents. You&apos;ll be notified once all gates are cleared.</p>
          </div>
          <Button size="sm" variant="outline" asChild className="shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100">
            <Link href="/agency/onboarding">View Status</Link>
          </Button>
        </div>
      )}

      {/* Upgrade to Agency banner — solo operators only */}
      {isSoloOperator && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-50 border border-violet-200 text-violet-800">
          <Users className="h-5 w-5 shrink-0 text-violet-700" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-900">Scale up to an Agency</p>
            <p className="text-xs text-violet-700 mt-0.5">Invite guides, assign bookings to your team, and grow beyond yourself.</p>
          </div>
          <Button
            size="sm"
            onClick={() => setUpgradeOpen(true)}
            className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white border-0"
          >
            Upgrade
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stat.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Experiences */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Experiences</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/agency/experiences">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : experiences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No experiences yet.{" "}
              <Link
                href="/agency/experiences/new"
                className="text-primary underline"
              >
                Create your first one
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {experiences.slice(0, 5).map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{exp.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.location_city} · {paiseToCurrency(exp.base_price_paise)}{" "}
                      per person
                    </p>
                  </div>
                  <ExperienceStatusBadge status={exp.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upgrade to Agency modal */}
      <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upgrade to Agency</DialogTitle>
            <DialogDescription>
              This converts your Solo Operator account to a full Agency account. This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium text-foreground mb-1.5">What changes:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>You gain access to the Guides management section</li>
                <li>You can invite guides and assign bookings to your team</li>
                <li>Your account type changes from Solo Operator to Agency</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1.5">What stays the same:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>All your existing experiences, bookings, and earnings</li>
                <li>Your onboarding and KYC verification status</li>
                <li>Your pricing, reviews, and payout history</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpgradeOpen(false)} disabled={upgradeLoading}>
              Cancel
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700"
              disabled={upgradeLoading}
              onClick={handleUpgrade}
            >
              {upgradeLoading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Upgrading…</>
              ) : (
                "Yes, Upgrade My Account"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
