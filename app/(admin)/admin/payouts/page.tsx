"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CheckCircle2, Clock, TrendingUp, XCircle,
  IndianRupee, CalendarDays, Search,
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
  const [payTarget, setPayTarget] = useState<Payout | null>(null);
  const [refId, setRefId] = useState("");

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: payoutKeys.adminList(),
    queryFn: adminListPayouts,
  });

  const markPaidMutation = useMutation({
    mutationFn: ({ id, ref }: { id: string; ref: string }) =>
      adminMarkPayoutPaid(id, ref),
    onSuccess: () => {
      toast.success("Payout marked as paid");
      qc.invalidateQueries({ queryKey: payoutKeys.all });
      setPayTarget(null);
      setRefId("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = payouts.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (search && !p.agency_id.toLowerCase().includes(search.toLowerCase()) &&
        !(p.reference_id ?? "").toLowerCase().includes(search.toLowerCase())) return false;
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
      <div className="grid grid-cols-3 gap-4 mb-6">
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

      {/* Pending banner */}
      {pendingCount > 0 && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <Clock className="h-4 w-4 shrink-0" />
          <span><strong>{pendingCount}</strong> pending payout{pendingCount !== 1 ? "s" : ""} need to be processed and marked as paid.</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by agency or reference…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
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
                <TableHead>Period</TableHead>
                <TableHead className="text-center">Bookings</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(payout => (
                <TableRow key={payout.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {payout.agency_id.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{formatDate(payout.period_start)} → {formatDate(payout.period_end)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">{payout.booking_count}</TableCell>
                  <TableCell className="font-semibold text-sm">{paiseToCurrency(payout.amount_paise)}</TableCell>
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
                    {payout.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => setPayTarget(payout)}
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
              Confirm you have transferred {payTarget ? paiseToCurrency(payTarget.amount_paise) : ""} to the operator&apos;s bank account.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-1.5">
            <Label>Bank Transfer Reference ID <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. NEFT/IMPS transaction ID"
              value={refId}
              onChange={e => setRefId(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)}>Cancel</Button>
            <Button
              disabled={!refId.trim() || markPaidMutation.isPending}
              onClick={() => payTarget && markPaidMutation.mutate({ id: payTarget.id, ref: refId })}
            >
              {markPaidMutation.isPending ? "Saving…" : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
