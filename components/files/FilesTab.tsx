import { useState, useCallback, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, File as FileIcon } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { TripFile } from "@/types/file";
import { fileService } from "@/services/file.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTripRealtime } from "@/hooks/useTripRealtime";
import { FileCard } from "./FileCard";
import { FilePreviewModal } from "./FilePreviewModal";

interface FilesTabProps {
  tripId: string;
  userId: string | undefined;
  isOwnerOrEditor: boolean;
}

export function FilesTab({ tripId, userId, isOwnerOrEditor }: FilesTabProps) {
  const queryClient = useQueryClient();

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["tripFiles", tripId],
    queryFn: () => fileService.getTripFiles(tripId),
  });

  // Re-use our centralized realtime approach. Wait, useTripRealtime doesn't specifically include trip_files yet,
  // so we'll add a quick local subscription for it here to invalidate.
  const realtimeChannels = useMemo(
    () => [
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!}.collections.trip_files.documents`,
    ],
    []
  );

  useRealtimeSubscription(
    realtimeChannels,
    useCallback(
      (event: any) => {
        const payload = event.payload as TripFile;
        // Only process events for this trip
        if (payload.tripId !== tripId) return;

        const isCreate = event.events.some((e: string) =>
          e.includes(".create")
        );
        const isDelete = event.events.some((e: string) =>
          e.includes(".delete")
        );

        if (isCreate || isDelete) {
          queryClient.invalidateQueries({ queryKey: ["tripFiles", tripId] });
        }
      },
      [tripId, queryClient]
    )
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!isOwnerOrEditor || !userId) return;

      setIsUploading(true);
      try {
        for (const file of acceptedFiles) {
          // Check file size (20MB)
          if (file.size > 20 * 1024 * 1024) {
            toast.error(`File ${file.name} is larger than 20MB.`);
            continue;
          }
          await fileService.uploadTripFile(tripId, file, userId);
        }
        toast.success("Files uploaded successfully");
      } catch (error) {
        console.error("Error uploading files:", error);
        toast.error("Failed to upload some files");
      } finally {
        setIsUploading(false);
      }
    },
    [isOwnerOrEditor, tripId, userId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: !isOwnerOrEditor || isUploading,
    maxSize: 20 * 1024 * 1024,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
  });

  const handleDelete = async (file: TripFile) => {
    if (!isOwnerOrEditor) return;
    try {
      setDeletingIds((prev) => new Set(prev).add(file.$id));
      await fileService.deleteTripFile(file.$id, file.fileId);
      toast.success("File deleted");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(file.$id);
        return next;
      });
    }
  };

  const handleDownload = (file: TripFile) => {
    const url = fileService.getFileDownload(file.fileId);
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-orange border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Trip Documents</h2>
      </div>

      {isOwnerOrEditor && (
        <div
          {...getRootProps()}
          className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            isDragActive
              ? "border-accent-orange bg-accent-orange/10"
              : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
          } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
        >
          <input {...getInputProps()} />
          <CloudUpload className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="text-lg font-medium text-white">
            {isUploading
              ? "Uploading files..."
              : isDragActive
                ? "Drop files here..."
                : "Drag & drop files here, or click to select"}
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Supports PDF, JPG, PNG, WEBP, DOCX (Max 20MB)
          </p>

          {isUploading && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute bottom-0 left-0 h-1 overflow-hidden rounded-b-2xl bg-accent-orange"
            />
          )}
        </div>
      )}

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/5 py-16 text-center text-gray-400">
          <FileIcon className="mb-4 h-12 w-12 text-white/20" />
          <p className="mb-2 text-lg text-white">No files attached yet</p>
          <p className="text-sm">
            Upload tickets, bookings, and important documents.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {files.map((file) => (
            <FileCard
              key={file.$id}
              file={file}
              onPreview={setPreviewFile}
              onDownload={handleDownload}
              onDelete={handleDelete}
              isDeleting={deletingIds.has(file.$id)}
            />
          ))}
        </div>
      )}

      <FilePreviewModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
}
