"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Filter, MoreVertical, ShieldAlert } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { BookingStatusBadge } from "@/components/shared/StatusBadge";
import {
  bookingKeys,
  adminListBookings,
  adminResolveDispute,
} from "@/lib/api/bookings";
import { paiseToCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import type { Booking } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminBookingsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [resolveTarget, setResolveTarget] = useState<Booking | null>(null);
  const [resolution, setResolution] = useState("");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: bookingKeys.list(),
    queryFn: () => adminListBookings(),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      adminResolveDispute(id, resolution),
    onSuccess: () => {
      toast.success("Dispute resolved");
      qc.invalidateQueries({ queryKey: bookingKeys.all });
      setResolveTarget(null);
      setResolution("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Stats
  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const disputed = bookings.filter((b) => b.status === "disputed").length;

  // Filter
  const filtered = bookings.filter((b) => {
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    const matchesSearch = search
      ? b.booking_code.toLowerCase().includes(search.toLowerCase()) ||
        b.customer_name.toLowerCase().includes(search.toLowerCase())
      : true;
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="All bookings across the platform"
      />

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Bookings", value: total, color: "text-foreground" },
          { label: "Confirmed", value: confirmed, color: "text-emerald-600" },
          { label: "Disputed", value: disputed, color: "text-red-600" },
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

      {/* Disputed alert */}
      {disputed > 0 && !isLoading && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            <strong>{disputed}</strong> {disputed === 1 ? "booking is" : "bookings are"} in dispute and need attention.
          </span>
          <Button
            size="sm"
            variant="outline"
            className="ml-auto border-red-300 text-red-700 hover:bg-red-100"
            onClick={() => setStatusFilter("disputed")}
          >
            Review now
          </Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by code or customer…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="disputed">Disputed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No bookings found"
          description={
            search || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "No bookings have been made yet."
          }
        />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Pax</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <span className="font-mono text-xs font-semibold">
                      {booking.booking_code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{booking.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.customer_email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm max-w-[180px] truncate">
                      {booking.experience_title}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(booking.slot_date)}
                  </TableCell>
                  <TableCell className="text-sm">{booking.participants}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {paiseToCurrency(booking.total_paise)}
                  </TableCell>
                  <TableCell>
                    <BookingStatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    {booking.status === "disputed" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-amber-600"
                            onClick={() => setResolveTarget(booking)}
                          >
                            <ShieldAlert className="mr-2 h-4 w-4" /> Resolve Dispute
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Resolve dispute dialog */}
      <Dialog
        open={!!resolveTarget}
        onOpenChange={(open) => !open && setResolveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Dispute</DialogTitle>
            <DialogDescription>
              Resolve the dispute for booking{" "}
              <span className="font-mono font-semibold">{resolveTarget?.booking_code}</span>{" "}
              ({resolveTarget?.customer_name}). Describe the resolution taken.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="mb-1.5 block">Resolution</Label>
            <Textarea
              placeholder="e.g. Full refund issued. Operator warned. Customer compensated."
              rows={4}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResolveTarget(null)}>
              Cancel
            </Button>
            <Button
              disabled={!resolution.trim() || resolveMutation.isPending}
              onClick={() =>
                resolveTarget &&
                resolveMutation.mutate({ id: resolveTarget.id, resolution })
              }
            >
              {resolveMutation.isPending ? "Saving…" : "Mark as Resolved"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
