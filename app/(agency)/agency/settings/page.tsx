"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, KeyRound, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/lib/providers/AuthProvider";
import { getNotifPrefs, saveNotifPrefs, notificationKeys, defaultNotifPrefs, type NotifPrefs } from "@/lib/api/notifications";

// ── Profile ────────────────────────────────────────────────────────────────
const profileSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  phone:         z.string().min(10, "Enter a valid phone number"),
  description:   z.string().min(10, "Description must be at least 10 characters"),
  city:          z.string().min(2, "City is required"),
  state:         z.string().min(2, "State is required"),
});
type ProfileForm = z.infer<typeof profileSchema>;

interface AgencyProfile {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  description: string;
  city: string;
  state: string;
  status: string;
  health_score: number;
  health_flag: string | null;
}

const PROFILE_KEY = ["agency", "profile"];

function ProfileTab({ email }: { email: string }) {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<AgencyProfile>({
    queryKey: PROFILE_KEY,
    queryFn: () => apiFetch("/agency/profile"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { state: "Uttarakhand" },
  });

  // Populate form once profile loads
  useEffect(() => {
    if (profile) {
      reset({
        business_name: profile.business_name,
        phone:         profile.phone,
        description:   profile.description,
        city:          profile.city,
        state:         profile.state,
      });
    }
  }, [profile, reset]);

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (data: ProfileForm) =>
      apiFetch("/agency/profile", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILE_KEY });
      toast.success("Profile updated successfully");
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Failed to update profile"),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Business Profile</CardTitle>
        <CardDescription>Update your agency details shown on the platform.</CardDescription>
      </CardHeader>
      <CardContent>
        {profile?.health_flag && (
          <div className={`mb-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
            profile.health_flag === "red"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}>
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {profile.health_flag === "red"
              ? "Your account has a red flag — listings are paused. Contact support to resolve."
              : "Your account has a yellow flag — listings are demoted in search. Improve your ratings to resolve."}
          </div>
        )}
        <form onSubmit={handleSubmit((d) => save(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="business_name">Business Name</Label>
            <Input id="business_name" placeholder="Rishikesh River Rafts" {...register("business_name")} />
            {errors.business_name && <p className="text-xs text-destructive">{errors.business_name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} readOnly disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" placeholder="9876543210" {...register("phone")} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={4} placeholder="Tell travellers about your business…" {...register("description")} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="Rishikesh" {...register("city")} />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="Uttarakhand" {...register("state")} />
              {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Notification Preferences ───────────────────────────────────────────────
function NotifRow({
  label, description, checked, onCheckedChange,
}: {
  label: string; description: string; checked: boolean; onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium leading-none">{label}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function NotificationsTab() {
  const queryClient = useQueryClient();

  const { data: savedPrefs, isLoading } = useQuery({
    queryKey: notificationKeys.prefs(),
    queryFn: getNotifPrefs,
  });

  const prefs: NotifPrefs = { ...defaultNotifPrefs, ...savedPrefs };

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: saveNotifPrefs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.prefs() });
      toast.success("Preferences saved");
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Failed to save preferences"),
  });

  function toggle(key: keyof NotifPrefs) {
    save({ ...prefs, [key]: !prefs[key] });
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Notification Preferences</CardTitle>
        <CardDescription>Changes are saved immediately when you toggle.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          <NotifRow
            label="New Booking (Email)"
            description="Receive an email when a new booking is made."
            checked={prefs.new_booking_email}
            onCheckedChange={() => toggle("new_booking_email")}
          />
          <NotifRow
            label="New Booking (WhatsApp)"
            description="Receive a WhatsApp message when a new booking is made."
            checked={prefs.new_booking_whatsapp}
            onCheckedChange={() => toggle("new_booking_whatsapp")}
          />
          <NotifRow
            label="Cancellation Alert"
            description="Be notified when a customer cancels their booking."
            checked={prefs.cancellation_alert}
            onCheckedChange={() => toggle("cancellation_alert")}
          />
          <NotifRow
            label="Payout Processed"
            description="Get notified when a payout is transferred to your bank account."
            checked={prefs.payout_processed}
            onCheckedChange={() => toggle("payout_processed")}
          />
          <NotifRow
            label="Review Received"
            description="Be alerted when a customer leaves a review for your experience."
            checked={prefs.review_received}
            onCheckedChange={() => toggle("review_received")}
          />
        </div>
        {saving && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving…
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Password schema ────────────────────────────────────────────────────────
const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password:     z.string().min(8, "New password must be at least 8 characters"),
    confirm_password: z.string().min(8, "Confirm your new password"),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });
type PasswordForm = z.infer<typeof passwordSchema>;

function AccountTab() {
  const { logout } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const { mutate: changePassword, isPending: savingPwd } = useMutation({
    mutationFn: (data: PasswordForm) =>
      apiFetch("/agency/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: data.current_password,
          new_password:     data.new_password,
        }),
      }),
    onSuccess: () => {
      toast.success("Password changed successfully");
      reset();
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Failed to change password"),
  });

  const { mutate: deleteAccount, isPending: deleting } = useMutation({
    mutationFn: () => apiFetch("/agency/account", { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Account deleted");
      setDeleteOpen(false);
      logout();
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Failed to delete account"),
  });

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            Change Password
          </CardTitle>
          <CardDescription>Update your login credentials.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((d) => changePassword(d))} className="space-y-4 max-w-sm">
            <div className="space-y-1.5">
              <Label htmlFor="current_password">Current Password</Label>
              <Input id="current_password" type="password" autoComplete="current-password" {...register("current_password")} />
              {errors.current_password && <p className="text-xs text-destructive">{errors.current_password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new_password">New Password</Label>
              <Input id="new_password" type="password" autoComplete="new-password" placeholder="Min 8 characters" {...register("new_password")} />
              {errors.new_password && <p className="text-xs text-destructive">{errors.new_password.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input id="confirm_password" type="password" autoComplete="new-password" {...register("confirm_password")} />
              {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password.message}</p>}
            </div>
            <Button type="submit" disabled={savingPwd}>
              {savingPwd && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your agency account. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onOpenChange={(open) => { setDeleteOpen(open); setDeleteConfirm(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              This will permanently delete your agency account, all experiences, and all associated data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-2">
            <Label htmlFor="delete_confirm">
              Type <span className="font-mono font-bold">DELETE</span> to confirm
            </Label>
            <Input
              id="delete_confirm"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={deleteConfirm !== "DELETE" || deleting}
              onClick={() => deleteAccount()}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function AgencySettingsPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your agency profile, notifications, and account."
      />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab email={user?.email ?? ""} />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationsTab />
        </TabsContent>

        <TabsContent value="account">
          <AccountTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
