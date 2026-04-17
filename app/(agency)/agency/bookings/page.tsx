"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  Ban,
  TicketCheck,
  Banknote,
  CreditCard,
  UserCheck,
  Play,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { BookingStatusBadge } from "@/components/shared/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { bookingKeys, listMyBookings, cancelBooking, agencyCollectCash, assignGuide } from "@/lib/api/bookings";
import { guideKeys, listGuides } from "@/lib/api/guides";
import type { Booking, BookingStatus, Operator } from "@/lib/types/booking";
import { paiseToCurrency } from "@/lib/utils/currency";
import { formatDate, formatDatetime } from "@/lib/utils/date";
import { cn } from "@/lib/utils";

// ─── Stat card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  loading: boolean;
  className?: string;
}

function StatCard({ title, value, icon: Icon, loading, className }: StatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <p className="text-2xl font-bold">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Detail dialog ────────────────────────────────────────────────────────────

function BookingDetailDialog({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  // Always initialise from the booking's current operator so dropdown shows the right value
  const [pendingOperator, setPendingOperator] = useState<string>("");
  const [confirmReassign, setConfirmReassign] = useState(false);
  const [confirmCash, setConfirmCash] = useState(false);

  // Reset local state whenever a different booking is opened
  const bookingId = booking?.id;
  const currentOperatorId = booking?.operator_id ?? "";
  // When booking changes, reset selection to the current assignment
  if (pendingOperator === "" && currentOperatorId) {
    // leave as empty so the Select falls back to currentOperatorId as default
  }

  const { data: guides = [] } = useQuery<Operator[]>({
    queryKey: guideKeys.list(),
    queryFn: listGuides,
    enabled: !!booking && booking.status === "confirmed",
  });

  const assignMutation = useMutation({
    mutationFn: (operatorId: string | null) =>
      assignGuide(bookingId!, operatorId),
    onSuccess: (updated) => {
      toast.success(updated.operator_id ? "Guide assigned" : "Guide unassigned");
      // Reset pendingOperator so dropdownValue falls back to currentOperatorId from the refetched booking
      setPendingOperator(updated.operator_id ?? "unassigned");
      setConfirmReassign(false);
      qc.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const collectCashMutation = useMutation({
    mutationFn: () => agencyCollectCash(bookingId!),
    onSuccess: () => {
      toast.success("Cash collected — booking fully settled");
      setConfirmCash(false);
      qc.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!booking) return null;

  const activeGuides = guides.filter((g) => g.status === "active");
  // The value shown in the dropdown: prefer local pending selection, fall back to saved value, then "unassigned"
  const dropdownValue = pendingOperator !== "" ? pendingOperator : (currentOperatorId || "unassigned");
  const hasChanged = dropdownValue !== (currentOperatorId || "unassigned");
  const activityStarted = !!booking.activity_started_at;
  const cashPending =
    booking.payment_mode === "partial" &&
    (booking.amount_paid_paise ?? 0) < booking.total_paise;

  function handleAssignClick() {
    // If activity already started and we're changing the guide, ask for confirmation
    if (activityStarted && hasChanged) {
      setConfirmReassign(true);
      return;
    }
    doAssign();
  }

  function doAssign() {
    const value = dropdownValue === "unassigned" ? null : dropdownValue;
    assignMutation.mutate(value);
  }

  return (
    <Dialog open={!!booking} onOpenChange={(open) => { if (!open) { setPendingOperator(""); setConfirmReassign(false); setConfirmCash(false); onClose(); } }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TicketCheck className="h-5 w-5" />
            Booking #{booking.booking_code}
          </DialogTitle>
          <DialogDescription>Full booking details</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {/* Status row */}
          <div className="flex items-center gap-2 flex-wrap">
            <BookingStatusBadge status={booking.status} />
            <Badge variant="outline" className="capitalize">
              {booking.payment_status.replace("_", " ")}
            </Badge>
            {booking.activity_completed_at && (
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1">
                <CheckCheck className="h-3 w-3" />Activity Completed
              </Badge>
            )}
            {booking.activity_started_at && !booking.activity_completed_at && (
              <Badge className="bg-blue-100 text-blue-800 border-blue-200 gap-1">
                <Play className="h-3 w-3" />Activity In Progress
              </Badge>
            )}
          </div>

          {/* Customer */}
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Customer</p>
            <p className="font-medium">{booking.customer_name}</p>
            <p className="text-muted-foreground">{booking.customer_email}</p>
            <p className="text-muted-foreground">{booking.customer_phone}</p>
          </div>

          {/* Experience */}
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Experience</p>
            <p className="font-medium">{booking.experience_title}</p>
            <p className="text-muted-foreground">
              {formatDate(booking.slot_date)} at {booking.slot_start_time}
            </p>
            <p className="text-muted-foreground">
              {booking.participants} participant{booking.participants !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Guide assignment — confirmed bookings only */}
          {booking.status === "confirmed" && (
            <div className="rounded-lg border p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Assigned Guide</p>
              {activityStarted && (
                <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Activity has already started. Reassigning the guide will notify them.
                </div>
              )}
              {activeGuides.length === 0 ? (
                <p className="text-muted-foreground text-xs">No active guides in your team.</p>
              ) : confirmReassign ? (
                <div className="space-y-2">
                  <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    The activity is in progress. Are you sure you want to reassign the guide?
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8" onClick={() => setConfirmReassign(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" className="h-8" disabled={assignMutation.isPending} onClick={doAssign}>
                      {assignMutation.isPending ? "Saving…" : "Yes, Reassign"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={dropdownValue} onValueChange={setPendingOperator}>
                    <SelectTrigger className="flex-1 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">— Unassigned —</SelectItem>
                      {activeGuides.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    className="h-8"
                    disabled={assignMutation.isPending || !hasChanged}
                    onClick={handleAssignClick}
                  >
                    <UserCheck className="h-3.5 w-3.5 mr-1" />
                    {assignMutation.isPending ? "Saving…" : "Save"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Cash collection — agency can also collect */}
          {cashPending && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <div className="flex items-start gap-2.5">
                <Banknote className="h-4 w-4 mt-0.5 shrink-0 text-amber-700" />
                <div className="flex-1">
                  <p className="font-medium text-amber-800">Cash due on arrival</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Collect {paiseToCurrency(booking.total_paise - (booking.amount_paid_paise ?? 0))} from the customer
                  </p>
                </div>
                {!confirmCash && (
                  <Button
                    size="sm"
                    className="h-8 shrink-0"
                    onClick={() => setConfirmCash(true)}
                  >
                    Mark Collected
                  </Button>
                )}
              </div>
              {confirmCash && (
                <div className="border-t border-amber-200 pt-2 space-y-2">
                  <p className="text-xs text-amber-800 font-medium">
                    Confirm you have received {paiseToCurrency(booking.total_paise - (booking.amount_paid_paise ?? 0))} in cash from {booking.customer_name}?
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-8" onClick={() => setConfirmCash(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-8"
                      disabled={collectCashMutation.isPending}
                      onClick={() => collectCashMutation.mutate()}
                    >
                      {collectCashMutation.isPending ? "Marking…" : "Yes, Collected"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
          {!cashPending && booking.payment_mode === "partial" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2.5 text-sm text-emerald-800">
              <Banknote className="h-4 w-4 shrink-0" />
              <p className="font-medium">Fully settled — cash collected on-site</p>
            </div>
          )}
          {booking.payment_mode === "full" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2.5 text-sm text-emerald-800">
              <CreditCard className="h-4 w-4 shrink-0" />
              <p className="font-medium">Fully paid online</p>
            </div>
          )}

          {/* Financials */}
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Financials</p>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">{paiseToCurrency(booking.total_paise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid online</span>
              <span>{paiseToCurrency(booking.amount_paid_paise ?? 0)}</span>
            </div>
            {cashPending && (
              <div className="flex justify-between text-amber-700 font-medium">
                <span>Cash to collect</span>
                <span>{paiseToCurrency(booking.total_paise - (booking.amount_paid_paise ?? 0))}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform fee</span>
              <span>{paiseToCurrency(booking.platform_fee_paise)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">Your payout</span>
              <span className="font-semibold text-green-600">{paiseToCurrency(booking.operator_payout_paise)}</span>
            </div>
          </div>

          {/* Activity timeline */}
          {(booking.activity_started_at || booking.activity_completed_at) && (
            <div className="rounded-lg border p-3 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Activity Timeline</p>
              {booking.activity_started_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><Play className="h-3 w-3" />Started</span>
                  <span>{formatDatetime(booking.activity_started_at)}</span>
                </div>
              )}
              {booking.activity_completed_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground flex items-center gap-1"><CheckCheck className="h-3 w-3" />Completed</span>
                  <span>{formatDatetime(booking.activity_completed_at)}</span>
                </div>
              )}
            </div>
          )}

          {booking.notes && (
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
              <p className="text-muted-foreground">{booking.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { setPendingOperator(""); setConfirmReassign(false); setConfirmCash(false); onClose(); }}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Cancel dialog ────────────────────────────────────────────────────────────

function CancelDialog({
  booking,
  onClose,
}: {
  booking: Booking | null;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id, reason.trim() || undefined),
    onSuccess: () => {
      toast.success("Booking cancelled");
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!booking) return null;

  return (
    <Dialog open={!!booking} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            Cancel booking <span className="font-mono font-medium">{booking.booking_code}</span>{" "}
            for {booking.customer_name}? This may trigger a refund depending on
            the cancellation policy.
          </DialogDescription>
        </DialogHeader>

        <div>
          <label className="text-sm font-medium mb-1.5 block">
            Reason{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            className={cn(
              "w-full min-h-20 rounded-md border border-input bg-transparent px-3 py-2 text-sm",
              "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              "resize-none"
            )}
            placeholder="Reason for cancellation…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate(booking.id)}
          >
            {mutation.isPending ? "Cancelling…" : "Cancel Booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function TableSkeletonRows() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          {[...Array(10)].map((_, j) => (
            <TableCell key={j}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type StatusFilter = BookingStatus | "all";

export default function AgencyBookingsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [viewBookingId, setViewBookingId] = useState<string | null>(null);
  const [cancelBookingTarget, setCancelBookingTarget] = useState<Booking | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: bookingKeys.mine(),
    queryFn: () => listMyBookings(),
  });

  // Client-side filtering
  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (dateFrom && b.slot_date < dateFrom) return false;
      if (dateTo && b.slot_date > dateTo) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !b.customer_name.toLowerCase().includes(q) &&
          !b.booking_code.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [bookings, statusFilter, dateFrom, dateTo, search]);

  // Derive live booking from query data so the dialog always shows fresh data after mutations
  const viewBooking = viewBookingId ? (bookings.find((b) => b.id === viewBookingId) ?? null) : null;

  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === "confirmed").length;
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  const canCancel = (status: BookingStatus) =>
    status === "pending" || status === "confirmed";

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Manage all your experience bookings"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total"
          value={totalCount}
          icon={TicketCheck}
          loading={isLoading}
        />
        <StatCard
          title="Confirmed"
          value={confirmedCount}
          icon={CheckCircle2}
          loading={isLoading}
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon={Clock}
          loading={isLoading}
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={Calendar}
          loading={isLoading}
        />
      </div>

      {/* Filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search customer or booking code…"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            type="date"
            className="w-full sm:w-38"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="From date"
          />
          <Input
            type="date"
            className="w-full sm:w-38"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="To date"
          />
        </div>
      </div>

      {/* Mobile card list — visible below sm */}
      <div className="block sm:hidden space-y-3">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {bookings.length === 0 ? "No bookings yet." : "No bookings match your filters."}
          </div>
        ) : (
          filtered.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-slate-100 bg-white p-4 space-y-2 active:bg-slate-50"
              onClick={() => setViewBookingId(b.id)}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-medium text-slate-500">{b.booking_code}</span>
                <BookingStatusBadge status={b.status} />
              </div>
              <p className="font-semibold text-sm text-slate-900 truncate">{b.experience_title}</p>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{formatDate(b.slot_date)} · {b.slot_start_time}</span>
                <span className="font-semibold text-slate-700">{paiseToCurrency(b.total_paise)}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">{b.customer_name} · {b.participants} pax</p>
                {canCancel(b.status) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setCancelBookingTarget(b); }}
                  >
                    <Ban className="h-3 w-3 mr-1" />Cancel
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table — hidden below sm */}
      <div className="hidden sm:block rounded-lg border bg-background overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Booking Code</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Date &amp; Time</TableHead>
              <TableHead className="text-right">Pax</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableSkeletonRows />
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={10}
                  className="text-center py-12 text-muted-foreground text-sm"
                >
                  {bookings.length === 0
                    ? "No bookings yet."
                    : "No bookings match your filters."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <span className="font-mono text-xs font-medium">
                      {b.booking_code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{b.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.customer_email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm max-w-40 truncate">
                      {b.experience_title}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{formatDate(b.slot_date)}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.slot_start_time}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {b.participants}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {paiseToCurrency(b.total_paise)}
                  </TableCell>
                  <TableCell>
                    {b.payment_mode === "partial" ? (
                      (b.amount_paid_paise ?? 0) >= b.total_paise ? (
                        <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 gap-1">
                          <Banknote className="h-3 w-3" />Cash collected
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 gap-1">
                          <Banknote className="h-3 w-3" />Cash pending
                        </Badge>
                      )
                    ) : (
                      <Badge variant="outline" className="text-slate-600 gap-1">
                        <CreditCard className="h-3 w-3" />Online
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <BookingStatusBadge status={b.status} />
                  </TableCell>
                  <TableCell>
                    {b.activity_completed_at ? (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-200 bg-emerald-50 gap-1 text-xs">
                        <CheckCheck className="h-3 w-3" />Completed
                      </Badge>
                    ) : b.activity_started_at ? (
                      <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 gap-1 text-xs">
                        <Play className="h-3 w-3" />In Progress
                      </Badge>
                    ) : b.status === "confirmed" ? (
                      <span className="text-xs text-muted-foreground">Not started</span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewBookingId(b.id)}
                        className="h-8 px-2"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View
                      </Button>
                      {canCancel(b.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          onClick={() => setCancelBookingTarget(b)}
                        >
                          <Ban className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <BookingDetailDialog
        booking={viewBooking}
        onClose={() => setViewBookingId(null)}
      />
      <CancelDialog
        booking={cancelBookingTarget}
        onClose={() => setCancelBookingTarget(null)}
      />
    </div>
  );
}
