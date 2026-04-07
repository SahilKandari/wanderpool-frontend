"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Upload, Trash2, Star, ArrowLeft, Loader2, ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import {
  experienceKeys,
  listExperienceImages,
  addExperienceImage,
  deleteExperienceImage,
  setCoverImage,
} from "@/lib/api/experiences";
import { apiFetch } from "@/lib/api/client";
import type { ExperienceImage } from "@/lib/types/experience";
import { cn } from "@/lib/utils";

interface SignedParams {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  signature: string;
  folder: string;
  allowed_formats: string;
  resource_type: string;
  upload_url: string;
}

export default function ExperienceImagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: images = [], isLoading } = useQuery({
    queryKey: experienceKeys.images(id),
    queryFn: () => listExperienceImages(id),
  });

  const deleteMutation = useMutation({
    mutationFn: (imageId: string) => deleteExperienceImage(id, imageId),
    onSuccess: () => {
      toast.success("Image deleted");
      qc.invalidateQueries({ queryKey: experienceKeys.images(id) });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const coverMutation = useMutation({
    mutationFn: (imageId: string) => setCoverImage(id, imageId),
    onSuccess: () => {
      toast.success("Cover photo updated");
      qc.invalidateQueries({ queryKey: experienceKeys.images(id) });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be under 10 MB");
      return;
    }

    setUploading(true);
    try {
      // 1. Get signed params from our backend
      const signed = await apiFetch<SignedParams>(
        `/upload/sign?folder_type=experience_image&resource_id=${id}`
      );

      // 2. Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signed.api_key);
      formData.append("timestamp", String(signed.timestamp));
      formData.append("signature", signed.signature);
      formData.append("folder", signed.folder);
      formData.append("allowed_formats", signed.allowed_formats);

      const cdnRes = await fetch(signed.upload_url, {
        method: "POST",
        body: formData,
      });
      const cdnData = await cdnRes.json();

      if (!cdnRes.ok) {
        throw new Error(cdnData.error?.message ?? "Cloudinary upload failed");
      }

      // 3. Save the record in our DB
      await addExperienceImage(id, {
        public_id: cdnData.public_id,
        url: cdnData.secure_url,
        alt_text: file.name.split(".")[0],
      });

      toast.success("Image uploaded!");
      qc.invalidateQueries({ queryKey: experienceKeys.images(id) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(uploadFile);
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold">Experience Photos</h1>
          <p className="text-sm text-muted-foreground">
            Upload photos that showcase your experience. The cover photo is shown first.
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 mb-6 flex flex-col items-center gap-3 cursor-pointer transition-all",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-slate-50"
        )}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-primary">Uploading…</p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold">Drop photos here or click to browse</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WebP · Max 10 MB each</p>
            </div>
          </>
        )}
      </div>

      {/* Image grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="aspect-video rounded-xl" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No photos yet. Upload some above!</p>
          <p className="text-xs mt-1">At least 5 photos are recommended for better bookings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img: ExperienceImage) => (
            <div
              key={img.id}
              className={cn(
                "group relative rounded-xl overflow-hidden border-2 transition-all",
                img.is_cover ? "border-primary" : "border-transparent hover:border-border"
              )}
            >
              <div className="aspect-video bg-muted relative">
                <Image
                  src={img.url}
                  alt={img.alt_text ?? "Experience photo"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
              </div>

              {img.is_cover && (
                <div className="absolute top-2 left-2">
                  <Badge className="text-[10px] px-1.5 py-0.5 bg-primary text-white shadow-sm">
                    <Star className="h-2.5 w-2.5 mr-1 fill-current" /> Cover
                  </Badge>
                </div>
              )}

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {!img.is_cover && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 text-xs"
                    onClick={() => coverMutation.mutate(img.id)}
                    disabled={coverMutation.isPending}
                  >
                    <Star className="mr-1 h-3 w-3" /> Set Cover
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-7 text-xs"
                  onClick={() => deleteMutation.mutate(img.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          {images.length} photo{images.length !== 1 ? "s" : ""} · Hover over a photo to set it as cover or delete it
        </p>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={() => router.push("/agency/experiences")}>
          Done → Back to Experiences
        </Button>
      </div>
    </div>
  );
}
