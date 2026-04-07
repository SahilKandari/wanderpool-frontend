"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/lib/providers/AuthProvider";
import {
  listFavourites,
  addFavourite,
  removeFavourite,
  favouriteKeys,
} from "@/lib/api/favourites";

/**
 * Returns { isFavourited, toggle, isLoading } for a single experience.
 *
 * - If the customer is not logged in, `toggle` redirects to login with
 *   `next` pointing back to the current page, then returns.
 * - Uses optimistic updates so the heart flips instantly.
 * - The favourites list is cached under favouriteKeys.list() so it is
 *   shared across all ExperienceCard instances and the detail page.
 */
export function useFavourite(experienceId: string) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const isCustomer = !!user && user.actorKind === "customer";

  const { data: favouriteIds = [], isLoading } = useQuery({
    queryKey: favouriteKeys.list(),
    queryFn: listFavourites,
    enabled: isCustomer,
    staleTime: 30_000,
  });

  const isFavourited = favouriteIds.includes(experienceId);

  const addMutation = useMutation({
    mutationFn: () => addFavourite(experienceId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: favouriteKeys.list() });
      const previous = queryClient.getQueryData<string[]>(favouriteKeys.list()) ?? [];
      queryClient.setQueryData<string[]>(favouriteKeys.list(), (old = []) =>
        old.includes(experienceId) ? old : [...old, experienceId]
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(favouriteKeys.list(), ctx?.previous);
      toast.error("Failed to save favourite");
    },
    onSuccess: () => toast.success("Added to favourites"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: favouriteKeys.list() }),
  });

  const removeMutation = useMutation({
    mutationFn: () => removeFavourite(experienceId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: favouriteKeys.list() });
      const previous = queryClient.getQueryData<string[]>(favouriteKeys.list()) ?? [];
      queryClient.setQueryData<string[]>(favouriteKeys.list(), (old = []) =>
        old.filter((id) => id !== experienceId)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(favouriteKeys.list(), ctx?.previous);
      toast.error("Failed to remove favourite");
    },
    onSuccess: () => toast.success("Removed from favourites"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: favouriteKeys.list() }),
  });

  function toggle(currentPath: string) {
    if (!isCustomer) {
      router.push(`/customer/login?next=${encodeURIComponent(currentPath)}`);
      return;
    }
    if (isFavourited) {
      removeMutation.mutate();
    } else {
      addMutation.mutate();
    }
  }

  return {
    isFavourited,
    toggle,
    isLoading:
      isLoading ||
      addMutation.isPending ||
      removeMutation.isPending,
  };
}
