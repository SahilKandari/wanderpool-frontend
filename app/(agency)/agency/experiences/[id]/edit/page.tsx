"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, useFieldArray, type Resolver, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Save, Plus, Trash2, Sun, CloudSun, Sunset, Moon, Clock } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DynamicMetadataForm } from "@/components/experiences/DynamicMetadataForm";
import {
  experienceKeys,
  updateExperience,
  listMyExperiences,
} from "@/lib/api/experiences";

const itinerarySlotSchema = z.object({
  time: z.string().min(1, "Time label is required"),
  description: z.string().min(1, "Description is required"),
});

const itineraryDaySchema = z.object({
  day: z.number().int().min(1),
  title: z.string().min(1, "Day title is required"),
  slots: z.array(itinerarySlotSchema).default([]),
});

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Add a description (min 20 characters)"),
  location_name: z.string().min(2, "Enter the location name"),
  location_city: z.string().min(2, "Enter the city"),
  location_state: z.string().min(1),
  meeting_point: z.string().optional(),
  base_price_paise: z.number().min(1, "Enter a price").int(),
  min_participants: z.number().min(1).int(),
  max_participants: z.number().min(1).int(),
  duration_minutes: z.number().min(1, "Enter duration").int(),
  cancellation_policy: z.enum(["free_48h", "half_refund_24h", "no_refund"]),
  inclusions: z.string().default(""),
  exclusions: z.string().default(""),
  metadata: z.record(z.string(), z.unknown()).default({}),
  itinerary: z.array(itineraryDaySchema).default([]),
});

type FormData = z.infer<typeof schema>;

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
}: {
  dayIndex: number;
  control: Control<FormData>;
  register: ReturnType<typeof useForm<FormData>>["register"];
  errors: ReturnType<typeof useForm<FormData>>["formState"]["errors"];
  remove: () => void;
}) {
  const { fields: slots, append: appendSlot, remove: removeSlot } = useFieldArray({
    control,
    name: `itinerary.${dayIndex}.slots`,
  });

  return (
    <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
        <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md">
          Day {dayIndex + 1}
        </span>
        <button
          type="button"
          onClick={remove}
          className="h-7 w-7 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-4">
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

function LoadingSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-8 w-48" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export default function EditExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  // Fetch from the "mine" list and find this experience by ID
  const { data: allExp, isLoading } = useQuery({
    queryKey: experienceKeys.mine(),
    queryFn: listMyExperiences,
  });

  const experience = allExp?.find((e) => e.id === id);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
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

  // Populate form once experience loads
  useEffect(() => {
    if (!experience) return;
    reset({
      title: experience.title,
      description: experience.description,
      location_name: experience.location_name,
      location_city: experience.location_city,
      location_state: experience.location_state,
      meeting_point: experience.meeting_point ?? "",
      base_price_paise: experience.base_price_paise,
      min_participants: experience.min_participants,
      max_participants: experience.max_participants,
      duration_minutes: experience.duration_minutes,
      cancellation_policy: experience.cancellation_policy,
      inclusions: experience.inclusions?.join(", ") ?? "",
      exclusions: experience.exclusions?.join(", ") ?? "",
      metadata: (experience.metadata as Record<string, unknown>) ?? {},
      itinerary: (experience.itinerary ?? []).map((d) => ({
        day: d.day,
        title: d.title,
        slots: d.slots ?? [],
      })),
    });
  }, [experience, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      updateExperience(id, {
        category_id: experience!.category_id,
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
        inclusions: data.inclusions
          ? data.inclusions.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        exclusions: data.exclusions
          ? data.exclusions.split(",").map((s) => s.trim()).filter(Boolean)
          : [],
        metadata: data.metadata,
        itinerary: data.itinerary,
      }),
    onSuccess: () => {
      toast.success("Experience updated");
      qc.invalidateQueries({ queryKey: experienceKeys.mine() });
      router.push("/agency/experiences");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <LoadingSkeleton />;

  if (!experience) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 text-muted-foreground">
        <p className="text-sm">Experience not found or you don&apos;t have access.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 mb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">Edit: {experience.title}</h1>
            <p className="text-sm text-muted-foreground capitalize">
              Status: <span className="font-medium">{experience.status.replace("_", " ")}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 pl-11 sm:pl-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/agency/experiences/${id}/slots`)}
          >
            Manage Slots
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/agency/experiences/${id}/images`)}
          >
            Manage Photos
          </Button>
        </div>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
            <Tabs defaultValue="details">
              <TabsList className="mb-6 w-full grid grid-cols-3 h-auto gap-1 sm:flex sm:h-10">
                <TabsTrigger value="details" className="py-2 text-xs sm:text-sm sm:flex-1">Details</TabsTrigger>
                <TabsTrigger value="pricing" className="py-2 text-xs sm:text-sm sm:flex-1">Pricing & Policy</TabsTrigger>
                <TabsTrigger value="activity" className="py-2 text-xs sm:text-sm sm:flex-1">Activity Info</TabsTrigger>
                <TabsTrigger value="itinerary" className="py-2 text-xs sm:text-sm sm:flex-1">Itinerary</TabsTrigger>
                <TabsTrigger
                  value="slots"
                  className="py-2 text-xs sm:text-sm sm:flex-1"
                  onClick={() => router.push(`/agency/experiences/${id}/slots`)}
                >
                  Slots
                </TabsTrigger>
              </TabsList>

              {/* Tab: Details */}
              <TabsContent value="details" className="space-y-4 mt-0">
                <div className="space-y-1.5">
                  <Label>Experience Title <span className="text-destructive">*</span></Label>
                  <Input {...register("title")} />
                  {errors.title && (
                    <p className="text-xs text-destructive">{errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Description <span className="text-destructive">*</span></Label>
                  <Textarea rows={4} {...register("description")} />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description.message}</p>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Location Name <span className="text-destructive">*</span></Label>
                    <Input {...register("location_name")} />
                    {errors.location_name && (
                      <p className="text-xs text-destructive">{errors.location_name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>City <span className="text-destructive">*</span></Label>
                    <Input {...register("location_city")} />
                    {errors.location_city && (
                      <p className="text-xs text-destructive">{errors.location_city.message}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Meeting Point</Label>
                  <Input placeholder="Exact landmark or address" {...register("meeting_point")} />
                </div>
              </TabsContent>

              {/* Tab: Pricing & Policy */}
              <TabsContent value="pricing" className="space-y-4 mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            className="pl-7"
                            value={field.value ? field.value / 100 : ""}
                            onChange={(e) =>
                              field.onChange(Math.round(Number(e.target.value) * 100))
                            }
                          />
                        )}
                      />
                    </div>
                    {errors.base_price_paise && (
                      <p className="text-xs text-destructive">{errors.base_price_paise.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Duration (minutes) <span className="text-destructive">*</span></Label>
                    <Controller
                      control={control}
                      name="duration_minutes"
                      render={({ field }) => (
                        <Input
                          type="number"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                    {errors.duration_minutes && (
                      <p className="text-xs text-destructive">{errors.duration_minutes.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Min Participants</Label>
                    <Controller
                      control={control}
                      name="min_participants"
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={1}
                          value={field.value ?? 1}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Max Participants</Label>
                    <Controller
                      control={control}
                      name="max_participants"
                      render={({ field }) => (
                        <Input
                          type="number"
                          min={1}
                          value={field.value ?? 20}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Cancellation Policy</Label>
                  <Controller
                    control={control}
                    name="cancellation_policy"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free_48h">Free cancel up to 48 hours before</SelectItem>
                          <SelectItem value="half_refund_24h">50% refund up to 24 hours before</SelectItem>
                          <SelectItem value="no_refund">No refund</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Inclusions</Label>
                    <Textarea
                      placeholder="Life jacket, Helmet (comma-separated)"
                      rows={3}
                      {...register("inclusions")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Exclusions</Label>
                    <Textarea
                      placeholder="Meals, Insurance (comma-separated)"
                      rows={3}
                      {...register("exclusions")}
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Activity Info (dynamic metadata) */}
              <TabsContent value="activity" className="mt-0">
                <DynamicMetadataForm
                  categoryId={experience.category_id}
                  control={control as never}
                />
              </TabsContent>

              {/* Tab: Itinerary */}
              <TabsContent value="itinerary" className="mt-0">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Add a day-by-day breakdown with Morning, Afternoon, Evening, and Night activities. Customers see this as an expandable itinerary on your listing page.
                  </p>
                </div>
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
                    onClick={() => append({ day: fields.length + 1, title: "", slots: [] })}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add {fields.length === 0 ? "Day 1" : `Day ${fields.length + 1}`}
                  </Button>

                  {fields.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      No itinerary added yet. Click above to add the first day.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending || !isDirty}
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {mutation.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
