"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Star,
  Eye,
  EyeOff,
  Flag,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  reviewKeys,
  adminGetReviews,
  adminCreateReview,
  adminToggleReviewVisibility,
  type AdminCreateReviewPayload,
} from "@/lib/api/reviews";
import { experienceKeys, listPublicExperiences } from "@/lib/api/experiences";
import type { Review } from "@/lib/types/review";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-3.5 w-3.5",
            n <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-200 text-slate-200"
          )}
        />
      ))}
    </div>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Poor", "Below average", "Average", "Good", "Excellent"];
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "h-7 w-7 transition-colors",
                n <= (hovered || value)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200"
              )}
            />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <span className="text-sm font-medium text-slate-600">
          {labels[hovered || value]}
        </span>
      )}
    </div>
  );
}

// ── Review Card ───────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: () =>
      adminToggleReviewVisibility(review.id, !review.is_visible),
    onSuccess: (data) => {
      toast.success(data.is_visible ? "Review shown" : "Review hidden");
      qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const bodyText = review.body ?? "";
  const isLong = bodyText.length > 200;
  const displayBody = isLong && !expanded ? bodyText.slice(0, 200) + "…" : bodyText;

  return (
    <div
      className={cn(
        "bg-card rounded-xl border p-5 space-y-3",
        review.is_flagged && "border-red-200 bg-red-50/30",
        !review.is_visible && "opacity-60"
      )}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-primary">
              {review.customer_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground leading-none">
                {review.customer_name}
              </p>
              {review.is_admin_seeded && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                  <Sparkles className="h-2.5 w-2.5" />
                  Seeded
                </span>
              )}
              {review.is_flagged && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700">
                  <Flag className="h-2.5 w-2.5" />
                  Flagged
                </span>
              )}
              {!review.is_visible && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                  Hidden
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <StarRow rating={review.rating} />
              <span className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {review.experience_title && (
            <span className="hidden sm:block text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-md max-w-[180px] truncate">
              {review.experience_title}
            </span>
          )}
          <button
            type="button"
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            title={review.is_visible ? "Hide review" : "Show review"}
            className="h-8 w-8 rounded-lg flex items-center justify-center border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {toggleMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : review.is_visible ? (
              <Eye className="h-4 w-4 text-slate-500" />
            ) : (
              <EyeOff className="h-4 w-4 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Experience title on mobile */}
      {review.experience_title && (
        <p className="sm:hidden text-xs text-muted-foreground bg-slate-100 px-2 py-1 rounded-md truncate">
          {review.experience_title}
        </p>
      )}

      {/* Review body */}
      {bodyText && (
        <div>
          <p className="text-sm text-slate-700 leading-relaxed">{displayBody}</p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-primary hover:underline mt-1"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
      )}

      {/* Host reply */}
      {review.operator_reply && (
        <div className="flex gap-2.5 bg-primary/5 border border-primary/10 rounded-lg p-3">
          <MessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-primary uppercase tracking-wide mb-1">
              Host Reply
            </p>
            <p className="text-sm text-slate-700 italic leading-relaxed">
              {review.operator_reply}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Review Dialog ─────────────────────────────────────────────────────────

function AddReviewDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const [experienceId, setExperienceId] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [rating, setRating] = useState(0);
  const [date, setDate] = useState(today);
  const [body, setBody] = useState("");
  const [hostReply, setHostReply] = useState("");

  const { data: experiences = [] } = useQuery({
    queryKey: experienceKeys.list(),
    queryFn: () => listPublicExperiences({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (payload: AdminCreateReviewPayload) =>
      adminCreateReview(payload),
    onSuccess: () => {
      toast.success("Review added successfully");
      qc.invalidateQueries({ queryKey: reviewKeys.all });
      handleClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleClose() {
    setExperienceId("");
    setReviewerName("");
    setRating(0);
    setDate(today);
    setBody("");
    setHostReply("");
    onClose();
  }

  function handleSubmit() {
    if (!experienceId) {
      toast.error("Please select an experience");
      return;
    }
    if (!reviewerName.trim()) {
      toast.error("Reviewer name is required");
      return;
    }
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }
    if (!body.trim()) {
      toast.error("Review comment is required");
      return;
    }

    const payload: AdminCreateReviewPayload = {
      experience_id: experienceId,
      reviewer_name: reviewerName.trim(),
      rating,
      body: body.trim(),
      ...(hostReply.trim() && { operator_reply: hostReply.trim() }),
      ...(date && { created_at: date }),
    };
    mutation.mutate(payload);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Experience */}
          <div className="space-y-1.5">
            <Label>Experience</Label>
            <Select value={experienceId} onValueChange={setExperienceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an experience…" />
              </SelectTrigger>
              <SelectContent>
                {experiences.map((exp) => (
                  <SelectItem key={exp.id} value={exp.id}>
                    {exp.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reviewer name */}
          <div className="space-y-1.5">
            <Label>Reviewer Name</Label>
            <Input
              placeholder="e.g. Priya S."
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
            />
          </div>

          {/* Rating */}
          <div className="space-y-1.5">
            <Label>Rating</Label>
            <StarPicker value={rating} onChange={setRating} />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label>Review Date</Label>
            <Input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <Label>Comment</Label>
            <Textarea
              placeholder="What did the reviewer say?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {body.length}/500
            </p>
          </div>

          {/* Host reply */}
          <div className="space-y-1.5">
            <Label>
              Host Reply{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              placeholder="Add a host reply to this review…"
              value={hostReply}
              onChange={(e) => setHostReply(e.target.value)}
              maxLength={300}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {hostReply.length}/300
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Add Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminReviewsPage() {
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  const params = {
    ...(flaggedOnly && { flagged: true }),
    page,
  };

  const { data: reviews, isLoading } = useQuery({
    queryKey: reviewKeys.forAdmin({ flagged: String(flaggedOnly), page: String(page) }),
    queryFn: () => adminGetReviews(params),
  });

  const PAGE_SIZE = 20;
  const hasMore = (reviews?.length ?? 0) === PAGE_SIZE;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Reviews"
        description="Manage customer reviews across all experiences."
        action={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Review
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => {
            setFlaggedOnly(!flaggedOnly);
            setPage(1);
          }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors",
            flaggedOnly
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-card border-border text-slate-600 hover:border-slate-300"
          )}
        >
          <Flag className="h-3.5 w-3.5" />
          Flagged only
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !reviews || reviews.length === 0 ? (
        <EmptyState
          icon={<Star className="h-8 w-8 text-muted-foreground" />}
          title="No reviews yet"
          description={
            flaggedOnly
              ? "No flagged reviews at the moment."
              : "No reviews have been submitted yet."
          }
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {((reviews?.length ?? 0) > 0 || page > 1) && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">Page {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      <AddReviewDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}
