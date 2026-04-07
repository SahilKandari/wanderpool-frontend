"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Clock, Users, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { bookingKeys, listOperatorBookings } from "@/lib/api/bookings";
import type { Booking } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

// ── Week helpers ──────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_FMT = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" });
const DAY_NUM_FMT = new Intl.DateTimeFormat("en-IN", { day: "numeric" });
const SHORT_DATE_FMT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });

// ── Booking pill ──────────────────────────────────────────────────────────────

function BookingPill({ booking }: { booking: Booking }) {
  return (
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-2 text-xs space-y-1">
      <p className="font-semibold truncate text-foreground leading-snug">
        {booking.experience_title}
      </p>
      <div className="flex items-center gap-1 text-muted-foreground">
        <Clock className="h-3 w-3 shrink-0" />
        <span>{booking.slot_start_time}</span>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground">
        <User className="h-3 w-3 shrink-0" />
        <span className="truncate">{booking.customer_name}</span>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground">
        <Users className="h-3 w-3 shrink-0" />
        <span>{booking.participants} pax</span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OperatorSchedulePage() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: bookingKeys.list({ status: "confirmed", limit: "100" }),
    queryFn: () => listOperatorBookings({ status: "confirmed", limit: 100 }),
  });

  // Build 7-day array for the current week
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 6);

  // Map ISO date → bookings for that day (normalize slot_date to YYYY-MM-DD)
  const byDate = bookings.reduce<Record<string, Booking[]>>((acc, b) => {
    const key = b.slot_date.slice(0, 10);
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  const todayISO = toISO(new Date());
  const hasAnyBooking = days.some((d) => (byDate[toISO(d)] ?? []).length > 0);

  return (
    <div>
      <PageHeader
        title="My Schedule"
        description="Your upcoming assigned activities"
      />

      {/* Week navigation */}
      <div className="flex items-center justify-between mb-5">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekStart((w) => addDays(w, -7))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="text-center">
          <p className="font-semibold text-sm">
            {MONTH_FMT.format(weekStart)}
          </p>
          <p className="text-xs text-muted-foreground">
            {SHORT_DATE_FMT.format(weekStart)} – {SHORT_DATE_FMT.format(weekEnd)}
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setWeekStart((w) => addDays(w, 7))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : !hasAnyBooking ? (
        <EmptyState
          title="No bookings this week"
          description="You have no confirmed activities scheduled in this week."
        />
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const iso = toISO(day);
            const dayBookings = byDate[iso] ?? [];
            const isToday = iso === todayISO;
            const isPast = iso < todayISO;

            return (
              <div key={iso} className="flex flex-col gap-1.5">
                {/* Day header */}
                <div
                  className={cn(
                    "text-center rounded-lg py-1.5",
                    isToday
                      ? "bg-primary text-primary-foreground"
                      : isPast
                      ? "bg-muted/50"
                      : "bg-muted"
                  )}
                >
                  <p className="text-xs font-medium">
                    {DAY_LABELS[day.getDay()]}
                  </p>
                  <p className={cn("text-lg font-bold leading-none mt-0.5", isPast && !isToday ? "text-muted-foreground" : "")}>
                    {DAY_NUM_FMT.format(day)}
                  </p>
                </div>

                {/* Booking pills */}
                <div className="flex flex-col gap-1 min-h-20">
                  {dayBookings.length === 0 ? (
                    <div className="flex-1 border border-dashed rounded-lg opacity-30" />
                  ) : (
                    dayBookings.map((b) => (
                      <BookingPill key={b.id} booking={b} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
