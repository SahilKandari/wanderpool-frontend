"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Building2, Map, BookOpen, CalendarDays, FolderTree, Shield, CreditCard, Settings, Mountain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/providers/AuthProvider";

const navItems = [
  { label: "Overview",     href: "/admin/dashboard",    icon: LayoutDashboard },
  { label: "Agencies",     href: "/admin/agencies",      icon: Building2 },
  { label: "Experiences",  href: "/admin/experiences",   icon: Map },
  { label: "Bookings",     href: "/admin/bookings",      icon: BookOpen },
  { label: "Schedule",     href: "/admin/schedule",      icon: CalendarDays },
  { label: "Categories",   href: "/admin/categories",    icon: FolderTree },
  { label: "Payouts",      href: "/admin/payouts",       icon: CreditCard },
  { label: "Settings",     href: "/admin/settings",      icon: Settings },
  { label: "Admins",       href: "/admin/admins",        icon: Shield, superOnly: true },
];

export function AdminSidebar({ mobile = false, onNavClick }: { mobile?: boolean; onNavClick?: () => void }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const isSuperAdmin = user?.accountType === "super_admin";

  return (
    <aside className={mobile ? "flex flex-col w-60 bg-slate-900 text-white" : "hidden lg:flex lg:flex-col w-60 bg-slate-900 text-white"}>
      {/* Logo */}
      <Link href="/" className="flex h-16 items-center gap-3 px-5 border-b border-slate-700/60 hover:bg-slate-800 transition-colors">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30">
          <Mountain className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm text-white leading-none">WanderPool</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Admin Panel</p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
          Platform
        </p>
        {navItems.map((item) => {
          if (item.superOnly && !isSuperAdmin) return null;
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-700/60 px-4 py-3">
        <p className="text-[11px] text-slate-500 text-center">Internal Admin Tool</p>
      </div>
    </aside>
  );
}
