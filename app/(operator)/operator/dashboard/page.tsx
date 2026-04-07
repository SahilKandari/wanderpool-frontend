"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, CalendarDays, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { BookingStatusBadge } from "@/components/shared/StatusBadge";
import { bookingKeys, listOperatorBookings } from "@/lib/api/bookings";
import { formatDate } from "@/lib/utils/date";
import { paiseToCurrency } from "@/lib/utils/currency";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function toISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function OperatorDashboardPage() {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: bookingKeys.mine(),
    queryFn: () => listOperatorBookings(),
  });

  const todayISO = toISO(new Date());
  const thisMonth = todayISO.slice(0, 7); // "YYYY-MM"

  const todayCount = bookings.filter(
    (b) => b.slot_date.slice(0, 10) === todayISO && b.status === "confirmed"
  ).length;

  const upcomingCount = bookings.filter(
    (b) => b.slot_date.slice(0, 10) > todayISO && b.status === "confirmed"
  ).length;

  const completedThisMonth = bookings.filter(
    (b) => b.status === "completed" && b.slot_date.slice(0, 7) === thisMonth
  ).length;

  const stats = [
    { title: "Today's Activities", value: todayCount, icon: CalendarDays },
    { title: "Upcoming Bookings", value: upcomingCount, icon: BookOpen },
    { title: "Completed This Month", value: completedThisMonth, icon: CheckCircle },
  ];

  // Upcoming confirmed bookings sorted by date
  const upcoming = bookings
    .filter((b) => b.status === "confirmed" && b.slot_date.slice(0, 10) >= todayISO)
    .sort((a, b) => a.slot_date.localeCompare(b.slot_date))
    .slice(0, 5);

  return (
    <div>
      <PageHeader
        title="Guide Dashboard"
        description="Your assigned bookings and upcoming schedule"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold">{stat.value}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Upcoming Activities</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/operator/bookings">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No upcoming confirmed bookings.
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{b.experience_title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(b.slot_date)}
                      <span className="text-border">·</span>
                      <Clock className="h-3 w-3" />
                      {b.slot_start_time}
                      <span className="text-border">·</span>
                      {b.participants} pax
                      <span className="text-border">·</span>
                      {paiseToCurrency(b.total_paise)}
                    </p>
                  </div>
                  <BookingStatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
