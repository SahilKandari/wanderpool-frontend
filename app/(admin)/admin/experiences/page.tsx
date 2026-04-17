"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  XCircle,
  PauseCircle,
  ExternalLink,
  Star,
  Map,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { apiFetch } from "@/lib/api/client";
import { paiseToCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { Experience, ExperienceStatus } from "@/lib/types/experience";
import { cn } from "@/lib/utils";

// ── Local query keys ──────────────────────────────────────────────────────────

const adminExpKeys = {
  all: ["admin-experiences"] as const,
  list: (params?: Record<string, string>) =>
    [...adminExpKeys.all, "list", params] as const,
};

// ── Status styling ────────────────────────────────────────────────────────────

function statusClasses(status: ExperienceStatus): string {
  switch (status) {
    case "active":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "pending_review":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "draft":
      return "text-slate-500 bg-slate-50 border-slate-200";
    case "rejected":
      return "text-red-700 bg-red-50 border-red-200";
    case "paused":
      return "text-orange-700 bg-orange-50 border-orange-200";
    default:
      return "text-slate-500 bg-slate-50 border-slate-200";
  }
}

function statusLabel(status: ExperienceStatus): string {
  switch (status) {
    case "active": return "Active";
    case "pending_review": return "Pending Review";
    case "draft": return "Draft";
    case "rejected": return "Rejected";
    case "paused": return "Paused";
    default: return status;
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminExperiencesPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState<Experience | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: adminExpKeys.list(),
    queryFn: () => apiFetch<Experience[]>("/admin/experiences"),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/experiences/${id}/approve`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Experience approved");
      qc.invalidateQueries({ queryKey: adminExpKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiFetch(`/admin/experiences/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      toast.success("Experience rejected");
      qc.invalidateQueries({ queryKey: adminExpKeys.all });
      setRejectTarget(null);
      setRejectReason("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/experiences/${id}/pause`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Experience paused");
      qc.invalidateQueries({ queryKey: adminExpKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Derived stats
  const total = experiences.length;
  const activeCount = experiences.filter((e) => e.status === "active").length;
  const pendingCount = experiences.filter((e) => e.status === "pending_review").length;
  const draftRejected = experiences.filter(
    (e) => e.status === "draft" || e.status === "rejected"
  ).length;

  // Filter
  const filtered = experiences.filter((e) => {
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    const matchesSearch = search
      ? e.title.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <PageHeader
        title="Experiences"
        description="All listings on the platform"
      />

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: total, color: "text-foreground" },
          { label: "Active", value: activeCount, color: "text-emerald-600" },
          { label: "Pending Review", value: pendingCount, color: "text-amber-600" },
          { label: "Draft / Rejected", value: draftRejected, color: "text-slate-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-xl border p-4 text-center">
            {isLoading ? (
              <Skeleton className="h-8 w-10 mx-auto mb-1" />
            ) : (
              <p className={cn("text-2xl font-bold", color)}>{value}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile card list — visible below sm */}
      <div className="block sm:hidden space-y-3 mb-4">
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No experiences found"
            description={search || statusFilter !== "all" ? "Try adjusting your filters." : "No experiences have been created yet."}
          />
        ) : (
          filtered.map((exp) => (
            <div key={exp.id} className="rounded-xl border border-slate-100 bg-white p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-sm text-slate-900 leading-snug flex-1 truncate">{exp.title}</p>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border shrink-0", statusClasses(exp.status))}>
                  {statusLabel(exp.status)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Map className="h-3 w-3" />
                <span>{exp.location_city}, {exp.location_state}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{paiseToCurrency(exp.base_price_paise)}</span>
                <span>{exp.avg_rating > 0 ? `${exp.avg_rating.toFixed(1)}★ · ${exp.total_bookings} bookings` : `${exp.total_bookings} bookings`}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {exp.status !== "active" && (
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50" onClick={() => approveMutation.mutate(exp.id)}>
                    <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                  </Button>
                )}
                {exp.status === "active" && (
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-orange-700 border-orange-300 hover:bg-orange-50" onClick={() => pauseMutation.mutate(exp.id)}>
                    <PauseCircle className="h-3 w-3 mr-1" />Pause
                  </Button>
                )}
                {exp.status !== "rejected" && (
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-destructive border-red-200 hover:bg-red-50" onClick={() => setRejectTarget(exp)}>
                    <XCircle className="h-3 w-3 mr-1" />Reject
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop table — hidden below sm */}
      {isLoading ? (
        <div className="hidden sm:block space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="hidden sm:block">
          <EmptyState
            title="No experiences found"
            description={
              search || statusFilter !== "all"
                ? "Try adjusting your filters."
                : "No experiences have been created yet."
            }
          />
        </div>
      ) : (
        <div className="hidden sm:block rounded-xl border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5" /> Rating
                  </span>
                </TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm leading-snug max-w-[200px] truncate">
                        {exp.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{exp.location_state}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {exp.location_city}
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {paiseToCurrency(exp.base_price_paise)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full border",
                        statusClasses(exp.status)
                      )}
                    >
                      {statusLabel(exp.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {exp.avg_rating > 0
                      ? `${exp.avg_rating.toFixed(1)} (${exp.review_count})`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-sm">{exp.total_bookings}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(exp.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a
                            href={`/experiences/${exp.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center"
                          >
                            <ExternalLink className="mr-2 h-4 w-4" /> View
                          </a>
                        </DropdownMenuItem>
                        {exp.status !== "active" && (
                          <DropdownMenuItem
                            className="text-emerald-600"
                            onClick={() => approveMutation.mutate(exp.id)}
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                          </DropdownMenuItem>
                        )}
                        {exp.status === "active" && (
                          <DropdownMenuItem
                            className="text-orange-600"
                            onClick={() => pauseMutation.mutate(exp.id)}
                          >
                            <PauseCircle className="mr-2 h-4 w-4" /> Pause
                          </DropdownMenuItem>
                        )}
                        {exp.status !== "rejected" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setRejectTarget(exp)}
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Reject dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Experience</DialogTitle>
            <DialogDescription>
              Reject &ldquo;{rejectTarget?.title}&rdquo;? Provide a reason so the agency can improve their listing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="mb-1.5 block">Reason (optional)</Label>
            <Textarea
              placeholder="e.g. Missing safety certifications, insufficient photos…"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() =>
                rejectTarget &&
                rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })
              }
            >
              {rejectMutation.isPending ? "Rejecting…" : "Reject Experience"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
