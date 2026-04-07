"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { ExperienceStatusBadge } from "@/components/shared/StatusBadge";
import {
  experienceKeys,
  listMyExperiences,
  deleteExperience,
} from "@/lib/api/experiences";
import { paiseToCurrency } from "@/lib/utils/currency";
import type { Experience } from "@/lib/types/experience";
import { useState } from "react";

export default function AgencyExperiencesPage() {
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Experience | null>(null);

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: experienceKeys.mine(),
    queryFn: listMyExperiences,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExperience(id),
    onSuccess: () => {
      toast.success("Experience deleted");
      qc.invalidateQueries({ queryKey: experienceKeys.mine() });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="My Experiences"
        description="Manage your activity listings"
        action={
          <Button asChild>
            <Link href="/agency/experiences/new">
              <Plus className="mr-2 h-4 w-4" />
              New Experience
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : experiences.length === 0 ? (
        <EmptyState
          title="No experiences yet"
          description="Create your first listing so travellers can discover and book your activity."
          action={
            <Button asChild>
              <Link href="/agency/experiences/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Experience
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Bookings</TableHead>
                <TableHead className="text-right">Rating</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {experiences.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{exp.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {exp.duration_minutes} min
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{exp.location_city}</TableCell>
                  <TableCell className="text-sm">
                    {paiseToCurrency(exp.base_price_paise)}
                  </TableCell>
                  <TableCell>
                    <ExperienceStatusBadge status={exp.status} />
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {exp.total_bookings}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {exp.avg_rating > 0 ? `★ ${exp.avg_rating.toFixed(1)}` : "—"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/agency/experiences/${exp.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/agency/experiences/${exp.id}/images`}>
                            Images
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(exp)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Experience</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.title}
              &rdquo;? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
