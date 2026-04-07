"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Shield,
  Plus,
  Trash2,
  Loader2,
  UserCog,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { apiFetch } from "@/lib/api/client";
import { formatDate } from "@/lib/utils/date";
import { useAuth } from "@/lib/providers/AuthProvider";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: string;
  name: string;
  email: string;
  account_type: string;
  is_active: boolean;
  created_at: string;
}

// ── Local query keys ──────────────────────────────────────────────────────────

const adminUserKeys = {
  all: ["admin-users"] as const,
  list: () => [...adminUserKeys.all, "list"] as const,
};

// ── Add admin form schema ─────────────────────────────────────────────────────

const addAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  role: z.enum(["super_admin", "support_agent"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type AddAdminForm = z.infer<typeof addAdminSchema>;

// ── Role badge ────────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  if (role === "super_admin") {
    return (
      <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 border hover:bg-indigo-100">
        Super Admin
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">Support Agent</Badge>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AdminUser | null>(null);

  // Guard: only super_admin can access this page
  if (user?.accountType !== "super_admin") {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
        <div className="rounded-full bg-muted p-5">
          <Shield className="h-10 w-10 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Only super admins can manage WanderPool staff accounts. Contact your super admin for access.
          </p>
        </div>
      </div>
    );
  }

  return <AdminUsersContent
    qc={qc}
    addOpen={addOpen}
    setAddOpen={setAddOpen}
    removeTarget={removeTarget}
    setRemoveTarget={setRemoveTarget}
  />;
}

// Separate content component to avoid hooks-in-conditional issues
function AdminUsersContent({
  qc,
  addOpen,
  setAddOpen,
  removeTarget,
  setRemoveTarget,
}: {
  qc: ReturnType<typeof useQueryClient>;
  addOpen: boolean;
  setAddOpen: (v: boolean) => void;
  removeTarget: AdminUser | null;
  setRemoveTarget: (v: AdminUser | null) => void;
}) {
  const [removing, setRemoving] = useState(false);

  const { data: admins = [], isLoading } = useQuery({
    queryKey: adminUserKeys.list(),
    queryFn: () => apiFetch<AdminUser[]>("/admin/admins"),
  });

  const addMutation = useMutation({
    mutationFn: (data: AddAdminForm) =>
      apiFetch("/admin/admins", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Admin user added");
      qc.invalidateQueries({ queryKey: adminUserKeys.all });
      setAddOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function handleRemove(admin: AdminUser) {
    setRemoving(true);
    try {
      await apiFetch(`/admin/admins/${admin.id}`, { method: "DELETE" });
      toast.success(`${admin.name} removed`);
      qc.invalidateQueries({ queryKey: adminUserKeys.all });
      setRemoveTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to remove admin");
    } finally {
      setRemoving(false);
    }
  }

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AddAdminForm>({
    resolver: zodResolver(addAdminSchema),
    defaultValues: { role: "support_agent" },
  });

  function onAddSubmit(data: AddAdminForm) {
    addMutation.mutate(data);
  }

  return (
    <div>
      <PageHeader
        title="Admin Users"
        description="Manage WanderPool staff access"
        action={
          <Button onClick={() => { reset(); setAddOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Admin
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : admins.length === 0 ? (
        <EmptyState
          title="No admin users"
          description="Add staff members who can manage the WanderPool platform."
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Admin
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <UserCog className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-sm">{admin.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {admin.email}
                  </TableCell>
                  <TableCell>
                    <RoleBadge role={admin.account_type} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(admin.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setRemoveTarget(admin)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Admin dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin User</DialogTitle>
            <DialogDescription>
              Create a new staff account for the WanderPool admin panel.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="admin_name">Full Name</Label>
              <Input
                id="admin_name"
                placeholder="Priya Sharma"
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin_email">Email</Label>
              <Input
                id="admin_email"
                type="email"
                placeholder="priya@wanderpool.in"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                defaultValue="support_agent"
                onValueChange={(v) =>
                  setValue("role", v as "super_admin" | "support_agent")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support_agent">Support Agent</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-destructive">{errors.role.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="admin_password">Password</Label>
              <Input
                id="admin_password"
                type="password"
                placeholder="Min 8 characters"
                autoComplete="new-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Admin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove confirmation dialog */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Admin</DialogTitle>
            <DialogDescription>
              Remove <strong>{removeTarget?.name}</strong> ({removeTarget?.email}) from the admin panel? They will immediately lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={removing}
              onClick={() => removeTarget && handleRemove(removeTarget)}
            >
              {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
