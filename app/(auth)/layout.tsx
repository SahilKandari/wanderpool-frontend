import Link from "next/link";
import { Mountain } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-linear-to-br from-indigo-600 via-indigo-700 to-violet-800 p-12 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-md">
              <Mountain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">WanderPool</span>
          </Link>
        </div>

        <div className="relative space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold leading-tight">
              Adventure awaits<br />in Uttarakhand 🏔️
            </h1>
            <p className="text-indigo-200 text-lg leading-relaxed">
              Connect travellers with authentic local experiences — rafting, trekking, paragliding and more.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            {[
              { value: "500+", label: "Experiences" },
              { value: "12K+", label: "Happy Travellers" },
              { value: "4.8★", label: "Avg. Rating" },
            ].map((s) => (
              <div key={s.label} className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-indigo-200 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-indigo-300">
          © 2025 WanderPool · India&apos;s adventure marketplace
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link href="/" className="flex lg:hidden items-center gap-2 mb-8 hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30">
              <Mountain className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold">WanderPool</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
