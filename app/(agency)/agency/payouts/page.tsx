"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CreditCard, Clock, CheckCircle2, XCircle, TrendingUp,
  IndianRupee, CalendarDays,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { payoutKeys, listMyPayouts } from "@/lib/api/payouts";
import { paiseToCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { Payout } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

function statusStyle(status: Payout["status"]) {
  switch (status) {
    case "paid": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending": return "bg-amber-50 text-amber-700 border-amber-200";
    case "processing": return "bg-blue-50 text-blue-700 border-blue-200";
    case "failed": return "bg-red-50 text-red-700 border-red-200";
  }
}

function statusIcon(status: Payout["status"]) {
  switch (status) {
    case "paid": return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "pending": return <Clock className="h-3.5 w-3.5" />;
    case "processing": return <TrendingUp className="h-3.5 w-3.5" />;
    case "failed": return <XCircle className="h-3.5 w-3.5" />;
  }
}

export default function AgencyPayoutsPage() {
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: payoutKeys.list(),
    queryFn: listMyPayouts,
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
        title="Payouts"
        description="Your earnings and payout history from WanderPool"
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

      {/* Filter */}
      <div className="flex items-center gap-3 mb-5">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payouts</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          {filtered.length} payout{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No payouts found"
          description={statusFilter === "all" ? "Your payout history will appear here after your first completed booking." : `No ${statusFilter} payouts.`}
        />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Period</TableHead>
                <TableHead className="text-center">Bookings</TableHead>
                <TableHead>Amount</TableHead>
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

      {/* Info note */}
      <p className="text-xs text-muted-foreground mt-4 text-center">
        WanderPool retains a 12–15% platform fee. You receive 85–88% of each booking value.
      </p>
    </div>
  );
}
