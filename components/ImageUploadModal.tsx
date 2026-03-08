"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ImageUploader } from "./ImageUploader";

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (fileId: string) => void;
  onUrlAdd: (url: string) => void;
  title?: string;
}

export function ImageUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  onUrlAdd,
  title = "Upload Image",
}: ImageUploadModalProps) {
  // If we don't return null completely, AnimatePresence can animate the exit.
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-card-dark p-6 shadow-xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ImageUploader
              onUploadComplete={(fileId) => {
                onUploadComplete(fileId);
                onClose();
              }}
              onUrlAdd={(url) => {
                onUrlAdd(url);
                onClose();
              }}
              onCancel={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
