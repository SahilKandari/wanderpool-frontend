"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2, XCircle, PauseCircle, Building2,
  Search, Filter, MoreVertical, TrendingUp, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  adminKeys,
  adminListAgencies,
  adminApproveAgency,
  adminRejectAgency,
  adminSuspendAgency,
} from "@/lib/api/admin";
import type { Agency } from "@/lib/types/auth";
import { cn } from "@/lib/utils";

function statusColor(status: string) {
  switch (status) {
    case "active": return "text-emerald-600 bg-emerald-50 border-emerald-200";
    case "pending": return "text-amber-600 bg-amber-50 border-amber-200";
    case "suspended": return "text-red-600 bg-red-50 border-red-200";
    case "rejected": return "text-slate-500 bg-slate-50 border-slate-200";
    default: return "text-slate-500 bg-slate-50 border-slate-200";
  }
}

function healthColor(score: number) {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-500";
}

function AgencyCard({
  agency,
  onApprove,
  onReject,
  onSuspend,
  onViewDetails,
}: {
  agency: Agency;
  onApprove: (a: Agency) => void;
  onReject: (a: Agency) => void;
  onSuspend: (a: Agency) => void;
  onViewDetails: (a: Agency) => void;
}) {
  return (
    <div className="bg-card rounded-xl border p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">{agency.business_name}</p>
            <p className="text-xs text-muted-foreground">{agency.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn(
            "text-xs font-medium px-2 py-0.5 rounded-full border",
            statusColor(agency.status)
          )}>
            {agency.status}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {agency.status !== "active" && (
                <DropdownMenuItem
                  className="text-emerald-600"
                  onClick={() => onApprove(agency)}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                </DropdownMenuItem>
              )}
              {agency.status === "active" && (
                <DropdownMenuItem
                  className="text-amber-600"
                  onClick={() => onSuspend(agency)}
                >
                  <PauseCircle className="mr-2 h-4 w-4" /> Suspend
                </DropdownMenuItem>
              )}
              {agency.status !== "rejected" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => onReject(agency)}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1 border-t">
        <div className="text-center">
          <p className={cn("text-base font-bold", healthColor(agency.health_score ?? 0))}>
            {agency.health_score != null ? Number(agency.health_score).toFixed(2) : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Health</p>
        </div>
        <div className="text-center border-x">
          <p className="text-base font-bold text-foreground">{agency.phone || "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Phone</p>
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-foreground capitalize">{agency.account_type?.replace("_", " ") || "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Type</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t">
        <p className="text-xs text-muted-foreground">
          Joined {new Date(agency.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
        </p>
        <button
          onClick={() => onViewDetails(agency)}
          className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline"
        >
          View Details <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function AdminAgenciesPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [rejectTarget, setRejectTarget] = useState<Agency | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const queryParams = statusFilter !== "all" ? { status: statusFilter } : undefined;

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: adminKeys.agencies(queryParams),
    queryFn: () => adminListAgencies(queryParams),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApproveAgency(id),
    onSuccess: () => {
      toast.success("Agency approved");
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      adminRejectAgency(id, reason),
    onSuccess: () => {
      toast.success("Agency rejected");
      qc.invalidateQueries({ queryKey: adminKeys.all });
      setRejectTarget(null);
      setRejectReason("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminSuspendAgency(id),
    onSuccess: () => {
      toast.success("Agency suspended");
      qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const filtered = agencies.filter((a) =>
    search
      ? a.business_name.toLowerCase().includes(search.toLowerCase()) ||
        a.email.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const pending = agencies.filter((a) => a.status === "pending").length;

  return (
    <div>
      <PageHeader
        title="Agencies"
        description="Review and manage operator accounts on the platform"
      />

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: agencies.length, color: "text-foreground" },
          { label: "Active", value: agencies.filter(a => a.status === "active").length, color: "text-emerald-600" },
          { label: "Pending", value: pending, color: "text-amber-600" },
          { label: "Suspended", value: agencies.filter(a => a.status === "suspended").length, color: "text-red-500" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-card rounded-xl border p-4 text-center">
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search agencies…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Pending alert */}
      {pending > 0 && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <TrendingUp className="h-4 w-4 shrink-0" />
          <span><strong>{pending}</strong> {pending === 1 ? "agency is" : "agencies are"} waiting for approval.</span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100"
            onClick={() => setStatusFilter("pending")}
          >
            Review now
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No agencies found"
          description={search ? "Try a different search term or status filter." : "No agencies have registered yet."}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agency) => (
            <AgencyCard
              key={agency.id}
              agency={agency}
              onApprove={(a) => approveMutation.mutate(a.id)}
              onReject={setRejectTarget}
              onSuspend={(a) => suspendMutation.mutate(a.id)}
              onViewDetails={(a) => router.push(`/admin/agencies/${a.id}`)}
            />
          ))}
        </div>
      )}

      {/* Reject dialog */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Agency</DialogTitle>
            <DialogDescription>
              Reject &ldquo;{rejectTarget?.business_name}&rdquo;? Provide an optional reason.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="mb-1.5 block">Reason (optional)</Label>
            <Textarea
              placeholder="e.g. Missing safety certifications for water activities"
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
              {rejectMutation.isPending ? "Rejecting…" : "Reject Agency"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
