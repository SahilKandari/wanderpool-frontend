"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  categoryKeys,
  listRootCategories,
  listCategoryChildren,
} from "@/lib/api/categories";
import type { Category } from "@/lib/types/experience";

interface CategoryPickerProps {
  value: string; // selected leaf category ID
  onChange: (id: string) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { data: roots = [], isLoading: loadingRoots } = useQuery({
    queryKey: categoryKeys.roots(),
    queryFn: listRootCategories,
  });

  // Find selected root by checking which root contains the selected leaf
  const [selectedRoot, setSelectedRoot] = React.useState<Category | null>(null);

  const { data: children = [], isLoading: loadingChildren } = useQuery({
    queryKey: categoryKeys.children(selectedRoot?.slug ?? ""),
    queryFn: () => listCategoryChildren(selectedRoot!.slug),
    enabled: !!selectedRoot && !selectedRoot.is_leaf,
  });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Category
        </Label>
        {loadingRoots ? (
          <div className="flex gap-2 mt-2 flex-wrap">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-2">
            {roots.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => { setSelectedRoot(cat); if (cat.is_leaf) onChange(cat.id); }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                  selectedRoot?.id === cat.id
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-border text-muted-foreground hover:border-primary hover:text-primary"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedRoot && !selectedRoot.is_leaf && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Activity Type
            </Label>
          </div>
          {loadingChildren ? (
            <div className="flex gap-2 flex-wrap">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-28 rounded-full" />)}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {children.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onChange(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                    value === cat.id
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-border text-muted-foreground hover:border-primary hover:text-primary"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React from "react";
