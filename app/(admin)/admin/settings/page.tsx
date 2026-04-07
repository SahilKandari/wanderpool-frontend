"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Percent, IndianRupee, Bell, Shield, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiFetch } from "@/lib/api/client";

export default function AdminSettingsPage() {
  const [commissionRate, setCommissionRate] = useState("15");
  const [featuredFee, setFeaturedFee] = useState("1499");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [newRegistrations, setNewRegistrations] = useState(true);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({
          commission_rate_percent: Number(commissionRate),
          featured_fee_paise: Number(featuredFee) * 100,
          maintenance_mode: maintenanceMode,
          allow_new_registrations: newRegistrations,
        }),
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Platform Settings"
        description="Configure WanderPool platform-wide settings"
      />

      <div className="space-y-5">
        {/* Revenue settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-primary" />
              Revenue & Fees
            </CardTitle>
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
                    value={commissionRate}
                    onChange={e => setCommissionRate(e.target.value)}
                    className="pr-8"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <p className="text-xs text-muted-foreground">
                  WanderPool&apos;s cut of each booking. Operators receive {100 - Number(commissionRate)}%.
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
                <p className="text-xs text-muted-foreground">
                  Monthly fee for featured placement in search results.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform toggles */}
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
              <Switch
                checked={newRegistrations}
                onCheckedChange={setNewRegistrations}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5">
                <p className="text-sm font-medium flex items-center gap-2">
                  Maintenance Mode
                  {maintenanceMode && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      Active
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Show maintenance page to all non-admin users</p>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Review thresholds */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Quality Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted/40 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Yellow flag (demoted)</p>
                <p className="font-semibold">Below 3.8★ or 3 complaints/30d</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Red flag (paused)</p>
                <p className="font-semibold">Below 3.0★ or safety complaint</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              These thresholds are enforced automatically. Contact engineering to adjust them.
            </p>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Admin Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "New agency registration", desc: "Get notified when a new agency signs up" },
              { label: "Low-rating review", desc: "1–2 star review submitted on any experience" },
              { label: "Disputed booking", desc: "Customer opens a dispute on a booking" },
              { label: "Payout failure", desc: "A payout transaction fails" },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch checked />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
