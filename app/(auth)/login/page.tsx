"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Building2, Shield, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/providers/AuthProvider";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type FormData = z.infer<typeof schema>;

type Role = "agency" | "operator" | "admin";

const roles: { id: Role; label: string; description: string; icon: React.ElementType; dashboard: string }[] = [
  {
    id: "agency",
    label: "Agency",
    description: "Manage experiences & bookings",
    icon: Building2,
    dashboard: "/agency/dashboard",
  },
  {
    id: "operator",
    label: "Guide / Operator",
    description: "View assigned bookings",
    icon: UserCheck,
    dashboard: "/operator/dashboard",
  },
  {
    id: "admin",
    label: "Admin",
    description: "WanderPool platform admin",
    icon: Shield,
    dashboard: "/admin/dashboard",
  },
];

function UnifiedLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>("agency");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const currentRole = roles.find(r => r.id === selectedRole)!;

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, role: selectedRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Login failed");
        return;
      }
      await refresh();
      const callbackUrl = searchParams.get("callbackUrl");
      router.push(callbackUrl ?? currentRole.dashboard);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Sign in to WanderPool</h2>
        <p className="text-muted-foreground text-sm mt-1">Choose your account type to continue</p>
      </div>

      {/* Role selector */}
      <div className="grid grid-cols-3 gap-2">
        {roles.map(({ id, label, description, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSelectedRole(id)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all",
              selectedRole === id
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs font-semibold">{label}</span>
            <span className="text-[10px] leading-tight hidden sm:block">{description}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              className="pl-9"
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="pl-9"
              {...register("password")}
            />
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-end">
          <a href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
            Forgot password?
          </a>
        </div>

        <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? "Signing in…" : `Sign in as ${currentRole.label}`}
        </Button>
      </form>

      {selectedRole === "agency" && (
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/agency/register" className="font-semibold text-primary hover:underline">
            Register your agency
          </a>
        </p>
      )}

      <div className="pt-4 border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Looking to book an adventure?{" "}
          <a href="/customer/login" className="text-foreground hover:text-primary underline">
            Traveller login
          </a>
        </p>
      </div>
    </div>
  );
}

export default function UnifiedLoginPage() {
  return (
    <Suspense>
      <UnifiedLoginContent />
    </Suspense>
  );
}
