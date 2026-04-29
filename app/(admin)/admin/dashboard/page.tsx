"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Map, BookOpen, FolderTree, IndianRupee, TrendingUp } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";
import type { Booking } from "@/lib/types/booking";
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

function buildRevenueData(bookings: Booking[]) {
  const labels = getLast6MonthKeys();
  const map: Record<string, number> = {};
  labels.forEach((l) => (map[l] = 0));
  bookings.forEach((b) => {
    const k = monthKey(b.created_at);
    if (k in map) map[k] += b.total_paise / 100;
  });
  return labels.map((month) => ({ month, revenue: Math.round(map[month]) }));
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

interface AgencyRow { status: string }

function buildAgencyStatusData(agencies: AgencyRow[]) {
  const counts: Record<string, number> = {};
  agencies.forEach((a) => {
    const s = a.status ?? "unknown";
    counts[s] = (counts[s] ?? 0) + 1;
  });
  return Object.entries(counts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));
}

const COLORS: Record<string, string> = {
  confirmed:    "#6366f1",
  completed:    "#22c55e",
  cancelled:    "#ef4444",
  disputed:     "#f59e0b",
  pending:      "#94a3b8",
  active:       "#22c55e",
  approved:     "#6366f1",
  suspended:    "#ef4444",
  pending_review: "#f59e0b",
  banned:       "#dc2626",
};
const FALLBACKS = ["#6366f1", "#22c55e", "#ef4444", "#f59e0b", "#94a3b8", "#ec4899"];
const color = (raw: string, idx: number) => COLORS[raw] ?? FALLBACKS[idx % FALLBACKS.length];

// ── page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { data: agencies = [], isLoading: agenciesLoading } = useQuery<AgencyRow[]>({
    queryKey: ["admin-stats-agencies"],
    queryFn: () => apiFetch<AgencyRow[]>("/admin/agencies"),
  });

  const { data: experiences = [], isLoading: experiencesLoading } = useQuery({
    queryKey: ["admin-stats-experiences"],
    queryFn: () => apiFetch<unknown[]>("/admin/experiences"),
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["admin-stats-bookings"],
    queryFn: () => apiFetch<Booking[]>("/admin/bookings"),
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-stats-categories"],
    queryFn: () => apiFetch<unknown[]>("/categories"),
  });

  const totalRevenuePaise = bookings.reduce((s, b) => s + b.total_paise, 0);
  const completedCount = bookings.filter((b) => b.status === "completed").length;
  const completionRate = bookings.length > 0 ? Math.round((completedCount / bookings.length) * 100) : 0;

  const topStats = [
    { title: "Agencies",    value: agencies.length,    loading: agenciesLoading,    icon: Building2, href: "/admin/agencies"    },
    { title: "Experiences", value: experiences.length, loading: experiencesLoading, icon: Map,       href: "/admin/experiences" },
    { title: "Bookings",    value: bookings.length,    loading: bookingsLoading,    icon: BookOpen,  href: "/admin/bookings"    },
    { title: "Categories",  value: categories.length,  loading: categoriesLoading,  icon: FolderTree,href: "/admin/categories"  },
  ];

  const revenueData   = buildRevenueData(bookings);
  const statusData    = buildStatusData(bookings);
  const agencyStatus  = buildAgencyStatusData(agencies);

  return (
    <div>
      <PageHeader title="Platform Overview" description="WanderPool administration" />

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {topStats.map(({ title, value, loading, icon: Icon, href }) => (
          <Link href={href} key={title}>
            <Card className="hover:border-indigo-300 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{value}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* ── Summary metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Platform Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <>
                <p className="text-2xl font-bold">
                  ₹{Math.round(totalRevenuePaise / 100).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">All-time across all bookings</p>
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
                <p className="text-2xl font-bold">{completionRate}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedCount} of {bookings.length} bookings completed
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Monthly Revenue + Bookings by Status ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Revenue (₹) — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    width={45}
                  />
                  <Tooltip
                    formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                  />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
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

      {/* ── Agencies by Status + Category mgmt ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agencies by Status</CardTitle>
          </CardHeader>
          <CardContent>
            {agenciesLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : agencyStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">No agencies yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={agencyStatus}
                    cx="50%"
                    cy="42%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {agencyStatus.map((entry, idx) => (
                      <Cell key={entry.name} fill={color(entry.name.toLowerCase(), idx)} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => [Number(v), "Agencies"]}
                    contentStyle={{ borderRadius: "8px", fontSize: "13px" }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 grid grid-cols-2 gap-3 content-start">
            {[
              { href: "/admin/agencies",    label: "Agencies",    count: agencies.length,    loading: agenciesLoading    },
              { href: "/admin/experiences", label: "Experiences", count: experiences.length, loading: experiencesLoading },
              { href: "/admin/bookings",    label: "Bookings",    count: bookings.length,    loading: bookingsLoading    },
              { href: "/admin/categories",  label: "Categories",  count: categories.length,  loading: categoriesLoading  },
            ].map(({ href, label, count, loading }) => (
              <Link href={href} key={label}>
                <div className="rounded-lg border p-3 hover:bg-muted/40 transition-colors cursor-pointer h-full">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {loading ? (
                    <Skeleton className="h-6 w-10 mt-1" />
                  ) : (
                    <p className="text-xl font-bold mt-0.5">{count}</p>
                  )}
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
