"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, Clock, Users, Phone, CheckCircle2, PlayCircle, Banknote, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { BookingStatusBadge } from "@/components/shared/StatusBadge";
import {
  bookingKeys,
  listOperatorBookings,
  markBookingStarted,
  markBookingCompleted,
  collectCash,
} from "@/lib/api/bookings";
import { formatDate } from "@/lib/utils/date";
import type { Booking } from "@/lib/types/booking";

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function filterBookings(bookings: Booking[], tab: string): Booking[] {
  const today = todayISO();
  switch (tab) {
    case "today":
      return bookings.filter((b) => b.slot_date === today);
    case "upcoming":
      return bookings.filter(
        (b) => b.slot_date > today && b.status === "confirmed"
      );
    case "completed":
      return bookings.filter((b) => b.status === "completed");
    default:
      return bookings;
  }
}

// ── Booking Card ──────────────────────────────────────────────────────────────

function paiseFmt(p: number) {
  return `₹${Math.round(p / 100).toLocaleString("en-IN")}`;
}

function BookingCard({
  booking,
  onStart,
  onComplete,
  onCollectCash,
  isStarting,
  isCompleting,
  isCollecting,
}: {
  booking: Booking;
  onStart: () => void;
  onComplete: () => void;
  onCollectCash: () => void;
  isStarting: boolean;
  isCompleting: boolean;
  isCollecting: boolean;
}) {
  const [confirmCash, setConfirmCash] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);

  const isPartial = booking.payment_mode === "partial";
  const cashPending = isPartial && (booking.amount_paid_paise ?? 0) < booking.total_paise;
  const cashToCollect = booking.total_paise - (booking.amount_paid_paise ?? 0);

  const canStart = booking.status === "confirmed" && !booking.activity_started_at;
  const canComplete = !!booking.activity_started_at && !booking.activity_completed_at;

  return (
    <div className="bg-card border rounded-xl p-5 space-y-4 hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-sm leading-snug flex-1">
          {booking.experience_title}
        </h3>
        <Badge variant="outline" className="font-mono text-xs shrink-0">
          {booking.booking_code}
        </Badge>
      </div>

      {/* Cash-due alert — shown before activity starts */}
      {cashPending && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm">
          <Banknote className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800">
              Collect {paiseFmt(cashToCollect)} cash
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Customer paid {paiseFmt(booking.amount_paid_paise ?? 0)} online (platform fee).
              Remaining is due from the customer before starting.
            </p>
          </div>
        </div>
      )}

      {/* Cash collected badge */}
      {isPartial && !cashPending && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-medium">Cash collected — fully settled</span>
        </div>
      )}

      {/* Online full payment */}
      {!isPartial && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 border px-3 py-2 text-xs text-muted-foreground">
          <CreditCard className="h-3.5 w-3.5 shrink-0" />
          <span>Fully paid online — {paiseFmt(booking.total_paise)}</span>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" />
          <span>{formatDate(booking.slot_date)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          <span>{booking.slot_start_time}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Users className="h-3.5 w-3.5 shrink-0" />
          <span>{booking.participants} participant{booking.participants !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span>{booking.customer_phone}</span>
        </div>
      </div>

      {/* Customer name */}
      <p className="text-sm font-medium">{booking.customer_name}</p>

      {/* Footer row */}
      <div className="flex flex-col gap-2 pt-1 border-t">
        <div className="flex items-center justify-between">
          <BookingStatusBadge status={booking.status} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Collect cash before starting */}
          {cashPending && canStart && !confirmCash && (
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
              onClick={() => setConfirmCash(true)}
            >
              <Banknote className="mr-1.5 h-3.5 w-3.5" />
              {`Confirm Cash (${paiseFmt(cashToCollect)})`}
            </Button>
          )}
          {cashPending && canStart && confirmCash && (
            <div className="w-full rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-xs font-medium text-amber-800">
                Confirm you have received {paiseFmt(cashToCollect)} in cash from {booking.customer_name}?
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7" onClick={() => setConfirmCash(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 bg-amber-600 hover:bg-amber-700 text-white"
                  disabled={isCollecting}
                  onClick={() => { onCollectCash(); setConfirmCash(false); }}
                >
                  {isCollecting ? "Confirming…" : "Yes, Collected"}
                </Button>
              </div>
            </div>
          )}
          {canStart && !cashPending && !confirmStart && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setConfirmStart(true)}
            >
              <PlayCircle className="mr-1.5 h-3.5 w-3.5" />
              Mark as Started
            </Button>
          )}
          {canStart && !cashPending && confirmStart && (
            <div className="w-full rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
              <p className="text-xs font-medium text-emerald-800">
                Confirm the activity for {booking.customer_name} has started?
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7" onClick={() => setConfirmStart(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={isStarting}
                  onClick={() => { onStart(); setConfirmStart(false); }}
                >
                  {isStarting ? "Starting…" : "Yes, Start Activity"}
                </Button>
              </div>
            </div>
          )}
          {canComplete && !confirmComplete && (
            <Button
              size="sm"
              onClick={() => setConfirmComplete(true)}
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Mark as Completed
            </Button>
          )}
          {canComplete && confirmComplete && (
            <div className="w-full rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
              <p className="text-xs font-medium text-blue-800">
                Confirm the activity for {booking.customer_name} is fully completed?
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7" onClick={() => setConfirmComplete(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7"
                  disabled={isCompleting}
                  onClick={() => { onComplete(); setConfirmComplete(false); }}
                >
                  {isCompleting ? "Saving…" : "Yes, Complete Activity"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function BookingCardSkeleton() {
  return (
    <div className="bg-card border rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-5 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-28" />
      </div>
      <Skeleton className="h-4 w-36" />
      <div className="flex items-center justify-between pt-1 border-t">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OperatorBookingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState("all");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: bookingKeys.list({ limit: "100" }),
    queryFn: () => listOperatorBookings({ limit: 100 }),
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => markBookingStarted(id),
    onSuccess: () => {
      toast.success("Activity marked as started");
      qc.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => markBookingCompleted(id),
    onSuccess: () => {
      toast.success("Activity marked as completed");
      qc.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const collectCashMutation = useMutation({
    mutationFn: (id: string) => collectCash(id),
    onSuccess: () => {
      toast.success("Cash collection confirmed — booking fully settled");
      qc.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = filterBookings(bookings, tab);

  const emptyMessages: Record<string, { title: string; description: string }> = {
    all: { title: "No bookings yet", description: "Your assigned bookings will appear here." },
    today: { title: "Nothing today", description: "You have no activities scheduled for today." },
    upcoming: { title: "No upcoming bookings", description: "No confirmed bookings ahead of today." },
    completed: { title: "No completed bookings", description: "Bookings you complete will appear here." },
  };

  return (
    <div>
      <PageHeader
        title="My Bookings"
        description="Your assigned activity bookings"
      />

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        {["all", "today", "upcoming", "completed"].map((tabValue) => (
          <TabsContent key={tabValue} value={tabValue}>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <BookingCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                title={emptyMessages[tabValue].title}
                description={emptyMessages[tabValue].description}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onStart={() => startMutation.mutate(booking.id)}
                    onComplete={() => completeMutation.mutate(booking.id)}
                    onCollectCash={() => collectCashMutation.mutate(booking.id)}
                    isStarting={
                      startMutation.isPending &&
                      startMutation.variables === booking.id
                    }
                    isCompleting={
                      completeMutation.isPending &&
                      completeMutation.variables === booking.id
                    }
                    isCollecting={
                      collectCashMutation.isPending &&
                      collectCashMutation.variables === booking.id
                    }
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
