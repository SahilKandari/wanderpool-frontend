"use client";

import {
  createContext,
  useContext,
  useCallback,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthProvider";
import {
  listNotifications,
  markRead,
  markAllRead,
  notificationKeys,
  type Notification,
} from "@/lib/api/notifications";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markOneRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  markOneRead: () => {},
  markAllAsRead: () => {},
});

const ACTOR_KINDS_WITH_NOTIFICATIONS = ["agency", "operator", "admin"];

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const enabled = !!user && ACTOR_KINDS_WITH_NOTIFICATIONS.includes(user.actorKind);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: notificationKeys.list(),
    queryFn: listNotifications,
    enabled,
    refetchInterval: 15_000, // poll every 15s
    staleTime: 10_000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const { mutate: markOneRead } = useMutation({
    mutationFn: markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });

  const { mutate: markAllAsRead } = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });

  const handleMarkOneRead = useCallback(
    (id: string) => markOneRead(id),
    [markOneRead]
  );

  const handleMarkAllAsRead = useCallback(
    () => markAllAsRead(),
    [markAllAsRead]
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markOneRead: handleMarkOneRead,
        markAllAsRead: handleMarkAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
