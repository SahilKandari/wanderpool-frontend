"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  CalendarDays,
  Clock,
  Users,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  slotKeys,
  listAgencyExperienceSlots,
  createSlot,
  bulkCreateSlots,
  deleteSlot,
  type AgencySlot,
} from "@/lib/api/slots";
import { experienceKeys, listMyExperiences } from "@/lib/api/experiences";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ManageSlotsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();

  // Single slot form
  const [singleDate, setSingleDate] = useState("");
  const [singleTime, setSingleTime] = useState("09:00");
  const [singleCapacity, setSingleCapacity] = useState(20);

  // Bulk form
  const [bulkFrom, setBulkFrom] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [bulkTo, setBulkTo] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 29);
    return d.toISOString().split("T")[0];
  });
  const [bulkTimes, setBulkTimes] = useState<string[]>(["09:00"]);
  const [bulkDays, setBulkDays] = useState<number[]>([]); // empty = every day
  const [bulkCapacity, setBulkCapacity] = useState(20);
  const [newTime, setNewTime] = useState("14:00");

  // Fetch experience to get title + duration
  const { data: allExp } = useQuery({
    queryKey: experienceKeys.mine(),
    queryFn: listMyExperiences,
  });
  const experience = allExp?.find((e) => e.id === id);

  // Fetch slots
  const {
    data: slots = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: slotKeys.forExperience(id),
    queryFn: () => listAgencyExperienceSlots(id),
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: slotKeys.forExperience(id) });

  // Create single slot
  const createMutation = useMutation({
    mutationFn: () => {
      if (!singleDate || !singleTime) throw new Error("Pick a date and time");
      const startsAt = `${singleDate}T${singleTime}`;
      const durationMins = experience?.duration_minutes ?? 60;
      const [h, m] = singleTime.split(":").map(Number);
      const endsDate = new Date(singleDate);
      endsDate.setHours(h, m + durationMins, 0, 0);
      const endsAt = `${singleDate}T${String(endsDate.getHours()).padStart(2, "0")}:${String(endsDate.getMinutes()).padStart(2, "0")}`;
      return createSlot(id, { starts_at: startsAt, ends_at: endsAt, capacity: singleCapacity });
    },
    onSuccess: () => {
      toast.success("Slot created");
      setSingleDate("");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Bulk create
  const bulkMutation = useMutation({
    mutationFn: () =>
      bulkCreateSlots(id, {
        date_from: bulkFrom,
        date_to: bulkTo,
        time_slots: bulkTimes,
        days_of_week: bulkDays.length > 0 ? bulkDays : undefined,
        capacity: bulkCapacity,
      }),
    onSuccess: (res) => {
      toast.success(`Created ${res.created} slots`);
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Delete slot
  const deleteMutation = useMutation({
    mutationFn: (slotId: string) => deleteSlot(id, slotId),
    onSuccess: () => {
      toast.success("Slot deleted");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function toggleDay(d: number) {
    setBulkDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  }

  function addTime() {
    if (!newTime || bulkTimes.includes(newTime)) return;
    setBulkTimes((prev) => [...prev, newTime].sort());
    setNewTime("");
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming = slots.filter((s) => new Date(s.starts_at) >= new Date());
  const past = slots.filter((s) => new Date(s.starts_at) < new Date());

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold">Manage Slots</h1>
          {experience && (
            <p className="text-sm text-muted-foreground truncate">
              {experience.title} · {experience.duration_minutes} min
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/agency/experiences/${id}/images`)}
        >
          Manage Photos
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Add slots */}
        <div className="space-y-4">
          <Tabs defaultValue="bulk">
            <TabsList className="w-full">
              <TabsTrigger value="bulk" className="flex-1">
                Recurring Schedule
              </TabsTrigger>
              <TabsTrigger value="single" className="flex-1">
                Single Slot
              </TabsTrigger>
            </TabsList>

            {/* Bulk / Recurring */}
            <TabsContent value="bulk">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 text-primary" />
                    Create Recurring Slots
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Date range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>From</Label>
                      <Input
                        type="date"
                        min={today}
                        value={bulkFrom}
                        onChange={(e) => setBulkFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>To</Label>
                      <Input
                        type="date"
                        min={bulkFrom || today}
                        value={bulkTo}
                        onChange={(e) => setBulkTo(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Days of week */}
                  <div className="space-y-1.5">
                    <Label>
                      Days{" "}
                      <span className="text-muted-foreground text-xs font-normal">
                        (leave all off = every day)
                      </span>
                    </Label>
                    <div className="flex gap-1.5 flex-wrap">
                      {DAYS.map((day, i) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(i)}
                          className={cn(
                            "h-8 w-10 rounded-lg text-xs font-semibold border transition-colors",
                            bulkDays.includes(i)
                              ? "bg-primary text-white border-primary"
                              : "border-border text-muted-foreground hover:border-primary/50"
                          )}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                    {bulkDays.length === 0 && (
                      <p className="text-xs text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Slots will run every day
                      </p>
                    )}
                  </div>

                  {/* Time slots */}
                  <div className="space-y-1.5">
                    <Label>Start Times (IST)</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {bulkTimes.map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() =>
                              setBulkTimes((prev) => prev.filter((x) => x !== t))
                            }
                            className="ml-0.5 hover:text-destructive transition-colors"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="button" variant="outline" size="sm" onClick={addTime}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="space-y-1.5">
                    <Label>Capacity per slot</Label>
                    <Input
                      type="number"
                      min={1}
                      value={bulkCapacity}
                      onChange={(e) => setBulkCapacity(Number(e.target.value))}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => bulkMutation.mutate()}
                    disabled={bulkMutation.isPending || bulkTimes.length === 0}
                  >
                    {bulkMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarDays className="mr-2 h-4 w-4" />
                    )}
                    {bulkMutation.isPending ? "Creating…" : "Create Recurring Slots"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Single slot */}
            <TabsContent value="single">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    Add Single Slot
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      min={today}
                      value={singleDate}
                      onChange={(e) => setSingleDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Start Time (IST)</Label>
                    <Input
                      type="time"
                      value={singleTime}
                      onChange={(e) => setSingleTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Capacity</Label>
                    <Input
                      type="number"
                      min={1}
                      value={singleCapacity}
                      onChange={(e) => setSingleCapacity(Number(e.target.value))}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => createMutation.mutate()}
                    disabled={createMutation.isPending || !singleDate}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    {createMutation.isPending ? "Adding…" : "Add Slot"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Slot list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm text-slate-700">
              {upcoming.length} upcoming slot{upcoming.length !== 1 ? "s" : ""}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="h-7 text-xs"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl">
              <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No upcoming slots yet.</p>
              <p className="text-xs mt-1">Use the form to create recurring or single slots.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {upcoming.map((slot) => (
                <SlotRow
                  key={slot.id}
                  slot={slot}
                  onDelete={() => deleteMutation.mutate(slot.id)}
                  deleting={deleteMutation.isPending}
                />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                {past.length} past slot{past.length !== 1 ? "s" : ""}
              </summary>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                {past.map((slot) => (
                  <SlotRow key={slot.id} slot={slot} past />
                ))}
              </div>
            </details>
          )}
        </div>
      </div>

      {/* Continue to images */}
      <div className="mt-8 flex justify-end">
        <Button onClick={() => router.push(`/agency/experiences/${id}/images`)}>
          Continue to Photos →
        </Button>
      </div>
    </div>
  );
}

function SlotRow({
  slot,
  onDelete,
  deleting,
  past,
}: {
  slot: AgencySlot;
  onDelete?: () => void;
  deleting?: boolean;
  past?: boolean;
}) {
  const spotsLeft = slot.capacity - slot.booked_count;
  const isFull = spotsLeft === 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border transition-colors",
        past ? "opacity-50 bg-muted/30" : "bg-white",
        isFull && !past && "border-amber-200 bg-amber-50/50"
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">
          {fmtDate(slot.starts_at)}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-slate-500 flex items-center gap-0.5">
            <Clock className="h-3 w-3" />
            {fmtTime(slot.starts_at)}
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span
            className={cn(
              "text-xs flex items-center gap-0.5",
              isFull ? "text-amber-600" : "text-slate-500"
            )}
          >
            <Users className="h-3 w-3" />
            {slot.booked_count}/{slot.capacity}
            {isFull && " · Full"}
          </span>
        </div>
      </div>
      {!past && onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-destructive shrink-0"
          onClick={onDelete}
          disabled={deleting || slot.booked_count > 0}
          title={slot.booked_count > 0 ? "Cannot delete — has bookings" : "Delete slot"}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
