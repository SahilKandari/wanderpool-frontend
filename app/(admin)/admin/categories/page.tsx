"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ChevronRight, ChevronDown, Tag, CornerDownRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  categoryKeys,
  listRootCategories,
  listCategoryChildren,
  adminCreateCategory,
  adminDeleteCategory,
} from "@/lib/api/categories";
import type { Category } from "@/lib/types/experience";
import Link from "next/link";

function ChildRows({ slug, onDelete }: { slug: string; onDelete: (c: Category) => void }) {
  const { data: children = [], isLoading } = useQuery({
    queryKey: categoryKeys.children(slug),
    queryFn: () => listCategoryChildren(slug),
  });

  if (isLoading) return <div className="px-10 py-2"><Skeleton className="h-8 w-full" /></div>;
  if (children.length === 0) return null;

  return (
    <>
      {children.map((child) => (
        <div key={child.id} className="flex items-center justify-between pl-10 pr-4 py-2.5 border-b last:border-0 bg-muted/20 hover:bg-muted/40">
          <div className="flex items-center gap-3">
            <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-medium">{child.name}</p>
              <p className="text-xs text-muted-foreground">/{child.slug}</p>
            </div>
            {child.is_leaf ? (
              <Badge variant="default" className="text-xs">Leaf</Badge>
            ) : (
              <Badge variant="secondary" className="text-xs">Group</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/admin/categories/${child.id}/fields`}>
                Fields <ChevronRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => onDelete(child)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}

function CategoryRow({
  cat,
  onDelete,
}: {
  cat: Category;
  onDelete: (c: Category) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b hover:bg-muted/40">
        <div className="flex items-center gap-3">
          {!cat.is_leaf ? (
            <button onClick={() => setExpanded((v) => !v)} className="text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : (
            <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium">{cat.name}</p>
            <p className="text-xs text-muted-foreground">/{cat.slug}</p>
          </div>
          {cat.is_leaf ? (
            <Badge variant="default" className="text-xs">Leaf</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Group</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/categories/${cat.id}/fields`}>
              Fields <ChevronRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => onDelete(cat)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {expanded && <ChildRows slug={cat.slug} onDelete={onDelete} />}
    </>
  );
}

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isLeaf, setIsLeaf] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: categoryKeys.roots(),
    queryFn: listRootCategories,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteCategory(id),
    onSuccess: () => {
      toast.success("Category deleted");
      qc.invalidateQueries({ queryKey: categoryKeys.roots() });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      adminCreateCategory({ name: newName, is_leaf: isLeaf }),
    onSuccess: () => {
      toast.success("Category created");
      qc.invalidateQueries({ queryKey: categoryKeys.roots() });
      setCreateOpen(false);
      setNewName("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Manage experience categories and field definitions"
        action={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Category
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title="No categories"
          description="Create your first category to start organizing experiences."
        />
      ) : (
        <div className="rounded-lg border bg-background">
          {categories.map((cat) => (
            <CategoryRow key={cat.id} cat={cat} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
            <DialogDescription>
              Add a new root category to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Water Sports"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isLeaf"
                checked={isLeaf}
                onChange={(e) => setIsLeaf(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isLeaf">
                Is leaf (directly bookable activity)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Delete &ldquo;{deleteTarget?.name}&rdquo;? This will fail if the
              category has active experiences or child categories.
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
