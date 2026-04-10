"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Menu, User, Bell, CheckCheck, BookOpen, XCircle, UserCheck } from "lucide-react";
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
import { useAuth } from "@/lib/providers/AuthProvider";
import { useNotifications } from "@/lib/providers/NotificationProvider";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/api/notifications";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

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

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  "booking.created":   <BookOpen className="h-3.5 w-3.5 text-emerald-600" />,
  "booking.cancelled": <XCircle className="h-3.5 w-3.5 text-red-500" />,
  "guide.assigned":    <UserCheck className="h-3.5 w-3.5 text-blue-600" />,
};

function NotificationItem({
  notif,
  onRead,
  isAdmin,
}: {
  notif: Notification;
  onRead: (id: string, link: string) => void;
  isAdmin: boolean;
}) {
  const icon = NOTIF_ICONS[notif.type] ?? <Bell className="h-3.5 w-3.5 text-slate-400" />;
  const ago = timeAgo(notif.created_at);

  return (
    <button
      onClick={() => onRead(notif.id, notif.link)}
      className={cn(
        "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors",
        !notif.is_read && (isAdmin ? "bg-slate-800 hover:bg-slate-700" : "bg-blue-50/60 hover:bg-blue-50")
      )}
    >
      <div className={cn(
        "mt-0.5 shrink-0 h-7 w-7 rounded-full flex items-center justify-center",
        isAdmin ? "bg-slate-700" : "bg-white border border-slate-200"
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-xs font-semibold leading-snug",
          !notif.is_read
            ? isAdmin ? "text-white" : "text-slate-900"
            : isAdmin ? "text-slate-400" : "text-slate-600"
        )}>
          {notif.title}
        </p>
        {notif.body && (
          <p className={cn("text-[11px] mt-0.5 leading-snug truncate", isAdmin ? "text-slate-500" : "text-slate-500")}>
            {notif.body}
          </p>
        )}
        <p className={cn("text-[10px] mt-1", isAdmin ? "text-slate-600" : "text-slate-400")}>
          {ago}
        </p>
      </div>
      {!notif.is_read && (
        <div className="mt-1.5 shrink-0 h-2 w-2 rounded-full bg-blue-500" />
      )}
    </button>
  );
}

export function Topbar({ onMenuClick, variant = "default" }: TopbarProps) {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markOneRead, markAllAsRead } = useNotifications();
  const router = useRouter();
  const [notifOpen, setNotifOpen] = useState(false);

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "WP";
  const role = roleLabel[user?.accountType ?? ""] ?? { label: "User", color: "bg-slate-100 text-slate-700" };
  const isAdmin = variant === "admin";

  function handleNotifClick(id: string, link: string) {
    markOneRead(id);
    setNotifOpen(false);
    if (link) router.push(link);
  }

  const recentNotifs = notifications.slice(0, 10);

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
      <DropdownMenu open={notifOpen} onOpenChange={setNotifOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "relative",
              isAdmin ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-muted-foreground"
            )}
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className={cn(
            "w-80 p-0 overflow-hidden",
            isAdmin && "bg-slate-900 border-slate-700"
          )}
        >
          {/* Header */}
          <div className={cn(
            "flex items-center justify-between px-4 py-3 border-b",
            isAdmin ? "border-slate-700" : "border-slate-100"
          )}>
            <p className={cn("text-sm font-semibold", isAdmin ? "text-white" : "text-slate-900")}>
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-medium text-blue-500">{unreadCount} new</span>
              )}
            </p>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className={cn(
                  "flex items-center gap-1 text-[11px] font-medium hover:underline",
                  isAdmin ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {recentNotifs.length === 0 ? (
              <div className={cn(
                "flex flex-col items-center justify-center py-8 gap-2",
                isAdmin ? "text-slate-500" : "text-slate-400"
              )}>
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              recentNotifs.map((n) => (
                <NotificationItem
                  key={n.id}
                  notif={n}
                  onRead={handleNotifClick}
                  isAdmin={isAdmin}
                />
              ))
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

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
