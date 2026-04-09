"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  CalendarDays,
  BookOpen,
  Users,
  CreditCard,
  Settings,
  BookMarked,
  Clock,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/providers/AuthProvider";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: ("agency" | "operator")[];
}

const navItems: NavItem[] = [
  { label: "Dashboard",        href: "/agency/dashboard",    icon: LayoutDashboard, roles: ["agency"] },
  { label: "Experiences",      href: "/agency/experiences",  icon: Map,             roles: ["agency"] },
  { label: "Bookings",         href: "/agency/bookings",     icon: BookOpen,        roles: ["agency"] },
  { label: "Schedule",         href: "/agency/schedule",     icon: CalendarDays,    roles: ["agency"] },
  { label: "Guides",           href: "/agency/guides",       icon: Users,           roles: ["agency"] },
  { label: "Earnings",         href: "/agency/payouts",      icon: CreditCard,      roles: ["agency"] },
  { label: "Settings",         href: "/agency/settings",     icon: Settings,        roles: ["agency"] },
  { label: "Dashboard",        href: "/operator/dashboard",  icon: LayoutDashboard, roles: ["operator"] },
  { label: "My Bookings",      href: "/operator/bookings",   icon: BookMarked,      roles: ["operator"] },
  { label: "Schedule",         href: "/operator/schedule",   icon: Clock,           roles: ["operator"] },
];

export function AgencySidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const role = user?.actorKind === "operator" ? "operator" : "agency";
  const visible = navItems.filter((i) => i.roles.includes(role as "agency" | "operator"));

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 border-r border-border bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white fill-current">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
        <div>
          <p className="font-bold text-sm leading-none text-foreground">WanderPool</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {role === "operator" ? "Guide Portal" : "Agency Portal"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Menu
        </p>
        {visible.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-slate-50 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-primary" : "text-slate-400 group-hover:text-foreground")} />
              {item.label}
              {active && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[11px] text-muted-foreground text-center">
          Uttarakhand Adventures 🏔️
        </p>
      </div>
    </aside>
  );
}
