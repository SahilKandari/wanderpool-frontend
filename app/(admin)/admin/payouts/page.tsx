"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2, Clock, IndianRupee, CalendarDays, X, Building2, Banknote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { payoutKeys, adminListPayouts, adminMarkPayoutPaid } from "@/lib/api/payouts";
import { adminListAgencies } from "@/lib/api/admin";
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

export default function AdminPayoutsPage() {
  const qc = useQueryClient();
  const [agencyFilter, setAgencyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [payTarget, setPayTarget] = useState<BookingPayout | null>(null);
  const [refId, setRefId] = useState("");

  const { data: agencies = [] } = useQuery({
    queryKey: ["admin", "agencies", "dropdown"],
    queryFn: () => adminListAgencies(),
  });

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: payoutKeys.adminList(
      agencyFilter !== "all" ? agencyFilter : undefined,
      statusFilter,
      fromDate,
      toDate,
    ),
    queryFn: () => adminListPayouts(
      agencyFilter !== "all" ? agencyFilter : undefined,
      statusFilter,
      fromDate,
      toDate,
    ),
  });

  const markPaidMutation = useMutation({
    mutationFn: (p: BookingPayout) => adminMarkPayoutPaid(p.id, refId.trim()),
    onSuccess: () => {
      toast.success("Payout marked as paid");
      qc.invalidateQueries({ queryKey: payoutKeys.all });
      setPayTarget(null);
      setRefId("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const totalPending = payouts
    .filter(p => p.payout_status === "pending")
    .reduce((s, p) => s + p.operator_payout_paise, 0);
  const totalPaid = payouts
    .filter(p => p.payout_status === "paid")
    .reduce((s, p) => s + p.operator_payout_paise, 0);
  const totalDirectPaid = payouts
    .filter(p => p.payout_status === "direct_payment")
    .reduce((s, p) => s + p.operator_payout_paise, 0);
  const pendingCount = payouts.filter(p => p.payout_status === "pending").length;

  const hasFilters = agencyFilter !== "all" || statusFilter !== "all" || fromDate || toDate;

  const clearFilters = () => {
    setAgencyFilter("all");
    setStatusFilter("all");
    setFromDate("");
    setToDate("");
  };

  return (
    <div>
      <PageHeader title="Payouts" description="Manage operator payout disbursements — per booking" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Pending Amount", value: paiseToCurrency(totalPending), color: "text-amber-600", icon: Clock },
          { label: "Paid Out", value: paiseToCurrency(totalPaid), color: "text-emerald-600", icon: CheckCircle2 },
          { label: "Awaiting Action", value: `${pendingCount} booking${pendingCount !== 1 ? "s" : ""}`, color: "text-foreground", icon: IndianRupee },
          { label: "Direct Paid", value: paiseToCurrency(totalDirectPaid), color: "text-blue-600", icon: Banknote },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Icon className="h-4 w-4" />
              <span className="text-sm">{label}</span>
            </div>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
            {label === "Direct Paid" && (
              <p className="text-xs text-muted-foreground mt-1">Collected directly by agency</p>
            )}
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <Clock className="h-4 w-4 shrink-0" />
          <span>
            <strong>{pendingCount}</strong> completed booking{pendingCount !== 1 ? "s" : ""} pending payout — mark each as paid after bank transfer.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Agency</Label>
          <Select value={agencyFilter} onValueChange={setAgencyFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="All Agencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agencies</SelectItem>
              {agencies.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.business_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
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

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">From</Label>
          <Input type="date" className="w-40" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">To</Label>
          <Input type="date" className="w-40" value={toDate} onChange={e => setToDate(e.target.value)} />
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
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-32" />
            </div>
          ))
        ) : payouts.length === 0 ? (
          <EmptyState title="No payouts found" description="Payouts appear here after bookings are completed." />
        ) : (
          payouts.map(p => (
            <div key={p.id} className="rounded-xl border border-slate-100 bg-white p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-slate-900">{p.agency_name}</p>
                  <p className="text-xs text-slate-500 font-mono">{p.booking_ref}</p>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border shrink-0",
                  payoutStatusStyle(p.payout_status)
                )}>
                  {payoutStatusIcon(p.payout_status)}
                  {payoutStatusLabel(p.payout_status)}
                </span>
              </div>
              <p className="text-sm truncate text-slate-700">{p.experience_title}</p>
              <div className="flex items-center justify-between">
                <p className="text-xl font-bold text-slate-900">{paiseToCurrency(p.operator_payout_paise)}</p>
                <p className="text-xs text-slate-500">{formatDate(p.slot_date)}</p>
              </div>
              {p.payout_status === "pending" && (
                <Button
                  size="sm" variant="outline"
                  className="h-8 w-full text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  onClick={() => { setPayTarget(p); setRefId(""); }}
                >
                  Mark Paid
                </Button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop table */}
      {isLoading ? (
        <div className="hidden sm:block space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : payouts.length === 0 ? (
        <div className="hidden sm:block">
          <EmptyState title="No payouts found" description="Payouts appear here after bookings are completed." />
        </div>
      ) : (
        <div className="hidden sm:block rounded-xl border bg-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Agency</TableHead>
                <TableHead>Booking Ref</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Activity Date</TableHead>
                <TableHead>Customer Paid</TableHead>
                <TableHead>Agency Payout</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map(p => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium">{p.agency_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.booking_ref}
                  </TableCell>
                  <TableCell className="text-sm max-w-40 truncate">
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
                  <TableCell className="text-xs capitalize text-muted-foreground">
                    {p.payment_mode}
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
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {p.payout_reference ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.payout_status === "pending" && (
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => { setPayTarget(p); setRefId(""); }}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Mark paid dialog */}
      <Dialog open={!!payTarget} onOpenChange={open => !open && setPayTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Payout as Paid</DialogTitle>
            <DialogDescription>
              Confirm you have transferred{" "}
              <strong>{payTarget ? paiseToCurrency(payTarget.operator_payout_paise) : ""}</strong>{" "}
              to <strong>{payTarget?.agency_name}</strong> for booking{" "}
              <strong>{payTarget?.booking_ref}</strong> ({payTarget?.experience_title}).
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-1.5">
            <Label>Bank Transfer Reference ID</Label>
            <Input
              placeholder="e.g. NEFT/IMPS transaction ID"
              value={refId}
              onChange={e => setRefId(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button
              disabled={markPaidMutation.isPending}
              onClick={() => payTarget && markPaidMutation.mutate(payTarget)}
            >
              {markPaidMutation.isPending ? "Saving…" : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
