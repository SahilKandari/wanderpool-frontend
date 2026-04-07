"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Mountain, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/providers/AuthProvider";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isHome = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/experiences", label: "Explore" },
    { href: "/experiences?city=Rishikesh", label: "Rishikesh" },
    { href: "/experiences?city=Mussoorie", label: "Mussoorie" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-500",
        scrolled || !isHome
          ? "bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 group-hover:scale-110 transition-transform">
              <Mountain className="h-4 w-4 text-white" />
            </div>
            <span className={cn(
              "font-bold text-lg tracking-tight transition-colors",
              scrolled || !isHome ? "text-foreground" : "text-white"
            )}>
              WanderPool
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  scrolled || !isHome
                    ? "text-muted-foreground hover:text-foreground hover:bg-slate-100"
                    : "text-white/90 hover:text-white hover:bg-white/10"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/experiences"
              className={cn(
                "p-2 rounded-lg transition-colors",
                scrolled || !isHome
                  ? "text-muted-foreground hover:text-foreground hover:bg-slate-100"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              )}
            >
              <Search className="h-4 w-4" />
            </Link>

            {user && user.actorKind === "customer" ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/customer/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/90 transition-colors"
                >
                  <User className="h-3.5 w-3.5" />
                  My Bookings
                </Link>
                <button
                  onClick={logout}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    scrolled || !isHome
                      ? "text-muted-foreground hover:text-foreground"
                      : "text-white/80 hover:text-white"
                  )}
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/customer/login"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-105"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={cn(
              "md:hidden p-2 rounded-lg transition-colors",
              scrolled || !isHome ? "text-foreground" : "text-white"
            )}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 pb-4 space-y-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-slate-50"
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/customer/login"
            onClick={() => setMenuOpen(false)}
            className="block mt-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-center bg-primary text-white"
          >
            Sign In
          </Link>
        </div>
      )}
    </header>
  );
}

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
                <Mountain className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white text-lg">WanderPool</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              India's premier adventure experience marketplace. Discover and book authentic outdoor adventures in the Himalayas.
            </p>
          </div>
          <div>
            <p className="font-semibold text-white text-sm mb-4">Explore</p>
            <ul className="space-y-2 text-sm">
              {["River Rafting", "Trekking", "Camping", "Paragliding", "Yoga Retreats"].map(l => (
                <li key={l}><Link href="/experiences" className="hover:text-white transition-colors">{l}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white text-sm mb-4">Company</p>
            <ul className="space-y-2 text-sm">
              {["About Us", "For Operators", "Safety", "Blog", "Contact"].map(l => (
                <li key={l}><span className="hover:text-white transition-colors cursor-pointer">{l}</span></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} WanderPool. All rights reserved.</p>
          <p className="text-slate-500">Made with ❤️ for Uttarakhand adventures</p>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}
