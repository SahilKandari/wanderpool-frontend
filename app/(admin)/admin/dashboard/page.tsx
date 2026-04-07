"use client";

import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Map, BookOpen, FolderTree } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";

export default function AdminDashboardPage() {
  const { data: agencies = [], isLoading: agenciesLoading } = useQuery({
    queryKey: ["admin-stats-agencies"],
    queryFn: () => apiFetch<unknown[]>("/admin/agencies"),
  });

  const { data: experiences = [], isLoading: experiencesLoading } = useQuery({
    queryKey: ["admin-stats-experiences"],
    queryFn: () => apiFetch<unknown[]>("/admin/experiences"),
  });

  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ["admin-stats-bookings"],
    queryFn: () => apiFetch<unknown[]>("/admin/bookings"),
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-stats-categories"],
    queryFn: () => apiFetch<unknown[]>("/categories"),
  });

  const stats = [
    {
      title: "Agencies",
      value: agencies.length,
      loading: agenciesLoading,
      icon: Building2,
      href: "/admin/agencies",
    },
    {
      title: "Experiences",
      value: experiences.length,
      loading: experiencesLoading,
      icon: Map,
      href: "/admin/experiences",
    },
    {
      title: "Bookings",
      value: bookings.length,
      loading: bookingsLoading,
      icon: BookOpen,
      href: "/admin/bookings",
    },
    {
      title: "Categories",
      value: categories.length,
      loading: categoriesLoading,
      icon: FolderTree,
      href: "/admin/categories",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Platform Overview"
        description="WanderPool administration"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link href={stat.href} key={stat.title}>
              <Card className="hover:border-indigo-300 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  {stat.loading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold">{stat.value}</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Category Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Manage experience categories and field definitions.{" "}
            <Link
              href="/admin/categories"
              className="text-indigo-400 underline"
            >
              Go to Categories →
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
