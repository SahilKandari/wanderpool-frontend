"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Pencil, GripVertical,
  ToggleLeft, Hash, Type, List, LayoutList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  categoryKeys,
  adminListFields,
  adminCreateField,
  adminUpdateField,
  adminDeleteField,
} from "@/lib/api/categories";
import type { CategoryField, FieldType } from "@/lib/types/experience";
import { cn } from "@/lib/utils";

const FIELD_TYPES: { value: FieldType; label: string; icon: React.ReactNode }[] = [
  { value: "string", label: "Text", icon: <Type className="h-3.5 w-3.5" /> },
  { value: "number", label: "Number", icon: <Hash className="h-3.5 w-3.5" /> },
  { value: "boolean", label: "Boolean", icon: <ToggleLeft className="h-3.5 w-3.5" /> },
  { value: "enum", label: "Dropdown", icon: <List className="h-3.5 w-3.5" /> },
  { value: "string_array", label: "Tag List", icon: <LayoutList className="h-3.5 w-3.5" /> },
];

function fieldTypeColor(type: FieldType) {
  switch (type) {
    case "string": return "bg-blue-50 text-blue-700 border-blue-200";
    case "number": return "bg-purple-50 text-purple-700 border-purple-200";
    case "boolean": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "enum": return "bg-orange-50 text-orange-700 border-orange-200";
    case "string_array": return "bg-cyan-50 text-cyan-700 border-cyan-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

interface FieldFormState {
  field_key: string;
  label: string;
  field_type: FieldType;
  is_required: boolean;
  is_public: boolean;
  group_name: string;
  enum_values: string; // comma-separated
  validation_min: string;
  validation_max: string;
  sort_order: string;
}

const emptyForm = (): FieldFormState => ({
  field_key: "",
  label: "",
  field_type: "string",
  is_required: false,
  is_public: true,
  group_name: "",
  enum_values: "",
  validation_min: "",
  validation_max: "",
  sort_order: "0",
});

function buildPayload(form: FieldFormState): Partial<CategoryField> {
  const enumVals =
    form.field_type === "enum"
      ? form.enum_values.split(",").map((s) => s.trim()).filter(Boolean)
      : null;
  const validation =
    form.field_type === "number" && (form.validation_min || form.validation_max)
      ? {
          ...(form.validation_min ? { min: Number(form.validation_min) } : {}),
          ...(form.validation_max ? { max: Number(form.validation_max) } : {}),
        }
      : null;
  return {
    field_key: form.field_key,
    label: form.label,
    field_type: form.field_type,
    is_required: form.is_required,
    is_public: form.is_public,
    group_name: form.group_name || null,
    enum_values: enumVals,
    validation: validation,
    sort_order: Number(form.sort_order),
  };
}

function FieldRow({
  field,
  categoryId,
  onEdit,
  onDelete,
}: {
  field: CategoryField;
  categoryId: string;
  onEdit: (f: CategoryField) => void;
  onDelete: (f: CategoryField) => void;
}) {
  const isInherited = field.category_id !== categoryId;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 border-b last:border-0 group",
      isInherited ? "bg-muted/20" : "hover:bg-muted/30"
    )}>
      <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-sm font-medium", isInherited && "text-muted-foreground")}>{field.label}</span>
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">
            {field.field_key}
          </code>
          <span className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded border capitalize",
            fieldTypeColor(field.field_type)
          )}>
            {field.field_type.replace("_", " ")}
          </span>
          {field.is_required && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0">Required</Badge>
          )}
          {!field.is_public && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">Internal</Badge>
          )}
          {isInherited && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0">Inherited</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {field.group_name && (
            <span className="text-xs text-muted-foreground">Group: {field.group_name}</span>
          )}
          {field.enum_values && field.enum_values.length > 0 && (
            <span className="text-xs text-muted-foreground truncate max-w-xs">
              Options: {field.enum_values.join(", ")}
            </span>
          )}
          {field.validation && (
            <span className="text-xs text-muted-foreground">
              {field.validation.min != null && `Min: ${field.validation.min}`}
              {field.validation.min != null && field.validation.max != null && " · "}
              {field.validation.max != null && `Max: ${field.validation.max}`}
            </span>
          )}
        </div>
      </div>
      {!isInherited && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(field)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => onDelete(field)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

function FieldDialog({
  open,
  onOpenChange,
  onSave,
  initial,
  isPending,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: (form: FieldFormState) => void;
  initial?: FieldFormState;
  isPending: boolean;
  title: string;
}) {
  const [form, setForm] = useState<FieldFormState>(initial ?? emptyForm());

  // Reset when dialog opens with new initial
  const handleOpen = (v: boolean) => {
    if (v) setForm(initial ?? emptyForm());
    onOpenChange(v);
  };

  function set<K extends keyof FieldFormState>(key: K, val: FieldFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Define a field that will appear in the experience creation form for this category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Field Key <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. rapids_grade"
                value={form.field_key}
                onChange={(e) => set("field_key", e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              />
              <p className="text-xs text-muted-foreground">snake_case, stored in metadata JSON</p>
            </div>
            <div className="space-y-1.5">
              <Label>Display Label <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. Rapids Grade"
                value={form.label}
                onChange={(e) => set("label", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Field Type <span className="text-destructive">*</span></Label>
            <Select value={form.field_type} onValueChange={(v) => set("field_type", v as FieldType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((ft) => (
                  <SelectItem key={ft.value} value={ft.value}>
                    <div className="flex items-center gap-2">
                      {ft.icon}
                      {ft.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {form.field_type === "enum" && (
            <div className="space-y-1.5">
              <Label>Options <span className="text-destructive">*</span></Label>
              <Input
                placeholder="e.g. I, II, III, IV, V, VI"
                value={form.enum_values}
                onChange={(e) => set("enum_values", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Comma-separated values</p>
            </div>
          )}

          {form.field_type === "number" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Min Value</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.validation_min}
                  onChange={(e) => set("validation_min", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Max Value</Label>
                <Input
                  type="number"
                  placeholder="9999"
                  value={form.validation_max}
                  onChange={(e) => set("validation_max", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Group Name</Label>
              <Input
                placeholder="e.g. Safety, Details"
                value={form.group_name}
                onChange={(e) => set("group_name", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Groups fields into sections</p>
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input
                type="number"
                min={0}
                value={form.sort_order}
                onChange={(e) => set("sort_order", e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_required}
                onChange={(e) => set("is_required", e.target.checked)}
                className="h-4 w-4 accent-primary rounded"
              />
              <span className="text-sm font-medium">Required field</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => set("is_public", e.target.checked)}
                className="h-4 w-4 accent-primary rounded"
              />
              <span className="text-sm font-medium">Public (shown to customers)</span>
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={isPending || !form.field_key.trim() || !form.label.trim()}
            onClick={() => onSave(form)}
          >
            {isPending ? "Saving…" : "Save Field"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoryFieldsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryField | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryField | null>(null);

  const { data: fields = [], isLoading } = useQuery({
    queryKey: categoryKeys.fields(id),
    queryFn: () => adminListFields(id),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (form: FieldFormState) =>
      adminCreateField(id, buildPayload(form)),
    onSuccess: () => {
      toast.success("Field created");
      qc.invalidateQueries({ queryKey: categoryKeys.fields(id) });
      setCreateOpen(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: (form: FieldFormState) =>
      adminUpdateField(editTarget!.id, buildPayload(form)),
    onSuccess: () => {
      toast.success("Field updated");
      qc.invalidateQueries({ queryKey: categoryKeys.fields(id) });
      setEditTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (fieldId: string) => adminDeleteField(fieldId),
    onSuccess: () => {
      toast.success("Field deleted");
      qc.invalidateQueries({ queryKey: categoryKeys.fields(id) });
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Group fields by group_name for display
  const groups = fields.reduce<Record<string, CategoryField[]>>((acc, f) => {
    const g = f.group_name ?? "General";
    (acc[g] ??= []).push(f);
    return acc;
  }, {});

  function editInitial(f: CategoryField): FieldFormState {
    return {
      field_key: f.field_key,
      label: f.label,
      field_type: f.field_type,
      is_required: f.is_required,
      is_public: f.is_public,
      group_name: f.group_name ?? "",
      enum_values: f.enum_values?.join(", ") ?? "",
      validation_min: f.validation?.min != null ? String(f.validation.min) : "",
      validation_max: f.validation?.max != null ? String(f.validation.max) : "",
      sort_order: String(f.sort_order),
    };
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Category Fields</h1>
          <p className="text-sm text-muted-foreground">
            Define metadata fields for this category. These drive the experience form and validation.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Field
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Fields", value: fields.length },
          { label: "Required", value: fields.filter((f) => f.is_required).length },
          { label: "Groups", value: Object.keys(groups).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card rounded-xl border p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Field list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : fields.length === 0 ? (
        <EmptyState
          title="No fields defined"
          description="Add fields to drive the experience creation form for this category."
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(groups).map(([group, groupFields]) => (
            <div key={group}>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 px-1">
                {group}
              </h3>
              <div className="bg-card rounded-xl border overflow-hidden">
                {groupFields.map((f) => (
                  <FieldRow
                    key={f.id}
                    field={f}
                    categoryId={id}
                    onEdit={setEditTarget}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <FieldDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={(form) => createMutation.mutate(form)}
        isPending={createMutation.isPending}
        title="Add Field"
      />

      {/* Edit dialog */}
      {editTarget && (
        <FieldDialog
          open={!!editTarget}
          onOpenChange={(open) => !open && setEditTarget(null)}
          onSave={(form) => updateMutation.mutate(form)}
          isPending={updateMutation.isPending}
          initial={editInitial(editTarget)}
          title="Edit Field"
        />
      )}

      {/* Delete confirm */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Field</DialogTitle>
            <DialogDescription>
              Delete &ldquo;{deleteTarget?.label}&rdquo; (<code>{deleteTarget?.field_key}</code>)?
              This may break existing experience metadata that uses this key.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
