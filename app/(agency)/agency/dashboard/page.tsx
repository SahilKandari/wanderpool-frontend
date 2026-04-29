"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Map, BookOpen, Star, TrendingUp, ClipboardList, Users, Loader2, IndianRupee,
} from "lucide-react";
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
import type { Booking } from "@/lib/types/booking";
import { listMyBookings } from "@/lib/api/bookings";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ── data helpers ──────────────────────────────────────────────────────────────

function getLast6MonthKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(d.toLocaleString("default", { month: "short", year: "2-digit" }));
  }
  return keys;
}

function monthKey(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("default", { month: "short", year: "2-digit" });
}

function buildMonthlyBookings(bookings: Booking[]) {
  const labels = getLast6MonthKeys();
  const map: Record<string, number> = {};
  labels.forEach((l) => (map[l] = 0));
  bookings.forEach((b) => {
    const k = monthKey(b.created_at);
    if (k in map) map[k]++;
  });
  return labels.map((month) => ({ month, bookings: map[month] }));
}

function buildRevenueByExperience(bookings: Booking[]) {
  const map: Record<string, number> = {};
  bookings.forEach((b) => {
    if (b.status === "completed" || b.status === "confirmed") {
      map[b.experience_title] = (map[b.experience_title] ?? 0) + b.operator_payout_paise / 100;
    }
  });
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, revenue]) => ({
      name: name.length > 22 ? name.slice(0, 20) + "…" : name,
      revenue: Math.round(revenue),
    }));
}

function buildStatusData(bookings: Booking[]) {
  const counts: Record<string, number> = {};
  bookings.forEach((b) => {
    counts[b.status] = (counts[b.status] ?? 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
    raw: name,
  }));
}

const COLORS: Record<string, string> = {
  confirmed: "#6366f1",
  completed: "#22c55e",
  cancelled: "#ef4444",
  disputed:  "#f59e0b",
  pending:   "#94a3b8",
};
const FALLBACKS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#94a3b8"];
const color = (raw: string, idx: number) => COLORS[raw] ?? FALLBACKS[idx % FALLBACKS.length];

// ── types ─────────────────────────────────────────────────────────────────────

interface OnboardingStatus {
  onboarding_submitted_at: string | null;
  bank_verified: boolean;
  certs_verified: boolean;
  video_call_done: boolean;
  agreement_signed: boolean;
}

// ── page ──────────────────────────────────────────────────────────────────────

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

  const { data: experiences = [], isLoading: expLoading } = useQuery({
    queryKey: experienceKeys.mine(),
    queryFn: listMyExperiences,
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["agency-dashboard-bookings"],
    queryFn: () => listMyBookings(),
  });

  const activeCount  = experiences.filter((e) => e.status === "active").length;
  const draftCount   = experiences.filter((e) => e.status === "draft").length;
  const pendingCount = experiences.filter((e) => e.status === "pending_review").length;

  const totalEarnings = bookings
    .filter((b) => b.status === "completed" || b.status === "confirmed")
    .reduce((s, b) => s + b.operator_payout_paise, 0);

  const stats = [
    {
      title: "Total Listings",
      value: experiences.length,
      icon: Map,
      description: `${activeCount} active, ${draftCount} draft`,
      loading: expLoading,
    },
    {
      title: "Pending Review",
      value: pendingCount,
      icon: TrendingUp,
      description: "Awaiting admin approval",
      loading: expLoading,
    },
    {
      title: "Total Bookings",
      value: bookings.length,
      icon: BookOpen,
      description: "Across all experiences",
      loading: bookingsLoading,
    },
    {
      title: "Avg. Rating",
      value:
        experiences.length > 0
          ? (experiences.reduce((s, e) => s + e.avg_rating, 0) / experiences.length).toFixed(1)
          : "—",
      icon: Star,
      description: "Across all experiences",
      loading: expLoading,
    },
  ];

  const monthlyData    = buildMonthlyBookings(bookings);
  const revenueByExp   = buildRevenueByExperience(bookings);
  const statusData     = buildStatusData(bookings);

  return (
    <div>
      <PageHeader
        title="Welcome back 👋"
        description={
          isSoloOperator
            ? "Here's an overview of your Solo Operator account"
            : "Here's an overview of your Agency account"
        }
        action={
          <Button asChild>
            <Link href="/agency/experiences/new">+ New Experience</Link>
          </Button>
        }
      />

      {/* Onboarding banners */}
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
      {isSoloOperator && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-50 border border-violet-200 text-violet-800">
          <Users className="h-5 w-5 shrink-0 text-violet-700" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-violet-900">Scale up to an Agency</p>
            <p className="text-xs text-violet-700 mt-0.5">Invite guides, assign bookings to your team, and grow beyond yourself.</p>
          </div>
          <Button size="sm" onClick={() => setUpgradeOpen(true)} className="shrink-0 bg-violet-600 hover:bg-violet-700 text-white border-0">
            Upgrade
          </Button>
        </div>
      )}

      {/* ── Top stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ title, value, icon: Icon, description, loading }) => (
          <Card key={title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Earnings summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  ₹{Math.round(totalEarnings / 100).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">From confirmed &amp; completed bookings</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {bookings.length > 0
                    ? `${Math.round((bookings.filter((b) => b.status === "completed").length / bookings.length) * 100)}%`
                    : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {bookings.filter((b) => b.status === "completed").length} of {bookings.length} bookings completed
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Monthly Bookings + Status donut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Bookings — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} width={30} />
                  <Tooltip
                    formatter={(v) => [Number(v), "Bookings"]}
                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                  />
                  <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bookings by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : statusData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No bookings yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="42%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, idx) => (
                      <Cell key={entry.name} fill={color(entry.raw, idx)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [Number(v), "Bookings"]}
                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Revenue by Experience + Recent Experiences ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 5 Experiences by Earnings (₹)</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : revenueByExp.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No completed bookings yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={revenueByExp}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 8, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Earnings"]}
                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                  />
                  <Bar dataKey="revenue" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Experiences</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/agency/experiences">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {expLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : experiences.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No experiences yet.{" "}
                <Link href="/agency/experiences/new" className="text-primary underline">
                  Create your first one
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {experiences.slice(0, 5).map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{exp.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {exp.location_city} · {paiseToCurrency(exp.base_price_paise)} per person
                      </p>
                    </div>
                    <ExperienceStatusBadge status={exp.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upgrade modal */}
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
