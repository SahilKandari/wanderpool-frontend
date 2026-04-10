import { apiFetch } from "./client";

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export interface NotifPrefs {
  new_booking_email: boolean;
  new_booking_whatsapp: boolean;
  cancellation_alert: boolean;
  payout_processed: boolean;
  review_received: boolean;
  guide_assigned: boolean;
}

export const defaultNotifPrefs: NotifPrefs = {
  new_booking_email: true,
  new_booking_whatsapp: true,
  cancellation_alert: true,
  payout_processed: true,
  review_received: true,
  guide_assigned: true,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  list: () => [...notificationKeys.all, "list"] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
  prefs: () => [...notificationKeys.all, "prefs"] as const,
};

export function listNotifications(): Promise<Notification[]> {
  return apiFetch("/notifications");
}

export function getUnreadCount(): Promise<{ count: number }> {
  return apiFetch("/notifications/unread-count");
}

export function markRead(id: string): Promise<void> {
  return apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllRead(): Promise<void> {
  return apiFetch("/notifications/read-all", { method: "POST" });
}

// Universal prefs endpoint — works for any authenticated actor (agency, operator, admin)
export function getNotifPrefs(): Promise<Partial<NotifPrefs>> {
  return apiFetch("/notification-prefs");
}

export function saveNotifPrefs(prefs: Partial<NotifPrefs>): Promise<void> {
  return apiFetch("/notification-prefs", {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
}
