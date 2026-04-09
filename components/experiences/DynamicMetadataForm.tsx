"use client";

import { useQuery } from "@tanstack/react-query";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Controller, type Control, type FieldValues } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryKeys, getCategoryFields } from "@/lib/api/categories";
import type { CategoryField } from "@/lib/types/experience";
import { cn } from "@/lib/utils";

interface DynamicMetadataFormProps {
  categoryId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<FieldValues, any, FieldValues>;
  namePrefix?: string; // default "metadata"
}

function FieldInput({
  field,
  control,
  namePrefix,
}: {
  field: CategoryField;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<FieldValues, any, FieldValues>;
  namePrefix: string;
}) {
  const fieldName = `${namePrefix}.${field.field_key}`;

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {field.label}
        {field.is_required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <Controller
        control={control}
        name={fieldName}
        render={({ field: f, fieldState }) => (
          <>
            {field.field_type === "boolean" ? (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={fieldName}
                  checked={!!f.value}
                  onChange={(e) => f.onChange(e.target.checked)}
                  className="h-4 w-4 accent-primary rounded"
                />
                <label htmlFor={fieldName} className="text-sm text-muted-foreground">
                  {field.label}
                </label>
              </div>
            ) : field.field_type === "enum" && field.enum_values ? (
              <Select value={f.value ?? ""} onValueChange={f.onChange}>
                <SelectTrigger className={cn(fieldState.error && "border-destructive")}>
                  <SelectValue placeholder={`Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.enum_values.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.field_type === "number" ? (
              <Input
                type="number"
                min={field.validation?.min}
                max={field.validation?.max}
                value={f.value ?? ""}
                onChange={(e) => f.onChange(e.target.value === "" ? undefined : Number(e.target.value))}
                className={cn(fieldState.error && "border-destructive")}
                placeholder={field.validation?.min != null ? `Min: ${field.validation.min}` : undefined}
              />
            ) : field.field_type === "string_array" ? (
              <Input
                value={Array.isArray(f.value) ? f.value.join(", ") : (f.value ?? "")}
                onChange={(e) =>
                  f.onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))
                }
                placeholder="Comma-separated values"
                className={cn(fieldState.error && "border-destructive")}
              />
            ) : (
              <Input
                value={f.value ?? ""}
                onChange={f.onChange}
                className={cn(fieldState.error && "border-destructive")}
              />
            )}
            {fieldState.error && (
              <p className="text-xs text-destructive">{fieldState.error.message}</p>
            )}
          </>
        )}
      />
    </div>
  );
}

export function DynamicMetadataForm({
  categoryId,
  control,
  namePrefix = "metadata",
}: DynamicMetadataFormProps) {
  const { data: fields = [], isLoading } = useQuery({
    queryKey: categoryKeys.fields(categoryId),
    queryFn: () => getCategoryFields(categoryId),
    enabled: !!categoryId,
  });

  if (!categoryId) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Select a category above to see activity-specific fields.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (fields.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic py-4">
        No activity-specific fields defined for this category yet.
      </p>
    );
  }

  // Group by group_name
  const groups = fields.reduce<Record<string, CategoryField[]>>((acc, f) => {
    const g = f.group_name ?? "General";
    (acc[g] ??= []).push(f);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([group, groupFields]) => (
        <div key={group}>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 pb-1 border-b">
            {group}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groupFields.map((f) => (
              <FieldInput key={f.field_key} field={f} control={control} namePrefix={namePrefix} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
