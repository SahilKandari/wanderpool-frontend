"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard, Clock, CheckCircle2, XCircle, TrendingUp,
  IndianRupee, CalendarDays, X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { payoutKeys, listMyPayouts } from "@/lib/api/payouts";
import { paiseToCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { Payout } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

function getPresetRange(preset: string): { from: string; to: string } | null {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  // Monday of current week
  const day = now.getDay();
  const diffToMon = day === 0 ? 6 : day - 1;
  const thisMonday = new Date(now); thisMonday.setDate(now.getDate() - diffToMon); thisMonday.setHours(0,0,0,0);
  const thisSunday = new Date(thisMonday); thisSunday.setDate(thisMonday.getDate() + 6);
  if (preset === "this_week") {
    return { from: fmt(thisMonday), to: fmt(thisSunday) };
  }
  if (preset === "last_week") {
    const mon = new Date(thisMonday); mon.setDate(thisMonday.getDate() - 7);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { from: fmt(mon), to: fmt(sun) };
  }
  if (preset === "last_4_weeks") {
    const mon = new Date(thisMonday); mon.setDate(thisMonday.getDate() - 21);
    return { from: fmt(mon), to: fmt(thisSunday) };
  }
  return null;
}

function statusStyle(status: Payout["status"]) {
  switch (status) {
    case "paid":       return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":    return "bg-amber-50 text-amber-700 border-amber-200";
    case "processing": return "bg-blue-50 text-blue-700 border-blue-200";
    case "failed":     return "bg-red-50 text-red-700 border-red-200";
  }
}

function statusIcon(status: Payout["status"]) {
  switch (status) {
    case "paid":       return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "pending":    return <Clock className="h-3.5 w-3.5" />;
    case "processing": return <TrendingUp className="h-3.5 w-3.5" />;
    case "failed":     return <XCircle className="h-3.5 w-3.5" />;
  }
}

export default function AgencyPayoutsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [preset, setPreset] = useState("all_time");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const activeRange = preset === "custom"
    ? (customFrom && customTo ? { from: customFrom, to: customTo } : null)
    : preset !== "all_time" ? getPresetRange(preset) : null;

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: payoutKeys.list(activeRange?.from, activeRange?.to),
    queryFn: () => listMyPayouts(activeRange?.from, activeRange?.to),
  });

  const filtered = statusFilter === "all"
    ? payouts
    : payouts.filter(p => p.status === statusFilter);

  const totalEarned = payouts
    .filter(p => p.status === "paid")
    .reduce((s, p) => s + p.amount_paise, 0);

  const totalPending = payouts
    .filter(p => p.status === "pending" || p.status === "processing")
    .reduce((s, p) => s + p.amount_paise, 0);

  const lastPayout = payouts
    .filter(p => p.status === "paid" && p.paid_at)
    .sort((a, b) => new Date(b.paid_at!).getTime() - new Date(a.paid_at!).getTime())[0];

  return (
    <div>
      <PageHeader
        title="Earnings"
        description="Your weekly earnings from WanderPool — grouped by activity date"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <IndianRupee className="h-4 w-4" />
            <span className="text-sm font-medium">Total Earned</span>
          </div>
          {isLoading ? <Skeleton className="h-7 w-28" /> : (
            <p className="text-2xl font-bold text-emerald-600">{paiseToCurrency(totalEarned)}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">All time paid payouts</p>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Pending</span>
          </div>
          {isLoading ? <Skeleton className="h-7 w-28" /> : (
            <p className="text-2xl font-bold text-amber-600">{paiseToCurrency(totalPending)}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Awaiting processing</p>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm font-medium">Last Payout</span>
          </div>
          {isLoading ? <Skeleton className="h-7 w-28" /> : (
            <p className="text-2xl font-bold text-foreground">
              {lastPayout ? formatDate(lastPayout.paid_at!) : "—"}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {lastPayout ? paiseToCurrency(lastPayout.amount_paise) : "No payouts yet"}
          </p>
        </div>
      </div>

      {/* Pending banner */}
      {totalPending > 0 && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            <strong>{paiseToCurrency(totalPending)}</strong> pending — typically processed within 3 business days of activity completion.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Period</Label>
          <Select value={preset} onValueChange={(v) => {
            setPreset(v);
            if (v !== "custom") { setCustomFrom(""); setCustomTo(""); }
          }}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_time">All Time</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="last_week">Last Week</SelectItem>
              <SelectItem value="last_4_weeks">Last 4 Weeks</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {preset === "custom" && (
          <>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">From</Label>
              <Input type="date" className="w-full sm:w-40" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input type="date" className="w-full sm:w-40" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          </>
        )}

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(preset !== "all_time" || statusFilter !== "all") && (
          <Button variant="ghost" size="sm" className="self-end text-muted-foreground"
            onClick={() => { setPreset("all_time"); setStatusFilter("all"); setCustomFrom(""); setCustomTo(""); }}>
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}

        <span className="text-sm text-muted-foreground ml-auto self-end">
          {filtered.length} payout{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Mobile card list — visible below sm */}
      <div className="block sm:hidden space-y-3 mb-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No payouts found"
            description={statusFilter === "all" ? "Your payout history will appear here after your first completed booking." : `No ${statusFilter} payouts for this period.`}
          />
        ) : (
          filtered.map(payout => (
            <div key={payout.id} className="rounded-xl border border-slate-100 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  <span>{formatDate(payout.period_start)} → {formatDate(payout.period_end)}</span>
                </div>
                <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border capitalize", statusStyle(payout.status))}>
                  {statusIcon(payout.status)}
                  {payout.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-slate-900">{paiseToCurrency(payout.amount_paise)}</p>
                <p className="text-xs text-slate-500">{payout.booking_count} booking{payout.booking_count !== 1 ? "s" : ""}</p>
              </div>
              {payout.paid_at && (
                <p className="text-xs text-muted-foreground">Paid {formatDate(payout.paid_at)}</p>
              )}
              {payout.reference_id && (
                <p className="text-xs font-mono text-muted-foreground">Ref: {payout.reference_id}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop table — hidden below sm */}
      {isLoading ? (
        <div className="hidden sm:block space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="hidden sm:block">
          <EmptyState
            title="No payouts found"
            description={statusFilter === "all" ? "Your payout history will appear here after your first completed booking." : `No ${statusFilter} payouts for this period.`}
          />
        </div>
      ) : (
        <div className="hidden sm:block rounded-xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Week (Activity Date)</TableHead>
                <TableHead className="text-center">Bookings</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Breakdown</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Paid Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(payout => (
                <TableRow key={payout.id}>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{formatDate(payout.period_start)} → {formatDate(payout.period_end)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm font-medium">
                    {payout.booking_count}
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {paiseToCurrency(payout.amount_paise)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {payout.partial_payment_paise > 0 ? (
                      <div className="space-y-0.5">
                        <p>Full: {paiseToCurrency(payout.full_payment_paise)}</p>
                        <p className="text-blue-600">Partial: {paiseToCurrency(payout.partial_payment_paise)}</p>
                      </div>
                    ) : "—"}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
                      statusStyle(payout.status)
                    )}>
                      {statusIcon(payout.status)}
                      {payout.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-mono text-muted-foreground">
                    {payout.reference_id ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {payout.paid_at ? formatDate(payout.paid_at) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4 text-center">
        WanderPool retains a 12–15% platform fee. You receive 85–88% of each booking value.
        Partial payments are prorated accordingly.
      </p>
    </div>
  );
}
