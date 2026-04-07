"use client";

import { LogOut, Menu, User, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/providers/AuthProvider";
import { cn } from "@/lib/utils";

interface TopbarProps {
  onMenuClick?: () => void;
  variant?: "default" | "admin";
}

const roleLabel: Record<string, { label: string; color: string }> = {
  agency:         { label: "Agency",        color: "bg-indigo-100 text-indigo-700" },
  solo_operator:  { label: "Solo Operator", color: "bg-violet-100 text-violet-700" },
  operator:       { label: "Guide",         color: "bg-teal-100 text-teal-700" },
  super_admin:    { label: "Super Admin",   color: "bg-red-100 text-red-700" },
  support_agent:  { label: "Support",       color: "bg-amber-100 text-amber-700" },
  admin:          { label: "Admin",         color: "bg-slate-100 text-slate-700" },
};

export function Topbar({ onMenuClick, variant = "default" }: TopbarProps) {
  const { user, logout } = useAuth();
  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "WP";
  const role = roleLabel[user?.accountType ?? ""] ?? { label: "User", color: "bg-slate-100 text-slate-700" };

  const isAdmin = variant === "admin";

  return (
    <header className={cn(
      "sticky top-0 z-40 flex h-16 items-center gap-4 border-b px-4 lg:px-6",
      isAdmin ? "bg-slate-900 border-slate-700/60" : "bg-white border-border shadow-sm"
    )}>
      <Button
        variant="ghost"
        size="icon"
        className={cn("lg:hidden", isAdmin && "text-slate-400 hover:text-white hover:bg-slate-800")}
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1" />

      {/* Notification bell */}
      <Button
        variant="ghost"
        size="icon"
        className={cn("relative", isAdmin ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-muted-foreground")}
      >
        <Bell className="h-4 w-4" />
      </Button>

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className={cn("flex items-center gap-2.5 px-2 h-10 rounded-lg", isAdmin ? "hover:bg-slate-800" : "hover:bg-slate-50")}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className={cn("text-xs font-bold", isAdmin ? "bg-indigo-600 text-white" : "bg-primary/10 text-primary")}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:flex flex-col items-start">
              <p className={cn("text-xs font-semibold leading-none", isAdmin ? "text-white" : "text-foreground")}>
                {user?.email?.split("@")[0]}
              </p>
              <span className={cn("text-[10px] mt-0.5 font-medium px-1.5 py-0.5 rounded-full", role.color)}>
                {role.label}
              </span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium truncate">{user?.email}</p>
              <span className={cn("text-[11px] w-fit font-medium px-1.5 py-0.5 rounded-full", role.color)}>
                {role.label}
              </span>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" /> Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
