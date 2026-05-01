import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "full-light" | "full-dark" | "icon";
  className?: string;
}

/**
 * WanderPool brand logo — Concept 01 "Mountain Reflection"
 *
 * full-light — dark wordmark, for white/light backgrounds (navbar, agency sidebar)
 * full-dark  — white wordmark, for dark/teal backgrounds (admin sidebar, footer)
 * icon       — mountain mark only in teal circle (favicon, tight spaces)
 */
export function Logo({ variant = "full-light", className }: LogoProps) {
  if (variant === "icon") {
    return (
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("shrink-0", className)}
        aria-label="WanderPool"
      >
        <circle cx="50" cy="50" r="50" fill="#085041" />
        {/* Mountains */}
        <polygon points="22,66 38,34 54,66" fill="#1D9E75" />
        <polygon points="34,66 50,22 66,66" fill="#0F6E56" />
        <polygon points="46,66 60,44 74,66" fill="#5DCAA5" />
        {/* Snow caps */}
        <polygon points="38,34 33,46 43,46" fill="#E1F5EE" opacity="0.9" />
        <polygon points="50,22 44,38 56,38" fill="white" opacity="0.95" />
        <polygon points="60,44 56,52 64,52" fill="#E1F5EE" opacity="0.85" />
        {/* Amber peak dot */}
        <circle cx="50" cy="22" r="4" fill="#EF9F27" />
        {/* Water line */}
        <line x1="14" y1="68" x2="86" y2="68" stroke="#5DCAA5" strokeWidth="1.5" opacity="0.7" />
        {/* Ripples */}
        <ellipse cx="50" cy="68" rx="10" ry="3.5" stroke="#5DCAA5" strokeWidth="1.2" fill="none" opacity="0.5" />
        <ellipse cx="50" cy="68" rx="20" ry="6" stroke="#5DCAA5" strokeWidth="0.8" fill="none" opacity="0.3" />
      </svg>
    );
  }

  const isDark = variant === "full-dark";
  const wanderColor = isDark ? "white" : "#0e0e0e";
  const poolColor   = isDark ? "#5DCAA5" : "#1D9E75";

  return (
    <svg
      width="160"
      height="50"
      viewBox="0 0 310 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="WanderPool"
    >
      {/* Mountain group */}
      <polygon points="34,60 54,22 74,60" fill="#1D9E75" />
      <polygon points="50,60 74,12 98,60" fill="#0F6E56" />
      <polygon points="72,60 90,36 108,60" fill="#5DCAA5" />
      {/* Snow caps */}
      <polygon points="54,22 48,36 60,36" fill="#E1F5EE" opacity="0.9" />
      <polygon points="74,12 66,30 82,30" fill="white" opacity="0.95" />
      <polygon points="90,36 85,46 95,46" fill="#E1F5EE" opacity="0.85" />
      {/* Amber peak dot */}
      <circle cx="74" cy="12" r="3.5" fill="#EF9F27" />
      {/* Water line */}
      <line x1="20" y1="62" x2="118" y2="62" stroke="#1D9E75" strokeWidth="1.2" opacity="0.5" />
      {/* Reflections */}
      <polygon points="34,64 54,88 74,64" fill="#1D9E75" opacity="0.12" />
      <polygon points="50,64 74,96 98,64" fill="#0F6E56" opacity="0.10" />
      {/* Ripples */}
      <ellipse cx="71" cy="62" rx="10" ry="3.5" stroke="#1D9E75" strokeWidth="0.9" fill="none" opacity="0.4" />
      <ellipse cx="71" cy="62" rx="20" ry="6" stroke="#1D9E75" strokeWidth="0.65" fill="none" opacity="0.25" />
      {/* Wordmark — Playfair Display via CSS variable */}
      <text
        x="128"
        y="44"
        fontFamily="var(--font-playfair), 'Playfair Display', Georgia, serif"
        fontSize="30"
        fontWeight="700"
        fill={wanderColor}
        letterSpacing="-0.5"
      >
        Wander
      </text>
      <text
        x="128"
        y="74"
        fontFamily="var(--font-playfair), 'Playfair Display', Georgia, serif"
        fontSize="30"
        fontWeight="400"
        fontStyle="italic"
        fill={poolColor}
        letterSpacing="-0.5"
      >
        Pool
      </text>
    </svg>
  );
}
