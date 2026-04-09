"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Flag,
  Send,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { reviewKeys, getAgencyReviews, replyToReview } from "@/lib/api/reviews";
import type { Review } from "@/lib/types/review";
import { cn } from "@/lib/utils";

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            cls,
            n <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"
          )}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const qc = useQueryClient();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState(review.operator_reply ?? "");

  const mutation = useMutation({
    mutationFn: () => replyToReview(review.id, replyText.trim()),
    onSuccess: () => {
      toast.success("Reply saved");
      setReplyOpen(false);
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-5 space-y-3",
        review.is_flagged && "border-red-200 bg-red-50/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">
              {review.customer_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {review.customer_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {review.experience_title && (
                <> · <span className="text-primary">{review.experience_title}</span></>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {review.is_flagged && (
            <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
              <Flag className="h-3 w-3" /> Flagged
            </span>
          )}
          <StarRow rating={review.rating} size="md" />
        </div>
      </div>

      {/* Body */}
      {review.body && (
        <p className="text-sm text-muted-foreground leading-relaxed">{review.body}</p>
      )}
      {!review.body && (
        <p className="text-sm text-muted-foreground/50 italic">No written review.</p>
      )}

      {/* Existing reply */}
      {review.operator_reply && !replyOpen && (
        <div className="pl-3 border-l-2 border-primary/30 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ThumbsUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">Your reply</span>
            </div>
            <button
              onClick={() => { setReplyText(review.operator_reply ?? ""); setReplyOpen(true); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Edit
            </button>
          </div>
          <p className="text-sm text-muted-foreground">{review.operator_reply}</p>
        </div>
      )}

      {/* Reply form */}
      {replyOpen ? (
        <div className="space-y-2">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value.slice(0, 300))}
            placeholder="Write a professional, helpful reply visible to everyone…"
            rows={3}
            className="text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "text-xs",
                replyText.length > 270 ? "text-amber-500" : "text-muted-foreground"
              )}
            >
              {replyText.length}/300
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => { setReplyOpen(false); setReplyText(review.operator_reply ?? ""); }}
              >
                <X className="h-3.5 w-3.5 mr-1" /> Cancel
              </Button>
              <Button
                size="sm"
                disabled={!replyText.trim() || mutation.isPending}
                onClick={() => mutation.mutate()}
              >
                {mutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1" />
                )}
                {mutation.isPending ? "Saving…" : "Save Reply"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        !review.operator_reply && (
          <Button
            size="sm"
            variant="outline"
            className="w-full text-primary border-primary/30 hover:bg-primary/5"
            onClick={() => setReplyOpen(true)}
          >
            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
            Reply to this review
          </Button>
        )
      )}
    </div>
  );
}

export default function AgencyReviewsPage() {
  const [ratingFilter, setRatingFilter] = useState("all");

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: reviewKeys.forAgency({ rating: ratingFilter }),
    queryFn: () =>
      getAgencyReviews({ rating: ratingFilter === "all" ? undefined : ratingFilter }),
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;
  const flaggedCount = reviews.filter((r) => r.is_flagged).length;
  const unrepliedCount = reviews.filter((r) => !r.operator_reply).length;

  return (
    <div>
      <PageHeader
        title="Reviews"
        description="See what guests are saying and respond to build trust"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Average Rating",
            value: avgRating > 0 ? avgRating.toFixed(1) : "—",
            sub: `from ${reviews.length} review${reviews.length !== 1 ? "s" : ""}`,
            color: "text-amber-500",
          },
          {
            label: "Awaiting Reply",
            value: unrepliedCount,
            sub: "reviews without a response",
            color: "text-primary",
          },
          {
            label: "Flagged",
            value: flaggedCount,
            sub: "need your attention",
            color: flaggedCount > 0 ? "text-red-600" : "text-foreground",
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="bg-card rounded-xl border p-5">
            <p className="text-sm text-muted-foreground mb-1">{label}</p>
            <p className={cn("text-2xl font-bold", color)}>{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3 mb-5">
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All ratings" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All ratings</SelectItem>
            <SelectItem value="5">5 stars</SelectItem>
            <SelectItem value="4">4 stars</SelectItem>
            <SelectItem value="3">3 stars</SelectItem>
            <SelectItem value="2">2 stars</SelectItem>
            <SelectItem value="1">1 star</SelectItem>
          </SelectContent>
        </Select>
        {ratingFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setRatingFilter("all")}
          >
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
        <span className="text-sm text-muted-foreground ml-auto">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          title="No reviews yet"
          description="Reviews from guests who have completed bookings will appear here."
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
