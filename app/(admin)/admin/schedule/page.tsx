"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { BookingStatusBadge } from "@/components/shared/StatusBadge";
import { bookingKeys, adminListBookings } from "@/lib/api/bookings";
import type { Booking } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

// ── Date helpers (all local time — no UTC conversion) ─────────────────────────

function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 0
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatWeekLabel(monday: Date, sunday: Date): string {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const s = `${monday.getDate()} ${MONTHS[monday.getMonth()]}`;
  const e = `${sunday.getDate()} ${MONTHS[sunday.getMonth()]} ${sunday.getFullYear()}`;
  return monday.getMonth() === sunday.getMonth()
    ? `${monday.getDate()}–${sunday.getDate()} ${MONTHS[monday.getMonth()]} ${sunday.getFullYear()}`
    : `${s} – ${e}`;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Booking card ──────────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="rounded-md border bg-card p-2 text-xs space-y-1 hover:bg-accent/50 transition-colors">
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold tabular-nums text-muted-foreground">
          {booking.slot_start_time}
        </span>
        <BookingStatusBadge status={booking.status} />
      </div>
      <p className="font-medium leading-tight line-clamp-2" title={booking.experience_title}>
        {booking.experience_title}
      </p>
      <div className="flex items-center gap-1 text-muted-foreground">
        <Building2 className="h-3 w-3 shrink-0" />
        <span className="truncate">{booking.customer_name}</span>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground">
        <Users className="h-3 w-3 shrink-0" />
        <span>{booking.participants} pax</span>
      </div>
    </div>
  );
}

// ── Day column ────────────────────────────────────────────────────────────────

function DayColumn({
  date, isToday, bookings, loading,
}: {
  date: Date; isToday: boolean; bookings: Booking[]; loading: boolean;
}) {
  const dayIndex = (date.getDay() + 6) % 7;
  const isWeekend = dayIndex >= 5;

  return (
    <div className="flex flex-col min-h-[200px]">
      <div className={cn(
        "flex flex-col items-center pb-2 mb-2 border-b select-none",
        isWeekend && "text-muted-foreground"
      )}>
        <span className="text-xs font-medium uppercase tracking-wide">
          {DAY_NAMES[dayIndex]}
        </span>
        <span className={cn(
          "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
          isToday && "bg-primary text-primary-foreground"
        )}>
          {date.getDate()}
        </span>
      </div>
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {loading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-16 w-full rounded-md" />
            <Skeleton className="h-16 w-full rounded-md" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-center text-muted-foreground/40 text-xs mt-4 select-none">—</p>
        ) : (
          bookings
            .slice()
            .sort((a, b) => a.slot_start_time.localeCompare(b.slot_start_time))
            .map((b) => <BookingCard key={b.id} booking={b} />)
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminSchedulePage() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekEnd = weekDays[6];
  const todayYMD = toYMD(today);
  const isCurrentWeek = toYMD(weekStart) === toYMD(getWeekStart(today));

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: bookingKeys.list({ status: "confirmed", limit: "200" }),
    queryFn: () => adminListBookings({ status: "confirmed", limit: 200 }),
  });

  const byDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of bookings) {
      const key = b.slot_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    return map;
  }, [bookings]);

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="All confirmed bookings across all agencies"
      />

      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() - 7); return d; })}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => { const d = new Date(w); d.setDate(d.getDate() + 7); return d; })}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[180px]">
            Week of {formatWeekLabel(weekStart, weekEnd)}
          </span>
        </div>
        {!isCurrentWeek && (
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(getWeekStart(today))}>
            Today
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 overflow-x-auto">
          <div className="grid grid-cols-7 gap-3 min-w-140">
            {weekDays.map((day) => {
              const ymd = toYMD(day);
              return (
                <DayColumn
                  key={ymd}
                  date={day}
                  isToday={ymd === todayYMD}
                  bookings={byDate[ymd] ?? []}
                  loading={isLoading}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {!isLoading && (
        <p className="mt-3 text-xs text-muted-foreground text-right">
          {bookings.length} confirmed booking{bookings.length !== 1 ? "s" : ""} loaded
        </p>
      )}
    </div>
  );
}
