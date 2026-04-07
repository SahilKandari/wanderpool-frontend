import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Admin Login — WanderPool" };

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm
        role="admin"
        title="Admin Panel"
        subtitle="WanderPool internal administration"
        dashboardPath="/admin/dashboard"
      />
    </Suspense>
  );
}
