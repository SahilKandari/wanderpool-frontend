import { publicFetch } from "./client";

export type PasswordResetRole = "agency" | "operator" | "customer" | "admin";

export async function requestOTP(email: string, role: PasswordResetRole): Promise<{ message: string }> {
  return publicFetch("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email, role, channel: "email" }),
  });
}

export async function verifyOTP(
  email: string,
  role: PasswordResetRole,
  otp: string
): Promise<{ reset_token: string; email: string; role: string }> {
  return publicFetch("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, role, otp }),
  });
}

export async function resetPassword(
  email: string,
  role: PasswordResetRole,
  resetToken: string,
  newPassword: string
): Promise<{ message: string }> {
  return publicFetch("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, role, reset_token: resetToken, new_password: newPassword }),
  });
}
