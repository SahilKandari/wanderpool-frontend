"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Percent, IndianRupee, Bell, Shield, Globe, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiFetch } from "@/lib/api/client";
import { useQuery as useNotifQuery, useMutation as useNotifMutation, useQueryClient as useNotifQueryClient } from "@tanstack/react-query";
import { getNotifPrefs, saveNotifPrefs, notificationKeys } from "@/lib/api/notifications";

// ── Platform settings keys ──────────────────────────────────────────────────
const SETTINGS_QUERY_KEY = ["admin", "platform-settings"];

async function fetchPlatformSettings(): Promise<Record<string, string>> {
  return apiFetch("/admin/settings");
}

async function savePlatformSettings(data: Record<string, string>): Promise<void> {
  return apiFetch("/admin/settings", { method: "PUT", body: JSON.stringify(data) });
}

// ── Admin Alerts config ──────────────────────────────────────────────────────
const ADMIN_ALERT_ROWS = [
  { key: "new_agency_registration", label: "New agency registration", desc: "Get notified when a new agency signs up" },
  { key: "low_rating_review",       label: "Low-rating review",       desc: "1–2 star review submitted on any experience" },
  { key: "disputed_booking",        label: "Disputed booking",        desc: "Customer opens a dispute on a booking" },
  { key: "payout_failure",          label: "Payout failure",          desc: "A payout transaction fails" },
] as const;

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();

  // ── Load all platform settings ─────────────────────────────────────────────
  const { data: settings = {}, isLoading } = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchPlatformSettings,
  });

  // Local form state — initialised from loaded settings
  const [commissionPct, setCommissionPct] = useState("13");
  const [featuredFee, setFeaturedFee] = useState("1499");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [newRegistrations, setNewRegistrations] = useState(true);
  const [yellowRating, setYellowRating] = useState("3.8");
  const [redRating, setRedRating] = useState("3.0");
  const [yellowComplaints, setYellowComplaints] = useState("3");

  // Sync form fields when settings load
  useEffect(() => {
    if (!settings || Object.keys(settings).length === 0) return;
    if (settings.commission_rate_bps)
      setCommissionPct(String(Number(settings.commission_rate_bps) / 100));
    if (settings.featured_fee_paise)
      setFeaturedFee(String(Math.round(Number(settings.featured_fee_paise) / 100)));
    if (settings.maintenance_mode !== undefined)
      setMaintenanceMode(settings.maintenance_mode === "true");
    if (settings.allow_new_registrations !== undefined)
      setNewRegistrations(settings.allow_new_registrations === "true");
    if (settings.yellow_flag_min_rating)
      setYellowRating(settings.yellow_flag_min_rating);
    if (settings.red_flag_min_rating)
      setRedRating(settings.red_flag_min_rating);
    if (settings.yellow_flag_max_complaints_30d)
      setYellowComplaints(settings.yellow_flag_max_complaints_30d);
  }, [settings]);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: savePlatformSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY });
      toast.success("Settings saved");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  function handleSave() {
    save({
      commission_rate_bps:          String(Math.round(Number(commissionPct) * 100)),
      featured_fee_paise:           String(Number(featuredFee) * 100),
      maintenance_mode:             String(maintenanceMode),
      allow_new_registrations:      String(newRegistrations),
      yellow_flag_min_rating:       yellowRating,
      red_flag_min_rating:          redRating,
      yellow_flag_max_complaints_30d: yellowComplaints,
    });
  }

  // ── Alert prefs ────────────────────────────────────────────────────────────
  const notifQueryClient = useNotifQueryClient();
  const { data: alertPrefs = {} } = useNotifQuery({
    queryKey: notificationKeys.prefs(),
    queryFn: getNotifPrefs,
  });
  const { mutate: saveAlertPrefs } = useNotifMutation({
    mutationFn: saveNotifPrefs,
    onSuccess: () => {
      notifQueryClient.invalidateQueries({ queryKey: notificationKeys.prefs() });
      toast.success("Alert preferences saved");
    },
    onError: () => toast.error("Failed to save alert preferences"),
  });

  function toggleAlert(key: string) {
    const current = alertPrefs[key as keyof typeof alertPrefs] ?? true;
    saveAlertPrefs({ ...alertPrefs, [key]: !current });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Platform Settings"
        description="Configure WanderPool platform-wide settings"
      />

      <div className="space-y-5">
        {/* ── Revenue & Fees ───────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              Revenue & Fees
            </CardTitle>
            <CardDescription>Commission rate applies to all new bookings immediately.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Commission Rate (%)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    step={0.5}
                    value={commissionPct}
                    onChange={e => setCommissionPct(e.target.value)}
                    className="pr-8"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Operators receive {Math.max(0, 100 - Number(commissionPct)).toFixed(1)}% of each booking.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Featured Listing Fee (₹/month)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                  <Input
                    type="number"
                    min={0}
                    value={featuredFee}
                    onChange={e => setFeaturedFee(e.target.value)}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Monthly fee for featured placement.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Platform Controls ────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              Platform Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">New Agency Registrations</p>
                <p className="text-xs text-muted-foreground">Allow new agencies to sign up on the platform</p>
              </div>
              <Switch checked={newRegistrations} onCheckedChange={setNewRegistrations} />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <p className="text-sm font-medium flex items-center gap-2">
                  Maintenance Mode
                  {maintenanceMode && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Active</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Show maintenance page to all non-admin users</p>
              </div>
              <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
            </div>
          </CardContent>
        </Card>

        {/* ── Quality Thresholds ───────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Quality Thresholds
            </CardTitle>
            <CardDescription>
              Yellow flag demotes experiences in search. Red flag pauses all agency experiences immediately.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Yellow Flag — Min Rating</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  value={yellowRating}
                  onChange={e => setYellowRating(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Below this avg → demote in search</p>
              </div>
              <div className="space-y-1.5">
                <Label>Red Flag — Min Rating</Label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  value={redRating}
                  onChange={e => setRedRating(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Below this avg → pause all experiences</p>
              </div>
              <div className="space-y-1.5">
                <Label>Yellow Flag — Max Complaints / 30d</Label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={yellowComplaints}
                  onChange={e => setYellowComplaints(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Complaints trigger yellow flag too</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/40 rounded-lg text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Yellow flag triggers</p>
                <p className="font-semibold">Below {yellowRating}★ or {yellowComplaints} complaints/30d</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Red flag triggers</p>
                <p className="font-semibold">Below {redRating}★ or safety complaint</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Admin Alerts ─────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Admin Alerts
            </CardTitle>
            <CardDescription>In-app notifications you receive as admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ADMIN_ALERT_ROWS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={alertPrefs[key as keyof typeof alertPrefs] ?? true}
                  onCheckedChange={() => toggleAlert(key)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
