"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/providers/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users, UserPlus, Phone, Mail, BookOpen,
  MoreVertical, Trash2, ToggleLeft, ToggleRight, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  guideKeys,
  listGuides,
  inviteGuide,
  updateGuideStatus,
  removeGuide,
} from "@/lib/api/guides";
import { formatDate } from "@/lib/utils/date";
import type { Operator } from "@/lib/types/booking";
import { cn } from "@/lib/utils";

function statusStyle(status: Operator["status"]) {
  switch (status) {
    case "active": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "inactive": return "bg-amber-50 text-amber-700 border-amber-200";
    case "suspended": return "bg-red-50 text-red-700 border-red-200";
  }
}

function initials(name: string) {
  return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

function avatarColor(name: string) {
  const colors = [
    "bg-indigo-500", "bg-violet-500", "bg-pink-500",
    "bg-teal-500", "bg-orange-500", "bg-cyan-500",
  ];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % colors.length;
  return colors[h];
}

function GuideCard({
  guide,
  onToggleStatus,
  onRemove,
}: {
  guide: Operator;
  onToggleStatus: (g: Operator) => void;
  onRemove: (g: Operator) => void;
}) {
  return (
    <div className="bg-card rounded-xl border p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0",
            avatarColor(guide.name)
          )}>
            {initials(guide.name)}
          </div>
          <div>
            <p className="font-semibold text-sm">{guide.name}</p>
            <span className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
              statusStyle(guide.status)
            )}>
              {guide.status}
            </span>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggleStatus(guide)}>
              {guide.status === "active" ? (
                <><ToggleLeft className="mr-2 h-4 w-4 text-amber-500" /> Deactivate</>
              ) : (
                <><ToggleRight className="mr-2 h-4 w-4 text-emerald-500" /> Activate</>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onRemove(guide)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove Guide
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="space-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{guide.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <Phone className="h-3.5 w-3.5 shrink-0" />
          <span>{guide.phone}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{guide.assigned_bookings} bookings</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          <span>Joined {formatDate(guide.created_at)}</span>
        </div>
      </div>
    </div>
  );
}

export default function AgencyGuidesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<Operator | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  const isSoloOperator = user?.accountType === "solo_operator";

  useEffect(() => {
    if (!authLoading && isSoloOperator) {
      router.replace("/agency/dashboard");
    }
  }, [authLoading, isSoloOperator, router]);

  const { data: guides = [], isLoading } = useQuery({
    queryKey: guideKeys.list(),
    queryFn: listGuides,
    enabled: !isSoloOperator,
  });

  const inviteMutation = useMutation({
    mutationFn: () => inviteGuide(form),
    onSuccess: () => {
      toast.success("Guide invited — they'll receive a login email");
      qc.invalidateQueries({ queryKey: guideKeys.all });
      setInviteOpen(false);
      setForm({ name: "", email: "", phone: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const toggleMutation = useMutation({
    mutationFn: (g: Operator) =>
      updateGuideStatus(g.id, g.status === "active" ? "inactive" : "active"),
    onSuccess: () => {
      toast.success("Guide status updated");
      qc.invalidateQueries({ queryKey: guideKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeGuide(id),
    onSuccess: () => {
      toast.success("Guide removed");
      qc.invalidateQueries({ queryKey: guideKeys.all });
      setRemoveTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Redirect solo operators — all hooks are called above before this guard
  if (authLoading || isSoloOperator) return null;

  const active = guides.filter(g => g.status === "active").length;
  const inactive = guides.filter(g => g.status !== "active").length;

  return (
    <div>
      <PageHeader
        title="Guides"
        description="Manage your team of guides and operators"
        action={
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Invite Guide
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", value: guides.length, icon: Users, color: "text-foreground" },
          { label: "Active", value: active, icon: ToggleRight, color: "text-emerald-600" },
          { label: "Inactive", value: inactive, icon: ToggleLeft, color: "text-amber-600" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Icon className={cn("h-4 w-4", color)} />
            </div>
            <div>
              <p className={cn("text-xl font-bold", color)}>{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Guide grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : guides.length === 0 ? (
        <EmptyState
          title="No guides yet"
          description="Invite your first guide to start assigning bookings to them."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {guides.map(guide => (
            <GuideCard
              key={guide.id}
              guide={guide}
              onToggleStatus={(g) => toggleMutation.mutate(g)}
              onRemove={setRemoveTarget}
            />
          ))}
        </div>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a Guide</DialogTitle>
            <DialogDescription>
              They&apos;ll receive an email to set their password and access the Guide Portal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Full Name <span className="text-destructive">*</span></Label>
              <Input
                placeholder="Ravi Sharma"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email <span className="text-destructive">*</span></Label>
              <Input
                type="email"
                placeholder="ravi@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone <span className="text-destructive">*</span></Label>
              <Input
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              disabled={!form.name || !form.email || !form.phone || inviteMutation.isPending}
              onClick={() => inviteMutation.mutate()}
            >
              {inviteMutation.isPending ? "Sending…" : "Send Invite"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove confirm dialog */}
      <Dialog open={!!removeTarget} onOpenChange={open => !open && setRemoveTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Guide</DialogTitle>
            <DialogDescription>
              Remove &ldquo;{removeTarget?.name}&rdquo; from your agency? They will lose access immediately.
              Their past booking history is preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={removeMutation.isPending}
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
            >
              {removeMutation.isPending ? "Removing…" : "Remove Guide"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
