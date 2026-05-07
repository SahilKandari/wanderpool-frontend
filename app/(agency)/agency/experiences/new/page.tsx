"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray, type Resolver, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Plus, Trash2, Sun, CloudSun, Sunset, Moon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { CategoryPicker } from "@/components/experiences/CategoryPicker";
import { DynamicMetadataForm } from "@/components/experiences/DynamicMetadataForm";
import { experienceKeys, createExperience } from "@/lib/api/experiences";
import { categoryKeys, getCategoryFields } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const itinerarySlotSchema = z.object({
  time: z.string().min(1, "Time label is required"),
  description: z.string().min(1, "Description is required"),
});

const itineraryDaySchema = z.object({
  day: z.number().int().min(1),
  title: z.string().min(1, "Day title is required"),
  description: z.string().default(""),
  slots: z.array(itinerarySlotSchema).default([]),
});

const schema = z.object({
  category_id: z.string().min(1, "Select a category"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Add a description (min 20 characters)"),
  location_name: z.string().min(2, "Enter the location name"),
  location_city: z.string().min(2, "Enter the city"),
  location_state: z.string().default("Uttarakhand"),
  meeting_point: z.string().optional(),
  base_price_paise: z.number().min(1, "Enter a price").int(),
  min_participants: z.number().min(1).int().default(1),
  max_participants: z.number().min(1).int().default(20),
  duration_minutes: z.number().min(1, "Enter duration").int(),
  cancellation_policy: z.enum(["free_48h", "half_refund_24h", "no_refund"]).default("free_48h"),
  inclusions: z.string().default(""),
  exclusions: z.string().default(""),
  metadata: z.record(z.string(), z.unknown()).default({}),
  itinerary: z.array(itineraryDaySchema).default([]),
});

type FormData = z.infer<typeof schema>;

const STEPS = ["Category", "Details", "Pricing & Policy", "Activity Info", "Itinerary"];

const TIME_PRESETS = [
  { label: "Morning", Icon: Sun },
  { label: "Afternoon", Icon: CloudSun },
  { label: "Evening", Icon: Sunset },
  { label: "Night", Icon: Moon },
] as const;

function timeIcon(time: string) {
  const match = TIME_PRESETS.find((p) => p.label.toLowerCase() === time.toLowerCase());
  return match ? match.Icon : Clock;
}

function DayCard({
  dayIndex,
  control,
  register,
  errors,
  remove,
  hideHeader = false,
}: {
  dayIndex: number;
  control: Control<FormData>;
  register: ReturnType<typeof useForm<FormData>>["register"];
  errors: ReturnType<typeof useForm<FormData>>["formState"]["errors"];
  remove: () => void;
  hideHeader?: boolean;
}) {
  const { fields: slots, append: appendSlot, remove: removeSlot } = useFieldArray({
    control,
    name: `itinerary.${dayIndex}.slots`,
  });

  return (
    <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
      {!hideHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md">
              Day {dayIndex + 1}
            </span>
          </div>
          <button
            type="button"
            onClick={remove}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Day title */}
        <div className="space-y-1.5">
          <Label className="text-xs">Day Title <span className="text-destructive">*</span></Label>
          <Input
            placeholder="e.g. Arrival & Rishikesh Exploration"
            {...register(`itinerary.${dayIndex}.title`)}
          />
          {errors.itinerary?.[dayIndex]?.title && (
            <p className="text-xs text-destructive">{errors.itinerary[dayIndex]?.title?.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Day Description</Label>
          <Textarea
            rows={2}
            placeholder="Brief overview of the day…"
            {...register(`itinerary.${dayIndex}.description`)}
          />
        </div>

        {/* Time slots */}
        {slots.length > 0 && (
          <div className="space-y-2">
            {slots.map((slot, si) => {
              const SlotIcon = timeIcon(slot.time);
              return (
                <div key={slot.id} className="rounded-lg border border-border bg-background p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <SlotIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <Input
                      className="h-7 text-xs font-semibold"
                      placeholder="e.g. Morning"
                      {...register(`itinerary.${dayIndex}.slots.${si}.time`)}
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot(si)}
                      className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                  <Textarea
                    rows={2}
                    className="text-xs"
                    placeholder="What happens during this time…"
                    {...register(`itinerary.${dayIndex}.slots.${si}.description`)}
                  />
                  {errors.itinerary?.[dayIndex]?.slots?.[si]?.description && (
                    <p className="text-xs text-destructive">{errors.itinerary[dayIndex]?.slots?.[si]?.description?.message}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Quick-add preset buttons */}
        <div className="space-y-2">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Quick add</p>
          <div className="flex flex-wrap gap-1.5">
            {TIME_PRESETS.map(({ label, Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => appendSlot({ time: label, description: "" })}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/15 transition-colors"
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => appendSlot({ time: "", description: "" })}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Clock className="h-3 w-3" />
              Custom
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NewExperiencePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  const { control, register, watch, trigger, setError, clearErrors, getValues, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: {
      location_state: "Uttarakhand",
      min_participants: 1,
      max_participants: 20,
      cancellation_policy: "free_48h",
      metadata: {},
      itinerary: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "itinerary" });
  const [itineraryMode, setItineraryMode] = useState<"single" | "multi">("single");

  function switchToSingle() {
    const toRemove = Array.from({ length: fields.length - 1 }, (_, i) => i + 1);
    if (toRemove.length > 0) remove(toRemove as never);
    if (fields.length === 0) append({ day: 1, title: "", description: "", slots: [] });
    setItineraryMode("single");
  }
  function switchToMulti() { setItineraryMode("multi"); }

  const selectedCategory = watch("category_id");

  // Fetch required metadata fields for client-side validation before submit.
  const { data: categoryFields = [] } = useQuery({
    queryKey: categoryKeys.fields(selectedCategory),
    queryFn: () => getCategoryFields(selectedCategory),
    enabled: !!selectedCategory,
  });

  // Fields that must pass validation on each step before advancing.
  const STEP_FIELDS: (keyof FormData)[][] = [
    ["category_id"],
    ["title", "description", "location_name", "location_city"],
    ["base_price_paise", "duration_minutes"],
    [], // activity info — validated at submit time
    [], // itinerary — optional
  ];

  const mutation = useMutation({
    mutationFn: (data: FormData) => createExperience({
      category_id: data.category_id,
      title: data.title,
      description: data.description,
      location_name: data.location_name,
      location_city: data.location_city,
      location_state: data.location_state,
      meeting_point: data.meeting_point ?? null,
      base_price_paise: data.base_price_paise,
      min_participants: data.min_participants,
      max_participants: data.max_participants,
      duration_minutes: data.duration_minutes,
      cancellation_policy: data.cancellation_policy,
      inclusions: data.inclusions ? data.inclusions.split(",").map(s => s.trim()).filter(Boolean) : [],
      exclusions: data.exclusions ? data.exclusions.split(",").map(s => s.trim()).filter(Boolean) : [],
      metadata: data.metadata,
      itinerary: data.itinerary,
    }),
    onSuccess: (exp) => {
      toast.success("Experience created! Now add your available slots.");
      qc.invalidateQueries({ queryKey: experienceKeys.mine() });
      router.push(`/agency/experiences/${exp.id}/slots`);
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.fields) {
        const missing = Object.keys(err.fields).join(", ");
        toast.error(`Please fill in: ${missing}`, { duration: 6000 });
        setStep(3);
      } else {
        toast.error(err.message);
      }
    },
  });

  async function handleNext() {
    const stepFields = STEP_FIELDS[step];
    const valid = stepFields.length === 0 || await trigger(stepFields);
    if (valid) {
      clearErrors();
      setStep((s) => s + 1);
    }
  }

  async function handleCreate() {
    const isZodValid = await trigger();
    if (!isZodValid) {
      for (let i = 0; i < STEP_FIELDS.length; i++) {
        if (STEP_FIELDS[i].some((f) => errors[f])) {
          setStep(i);
          toast.error("Please fix the highlighted fields before continuing.");
          return;
        }
      }
      return;
    }

    const data = getValues();
    const missingFields = categoryFields.filter((f) => {
      if (!f.is_required) return false;
      const val = data.metadata?.[f.field_key];
      return val === undefined || val === null || val === "" ||
        (Array.isArray(val) && val.length === 0);
    });

    if (missingFields.length > 0) {
      missingFields.forEach((f) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setError(`metadata.${f.field_key}` as any, { message: "This field is required" });
      });
      toast.error(`Please fill in: ${missingFields.map((f) => f.label).join(", ")}`);
      return;
    }

    mutation.mutate(data);
  }

  const stepContent = [
    /* Step 0 — Category */
    <div key="cat" className="space-y-4">
      <Controller
        control={control}
        name="category_id"
        render={({ field }) => (
          <CategoryPicker value={field.value ?? ""} onChange={field.onChange} />
        )}
      />
      {errors.category_id && (
        <p className="text-xs text-destructive">{errors.category_id.message}</p>
      )}
    </div>,

    /* Step 1 — Basic details */
    <div key="details" className="space-y-4">
      <div className="space-y-1.5">
        <Label>Experience Title <span className="text-destructive">*</span></Label>
        <Input placeholder="e.g. Shivpuri to Rishikesh Rafting" {...register("title")} />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Description <span className="text-destructive">*</span></Label>
        <Textarea
          placeholder="Describe the experience — what to expect, highlights, who it's for…"
          rows={4}
          {...register("description")}
        />
        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Location Name <span className="text-destructive">*</span></Label>
          <Input placeholder="Shivpuri Beach, Rishikesh" {...register("location_name")} />
          {errors.location_name && <p className="text-xs text-destructive">{errors.location_name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>City <span className="text-destructive">*</span></Label>
          <Input placeholder="Rishikesh" {...register("location_city")} />
          {errors.location_city && <p className="text-xs text-destructive">{errors.location_city.message}</p>}
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Meeting Point</Label>
        <Input placeholder="Exact landmark or address" {...register("meeting_point")} />
      </div>
    </div>,

    /* Step 2 — Pricing & policy */
    <div key="pricing" className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Base Price (₹) <span className="text-destructive">*</span></Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
            <Controller
              control={control}
              name="base_price_paise"
              render={({ field }) => (
                <Input
                  type="number"
                  placeholder="1500"
                  className="pl-7"
                  value={field.value ? field.value / 100 : ""}
                  onChange={(e) => field.onChange(Math.round(Number(e.target.value) * 100))}
                />
              )}
            />
          </div>
          {errors.base_price_paise && <p className="text-xs text-destructive">{errors.base_price_paise.message}</p>}
          <p className="text-xs text-muted-foreground">Enter in ₹ rupees (stored as paise)</p>
        </div>
        <div className="space-y-1.5">
          <Label>Duration (minutes) <span className="text-destructive">*</span></Label>
          <Controller
            control={control}
            name="duration_minutes"
            render={({ field }) => (
              <Input
                type="number"
                placeholder="120"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(Number(e.target.value))}
              />
            )}
          />
          {errors.duration_minutes && <p className="text-xs text-destructive">{errors.duration_minutes.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Min Participants</Label>
          <Controller control={control} name="min_participants" render={({ field }) => (
            <Input type="number" min={1} value={field.value ?? 1} onChange={(e) => field.onChange(Number(e.target.value))} />
          )} />
        </div>
        <div className="space-y-1.5">
          <Label>Max Participants</Label>
          <Controller control={control} name="max_participants" render={({ field }) => (
            <Input type="number" min={1} value={field.value ?? 20} onChange={(e) => field.onChange(Number(e.target.value))} />
          )} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Cancellation Policy</Label>
        <Controller control={control} name="cancellation_policy" render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="free_48h">Free cancel up to 48 hours before</SelectItem>
              <SelectItem value="half_refund_24h">50% refund up to 24 hours before</SelectItem>
              <SelectItem value="no_refund">No refund</SelectItem>
            </SelectContent>
          </Select>
        )} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Inclusions</Label>
          <Textarea placeholder="Life jacket, Helmet, Guide (comma-separated)" rows={3} {...register("inclusions")} />
        </div>
        <div className="space-y-1.5">
          <Label>Exclusions</Label>
          <Textarea placeholder="Meals, Insurance (comma-separated)" rows={3} {...register("exclusions")} />
        </div>
      </div>
    </div>,

    /* Step 3 — Dynamic metadata */
    <div key="meta">
      <DynamicMetadataForm categoryId={selectedCategory} control={control as never} />
    </div>,

    /* Step 4 — Itinerary */
    <div key="itinerary" className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Optionally add an itinerary with time-of-day activity slots. Customers see this on your listing page.
      </p>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
        <button
          type="button"
          onClick={switchToSingle}
          className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all",
            itineraryMode === "single" ? "bg-background shadow-sm text-slate-900" : "text-muted-foreground hover:text-slate-700")}
        >
          Single Day
        </button>
        <button
          type="button"
          onClick={switchToMulti}
          className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all",
            itineraryMode === "multi" ? "bg-background shadow-sm text-slate-900" : "text-muted-foreground hover:text-slate-700")}
        >
          Multi Day
        </button>
      </div>

      {itineraryMode === "single" ? (
        <div className="space-y-3">
          {fields.length > 0 ? (
            <DayCard
              dayIndex={0}
              control={control}
              register={register}
              errors={errors}
              remove={() => {}}
              hideHeader={true}
            />
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed"
              onClick={() => append({ day: 1, title: "", description: "", slots: [] })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <DayCard
              key={field.id}
              dayIndex={index}
              control={control}
              register={register}
              errors={errors}
              remove={() => remove(index)}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed"
            onClick={() => append({ day: fields.length + 1, title: "", description: "", slots: [] })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add {fields.length === 0 ? "Day 1" : `Day ${fields.length + 1}`}
          </Button>
          {fields.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              No itinerary added. You can skip this step or add days above.
            </p>
          )}
        </div>
      )}
    </div>,
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Create Experience</h1>
          <p className="text-sm text-muted-foreground">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 transition-all",
              i < step ? "bg-primary text-white" :
              i === step ? "bg-primary/20 text-primary ring-2 ring-primary/30" :
              "bg-muted text-muted-foreground"
            )}>
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn("text-xs font-medium hidden sm:block", i === step ? "text-primary" : "text-muted-foreground")}>
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px flex-1 transition-colors", i < step ? "bg-primary" : "bg-border")} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={(e) => e.preventDefault()}>
            {stepContent[step]}

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={step === 0}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>

              {step < STEPS.length - 1 ? (
                <Button type="button" onClick={handleNext}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleCreate} disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {mutation.isPending ? "Creating…" : "Create Experience"}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
