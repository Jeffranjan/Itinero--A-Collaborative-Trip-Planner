import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ExternalLink } from "lucide-react";
import { TripFile } from "@/types/file";
import { fileService } from "@/services/file.service";
import { Button } from "@/components/ui/Button";

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: TripFile | null;
}

export function FilePreviewModal({
  isOpen,
  onClose,
  file,
}: FilePreviewModalProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!file) return null;

  const isImage = file.fileType.startsWith("image/");
  const isPdf = file.fileType === "application/pdf";
  const previewUrl = fileService.getFileView(file.fileId);
  const downloadUrl = fileService.getFileDownload(file.fileId);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-auto flex w-full max-w-5xl flex-col rounded-2xl border border-white/10 bg-[#1A1A1A] shadow-2xl"
              style={{ maxHeight: "calc(100vh - 2rem)", height: "90vh" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 p-4">
                <h2 className="line-clamp-1 text-lg font-semibold text-white">
                  {file.fileName}
                </h2>
                <div className="flex items-center gap-2">
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                    title="Download"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex h-full flex-1 items-center justify-center overflow-hidden p-4">
                {isImage ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewUrl}
                    alt={file.fileName}
                    className="max-h-full max-w-full rounded-lg object-contain"
                  />
                ) : isPdf ? (
                  <iframe
                    src={previewUrl}
                    className="h-full w-full rounded-lg bg-white"
                    title={file.fileName}
                  />
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-4 rounded-full bg-white/5 p-6">
                      <ExternalLink className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-medium text-white">
                      Preview Not Available
                    </h3>
                    <p className="mb-6 text-gray-400">
                      This file type ({file.fileType}) cannot be previewed in
                      the browser.
                    </p>
                    <Button
                      asChild
                      className="bg-accent-orange hover:bg-orange-600"
                    >
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download File
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
