"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Clock, CheckCircle2, IndianRupee, CalendarDays, X, Banknote,
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
import type { BookingPayout } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

function payoutStatusStyle(status: BookingPayout["payout_status"]) {
  switch (status) {
    case "paid":           return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "pending":        return "bg-amber-50 text-amber-700 border-amber-200";
    case "not_due":        return "bg-slate-50 text-slate-500 border-slate-200";
    case "direct_payment": return "bg-blue-50 text-blue-600 border-blue-200";
  }
}

function payoutStatusLabel(status: BookingPayout["payout_status"]) {
  switch (status) {
    case "paid":           return "Paid";
    case "pending":        return "Awaiting Payout";
    case "not_due":        return "Activity Pending";
    case "direct_payment": return "Direct Payment";
  }
}

function payoutStatusIcon(status: BookingPayout["payout_status"]) {
  switch (status) {
    case "paid":           return <CheckCircle2 className="h-3.5 w-3.5" />;
    case "pending":        return <Clock className="h-3.5 w-3.5" />;
    case "not_due":        return <CalendarDays className="h-3.5 w-3.5" />;
    case "direct_payment": return <Banknote className="h-3.5 w-3.5" />;
  }
}

export default function AgencyPayoutsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: payoutKeys.list(statusFilter, fromDate, toDate),
    queryFn: () => listMyPayouts(statusFilter, fromDate, toDate),
  });

  const totalEarned = payouts
    .filter(p => p.payout_status === "paid")
    .reduce((s, p) => s + p.operator_payout_paise, 0);

  const totalPending = payouts
    .filter(p => p.payout_status === "pending")
    .reduce((s, p) => s + p.operator_payout_paise, 0);

  const totalDirectReceived = payouts
    .filter(p => p.payout_status === "direct_payment")
    .reduce((s, p) => s + p.operator_payout_paise, 0);

  const hasFilters = statusFilter !== "all" || fromDate || toDate;

  const clearFilters = () => {
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div>
      <PageHeader
        title="Earnings"
        description="Your earnings per booking — paid out after activity completion"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <IndianRupee className="h-4 w-4" />
            <span className="text-sm font-medium">Total Paid Out</span>
          </div>
          {isLoading ? <Skeleton className="h-7 w-28" /> : (
            <p className="text-2xl font-bold text-emerald-600">{paiseToCurrency(totalEarned)}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {payouts.filter(p => p.payout_status === "paid").length} bookings paid
          </p>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Pending Payout</span>
          </div>
          {isLoading ? <Skeleton className="h-7 w-28" /> : (
            <p className="text-2xl font-bold text-amber-600">{paiseToCurrency(totalPending)}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {payouts.filter(p => p.payout_status === "pending").length} completed bookings awaiting transfer
          </p>
        </div>

        <div className="bg-card rounded-xl border p-5">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Banknote className="h-4 w-4" />
            <span className="text-sm font-medium">Direct Received</span>
          </div>
          {isLoading ? <Skeleton className="h-7 w-28" /> : (
            <p className="text-2xl font-bold text-blue-600">{paiseToCurrency(totalDirectReceived)}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Collected directly from customer</p>
        </div>
      </div>

      {/* Pending banner */}
      {totalPending > 0 && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            <strong>{paiseToCurrency(totalPending)}</strong> pending — processed within 3 business days of activity completion.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input type="date" className="w-40" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input type="date" className="w-40" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Payout Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Awaiting Payout</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="self-end text-muted-foreground" onClick={clearFilters}>
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto self-end">
          {payouts.length} booking{payouts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Mobile cards */}
      <div className="block sm:hidden space-y-3 mb-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))
        ) : payouts.length === 0 ? (
          <EmptyState
            title="No earnings found"
            description="Your earnings will appear here after your first completed booking."
          />
        ) : (
          payouts.map(p => (
            <div key={p.id} className="rounded-xl border border-slate-100 bg-white p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-slate-500">{p.booking_ref}</p>
                <span className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                  payoutStatusStyle(p.payout_status)
                )}>
                  {payoutStatusIcon(p.payout_status)}
                  {payoutStatusLabel(p.payout_status)}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-900 truncate">{p.experience_title}</p>
              <div className="flex items-center justify-between">
                <p className={cn("text-xl font-bold", p.payout_status === "direct_payment" ? "text-blue-600" : "text-slate-900")}>
                  {paiseToCurrency(p.operator_payout_paise)}
                  {p.payout_status === "direct_payment" && (
                    <span className="text-xs font-normal text-muted-foreground ml-1">(direct)</span>
                  )}
                </p>
                <div className="text-right text-xs text-slate-500">
                  <p>{formatDate(p.slot_date)}</p>
                  <p className="capitalize">{p.payment_mode} payment</p>
                </div>
              </div>
              {p.payout_reference && (
                <p className="text-xs font-mono text-muted-foreground">Ref: {p.payout_reference}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      {isLoading ? (
        <div className="hidden sm:block space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : payouts.length === 0 ? (
        <div className="hidden sm:block">
          <EmptyState
            title="No earnings found"
            description="Your earnings will appear here after your first completed booking."
          />
        </div>
      ) : (
        <div className="hidden sm:block rounded-xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Booking Ref</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Activity Date</TableHead>
                <TableHead>Customer Paid</TableHead>
                <TableHead>Your Earnings</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.booking_ref}
                  </TableCell>
                  <TableCell className="text-sm font-medium max-w-45 truncate">
                    {p.experience_title}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(p.slot_date)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {paiseToCurrency(p.amount_paid_paise)}
                    {p.payment_mode === "partial" && (
                      <span className="text-xs text-blue-600 ml-1">(partial)</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-sm">
                    {p.payout_status === "direct_payment" ? (
                      <span className="text-blue-600">
                        {paiseToCurrency(p.operator_payout_paise)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">(direct)</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700">{paiseToCurrency(p.operator_payout_paise)}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize text-xs text-muted-foreground">{p.payment_mode}</span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
                      payoutStatusStyle(p.payout_status)
                    )}>
                      {payoutStatusIcon(p.payout_status)}
                      {payoutStatusLabel(p.payout_status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">
                    {p.payout_reference ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-4 text-center">
        WanderPool retains a 12–15% platform fee. You receive 85–88% of each booking value.
        The platform fee is non-refundable. Partial payment bookings are collected directly from the customer — WanderPool does not disburse a separate payout for these.
      </p>
    </div>
  );
}
