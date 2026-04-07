"use client";

import { useQuery } from "@tanstack/react-query";
import { Map, BookOpen, Star, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { experienceKeys, listMyExperiences } from "@/lib/api/experiences";
import { useAuth } from "@/lib/providers/AuthProvider";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ExperienceStatusBadge } from "@/components/shared/StatusBadge";
import { paiseToCurrency } from "@/lib/utils/currency";

export default function AgencyDashboardPage() {
  const { user } = useAuth();

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: experienceKeys.mine(),
    queryFn: listMyExperiences,
  });

  const activeCount = experiences.filter((e) => e.status === "active").length;
  const draftCount = experiences.filter((e) => e.status === "draft").length;
  const pendingCount = experiences.filter(
    (e) => e.status === "pending_review"
  ).length;

  const stats = [
    {
      title: "Total Listings",
      value: experiences.length,
      icon: Map,
      description: `${activeCount} active, ${draftCount} draft`,
    },
    {
      title: "Pending Review",
      value: pendingCount,
      icon: TrendingUp,
      description: "Awaiting admin approval",
    },
    {
      title: "Total Bookings",
      value: experiences.reduce((sum, e) => sum + e.total_bookings, 0),
      icon: BookOpen,
      description: "Across all experiences",
    },
    {
      title: "Avg. Rating",
      value:
        experiences.length > 0
          ? (
              experiences.reduce((sum, e) => sum + e.avg_rating, 0) /
              experiences.length
            ).toFixed(1)
          : "—",
      icon: Star,
      description: "Platform average",
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back 👋`}
        description="Here's an overview of your WanderPool account"
        action={
          <Button asChild>
            <Link href="/agency/experiences/new">+ New Experience</Link>
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {stat.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Experiences */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Experiences</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/agency/experiences">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : experiences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No experiences yet.{" "}
              <Link
                href="/agency/experiences/new"
                className="text-primary underline"
              >
                Create your first one
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {experiences.slice(0, 5).map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium">{exp.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {exp.location_city} · {paiseToCurrency(exp.base_price_paise)}{" "}
                      per person
                    </p>
                  </div>
                  <ExperienceStatusBadge status={exp.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
