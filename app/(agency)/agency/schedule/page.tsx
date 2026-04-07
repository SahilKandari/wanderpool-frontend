"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { BookingStatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

import { bookingKeys, listMyBookings } from "@/lib/api/bookings";
import type { Booking } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Returns the Monday of the week containing the given date. */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun, 1 = Mon, …
  const diff = day === 0 ? -6 : 1 - day; // shift so Monday = 0
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns an array of 7 Date objects for Mon–Sun of the week starting at monday. */
function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Format a Date as YYYY-MM-DD (local timezone, no UTC conversion). */
function toYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatWeekLabel(monday: Date, sunday: Date): string {
  const startDay = monday.getDate();
  const startMonth = MONTH_NAMES[monday.getMonth()];
  const endDay = sunday.getDate();
  const endMonth = MONTH_NAMES[sunday.getMonth()];
  const year = sunday.getFullYear();

  if (monday.getMonth() === sunday.getMonth()) {
    return `${startDay}–${endDay} ${startMonth} ${year}`;
  }
  return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${year}`;
}

// ─── Booking card ─────────────────────────────────────────────────────────────

function BookingCard({ booking }: { booking: Booking }) {
  return (
    <div className="rounded-md border bg-card p-2 text-xs space-y-1 hover:bg-accent/50 transition-colors">
      <div className="flex items-center justify-between gap-1">
        <span className="font-semibold tabular-nums text-muted-foreground">
          {booking.slot_start_time}
        </span>
        <BookingStatusBadge status={booking.status} />
      </div>
      <p
        className="font-medium leading-tight line-clamp-2"
        title={booking.experience_title}
      >
        {booking.experience_title}
      </p>
      <div className="flex items-center gap-1 text-muted-foreground">
        <Users className="h-3 w-3 shrink-0" />
        <span>
          {booking.participants} pax
        </span>
      </div>
    </div>
  );
}

// ─── Day column ───────────────────────────────────────────────────────────────

interface DayColumnProps {
  date: Date;
  isToday: boolean;
  bookings: Booking[];
  loading: boolean;
}

function DayColumn({ date, isToday, bookings, loading }: DayColumnProps) {
  const dayIndex = (date.getDay() + 6) % 7; // Mon=0 … Sun=6
  const dayName = DAY_NAMES[dayIndex];
  const dayNumber = date.getDate();
  const isWeekend = dayIndex >= 5;

  return (
    <div className="flex flex-col min-h-[200px]">
      {/* Header */}
      <div
        className={cn(
          "flex flex-col items-center pb-2 mb-2 border-b select-none",
          isWeekend && "text-muted-foreground"
        )}
      >
        <span className="text-xs font-medium uppercase tracking-wide">
          {dayName}
        </span>
        <span
          className={cn(
            "mt-0.5 flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
            isToday && "bg-primary text-primary-foreground"
          )}
        >
          {dayNumber}
        </span>
      </div>

      {/* Booking cards */}
      <div className="flex-1 space-y-1.5 overflow-y-auto">
        {loading ? (
          <div className="space-y-1.5">
            <Skeleton className="h-14 w-full rounded-md" />
            <Skeleton className="h-14 w-full rounded-md" />
          </div>
        ) : bookings.length === 0 ? (
          <p className="text-center text-muted-foreground/40 text-xs mt-4 select-none">
            —
          </p>
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AgencySchedulePage() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));

  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekEnd = weekDays[6];

  const weekLabel = formatWeekLabel(weekStart, weekEnd);

  const todayYMD = toYMD(today);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: bookingKeys.mine({ status: "confirmed" }),
    queryFn: () => listMyBookings({ status: "confirmed", limit: 100 }),
  });

  // Group bookings by slot_date (normalize to YYYY-MM-DD)
  const byDate = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of bookings) {
      const key = b.slot_date.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(b);
    }
    return map;
  }, [bookings]);

  const goToPrevWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goToNextWeek = () => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const goToCurrentWeek = () => setWeekStart(getWeekStart(today));

  const isCurrentWeek = toYMD(weekStart) === toYMD(getWeekStart(today));

  return (
    <div>
      <PageHeader
        title="Schedule"
        description="Upcoming bookings and availability"
      />

      {/* Week navigation bar */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevWeek} aria-label="Previous week">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek} aria-label="Next week">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[180px]">
            Week of {weekLabel}
          </span>
        </div>

        {!isCurrentWeek && (
          <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
            Today
          </Button>
        )}
      </div>

      {/* 7-day grid */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-3">
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

      {/* Summary line */}
      {!isLoading && (
        <p className="mt-3 text-xs text-muted-foreground text-right">
          {bookings.length} confirmed booking{bookings.length !== 1 ? "s" : ""} loaded
        </p>
      )}
    </div>
  );
}
