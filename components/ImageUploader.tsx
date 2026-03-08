"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud,
  Link as LinkIcon,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { mediaService } from "@/services/media.service";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  onUploadComplete: (fileId: string) => void;
  onUrlAdd: (url: string) => void;
  onCancel?: () => void;
}

export function ImageUploader({
  onUploadComplete,
  onUrlAdd,
  onCancel,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileId = await mediaService.uploadImage(file, (progress) => {
        setUploadProgress(progress.progress);
      });
      setIsCompleted(true);
      setTimeout(() => {
        onUploadComplete(fileId);
      }, 1500);
    } catch (error) {
      console.error(error);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFile(e.target.files[0]);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onUrlAdd(urlInput.trim());
      setUrlInput("");
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {previewUrl ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative overflow-hidden rounded-xl border border-white/10 bg-black/20"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview"
              className={`max-h-[300px] w-full object-contain transition-all duration-300 ${isCompleted ? "brightness-50" : ""}`}
            />
            <AnimatePresence>
              {isUploading && !isCompleted && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                  <Loader2 className="mb-4 h-8 w-8 animate-spin text-accent-orange" />
                  <p className="mb-2 font-medium text-white">
                    Uploading... {Math.round(uploadProgress || 0)}%
                  </p>
                  <div className="h-2 w-48 overflow-hidden rounded-full bg-white/20">
                    <motion.div
                      className="h-full bg-accent-orange"
                      initial={{ width: "0%" }}
                      animate={{ width: `${uploadProgress || 0}%` }}
                      transition={{ ease: "circOut" }}
                    />
                  </div>
                </motion.div>
              )}
              {isCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 200,
                      damping: 10,
                      delay: 0.1,
                    }}
                  >
                    <CheckCircle2 className="mb-4 h-16 w-16 text-emerald-500" />
                  </motion.div>
                  <p className="text-lg font-medium text-white">
                    Upload Complete!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            {!isUploading && !isCompleted && onCancel && (
              <button
                onClick={() => {
                  setPreviewUrl(null);
                  onCancel();
                }}
                className="absolute right-2 top-2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/80"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Drag and Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all duration-300 ${
                isDragging
                  ? "scale-[1.02] border-accent-orange bg-accent-orange/10 shadow-[0_0_20px_rgba(255,107,0,0.3)]"
                  : "border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <UploadCloud
                className={`mb-4 h-10 w-10 ${isDragging ? "text-accent-orange" : "text-gray-400"}`}
              />
              <p className="mb-1 text-sm font-medium text-white">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                SVG, PNG, JPG or GIF (max. 10MB)
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10"></div>
              <span className="text-xs font-medium uppercase text-gray-500">
                or
              </span>
              <div className="h-px flex-1 bg-white/10"></div>
            </div>

            {/* URL Input */}
            <form onSubmit={handleUrlSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  placeholder="Paste an image URL"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full rounded-xl border border-white/5 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-accent-orange/50 focus:outline-none focus:ring-1 focus:ring-accent-orange/50"
                  required
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="shrink-0 border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Add URL
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
