import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Agency Login — WanderPool" };

export default function AgencyLoginPage() {
  return (
    <Suspense>
      <LoginForm
        role="agency"
        title="Agency Login"
        subtitle="Sign in to manage your experiences and bookings"
        registerHref="/agency/register"
        dashboardPath="/agency/dashboard"
      />
    </Suspense>
  );
}
