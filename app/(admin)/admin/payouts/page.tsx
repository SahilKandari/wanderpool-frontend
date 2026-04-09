"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2, Clock, TrendingUp, XCircle,
  IndianRupee, CalendarDays, Search, CreditCard, X, Building2,
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
import { paiseToCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { Payout } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

function getPresetRange(preset: string): { from: string; to: string } | null {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
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

export default function AdminPayoutsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [preset, setPreset] = useState("all_time");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [payTarget, setPayTarget] = useState<Payout | null>(null);
  const [refId, setRefId] = useState("");

  const activeRange = preset === "custom"
    ? (customFrom && customTo ? { from: customFrom, to: customTo } : null)
    : preset !== "all_time" ? getPresetRange(preset) : null;

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: payoutKeys.adminList(activeRange?.from, activeRange?.to),
    queryFn: () => adminListPayouts(activeRange?.from, activeRange?.to),
  });

  const markPaidMutation = useMutation({
    mutationFn: (p: Payout) => adminMarkPayoutPaid({
      agency_id: p.agency_id,
      period_start: p.period_start.slice(0, 10),
      period_end: p.period_end.slice(0, 10),
      reference_id: refId.trim(),
    }),
    onSuccess: (data) => {
      toast.success(`Payout marked as paid — ${data.bookings_updated} booking(s) updated`);
      qc.invalidateQueries({ queryKey: payoutKeys.all });
      setPayTarget(null);
      setRefId("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = payouts.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    const q = search.toLowerCase();
    if (q && !p.agency_name.toLowerCase().includes(q) &&
        !p.agency_id.toLowerCase().includes(q) &&
        !(p.reference_id ?? "").toLowerCase().includes(q)) return false;
    return true;
  });

  const totalPending = payouts.filter(p => p.status === "pending" || p.status === "processing")
    .reduce((s, p) => s + p.amount_paise, 0);
  const totalPaid = payouts.filter(p => p.status === "paid")
    .reduce((s, p) => s + p.amount_paise, 0);
  const pendingCount = payouts.filter(p => p.status === "pending").length;

  return (
    <div>
      <PageHeader title="Payouts" description="Manage operator payout disbursements" />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Pending Amount", value: paiseToCurrency(totalPending), color: "text-amber-600", icon: Clock },
          { label: "Paid Out (All Time)", value: paiseToCurrency(totalPaid), color: "text-emerald-600", icon: CheckCircle2 },
          { label: "Awaiting Action", value: `${pendingCount} payouts`, color: "text-foreground", icon: IndianRupee },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-card rounded-xl border p-5">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Icon className="h-4 w-4" />
              <span className="text-sm">{label}</span>
            </div>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <Clock className="h-4 w-4 shrink-0" />
          <span><strong>{pendingCount}</strong> pending payout{pendingCount !== 1 ? "s" : ""} need to be processed and marked as paid.</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search agency or reference…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

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
              <Input type="date" className="w-40" value={customFrom} onChange={e => setCustomFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">To</Label>
              <Input type="date" className="w-40" value={customTo} onChange={e => setCustomTo(e.target.value)} />
            </div>
          </>
        )}

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
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

        {(preset !== "all_time" || statusFilter !== "all" || search) && (
          <Button variant="ghost" size="sm" className="self-end text-muted-foreground"
            onClick={() => { setPreset("all_time"); setStatusFilter("all"); setSearch(""); setCustomFrom(""); setCustomTo(""); }}>
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No payouts found" description="Payouts are created automatically after bookings complete." />
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead>Agency</TableHead>
                <TableHead>Week (Activity Date)</TableHead>
                <TableHead className="text-center">Bookings</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Breakdown</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(payout => (
                <TableRow key={payout.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{payout.agency_name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{payout.agency_id.slice(0, 8)}…</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{formatDate(payout.period_start)} → {formatDate(payout.period_end)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">{payout.booking_count}</TableCell>
                  <TableCell className="font-semibold text-sm">{paiseToCurrency(payout.amount_paise)}</TableCell>
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
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {payout.reference_id ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {payout.paid_at ? formatDate(payout.paid_at) : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {(payout.status === "pending" || payout.status === "processing") && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => { setPayTarget(payout); setRefId(""); }}
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
              <strong>{payTarget ? paiseToCurrency(payTarget.amount_paise) : ""}</strong>{" "}
              to <strong>{payTarget?.agency_name}</strong> for the period{" "}
              {payTarget ? `${formatDate(payTarget.period_start)} – ${formatDate(payTarget.period_end)}` : ""}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-1.5">
            <Label>Bank Transfer Reference ID <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. NEFT/IMPS transaction ID"
              value={refId}
              onChange={e => setRefId(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This reference is stored against all {payTarget?.booking_count} booking(s) in this period.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button
              disabled={!refId.trim() || markPaidMutation.isPending}
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
