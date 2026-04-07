import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Guide Login — WanderPool" };

export default function OperatorLoginPage() {
  return (
    <Suspense>
      <LoginForm
        role="operator"
        title="Guide Login"
        subtitle="Sign in to view your assigned bookings and schedule"
        dashboardPath="/operator/dashboard"
      />
    </Suspense>
  );
}
