import { memo } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Eye,
  FileIcon,
} from "lucide-react";
import { TripFile } from "@/types/file";

interface FileCardProps {
  file: TripFile;
  onPreview: (file: TripFile) => void;
  onDownload: (file: TripFile) => void;
  onDelete: (file: TripFile) => void;
  isDeleting?: boolean;
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) {
    return <ImageIcon className="h-8 w-8 text-blue-400" />;
  }
  if (fileType === "application/pdf") {
    return <FileText className="h-8 w-8 text-red-500" />;
  }
  return <FileIcon className="h-8 w-8 text-gray-400" />;
};

export const FileCard = memo(
  ({ file, onPreview, onDownload, onDelete, isDeleting }: FileCardProps) => {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="group relative flex flex-col items-center justify-between rounded-xl border border-white/10 bg-[#1A1A1A] p-4 shadow-lg transition-all hover:border-white/20"
      >
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
          {getFileIcon(file.fileType)}
        </div>

        <div className="w-full text-center">
          <h3
            className="truncate text-sm font-medium text-white"
            title={file.fileName}
          >
            {file.fileName}
          </h3>
          <p className="mt-1 text-xs text-gray-400">
            {formatBytes(file.fileSize)} •{" "}
            {format(new Date(file.uploadedAt), "MMM d, yyyy")}
          </p>
        </div>

        <div className="mt-4 flex w-full justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onPreview(file)}
            className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            title="Preview"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDownload(file)}
            className="rounded-lg bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            title="Download"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(file)}
            disabled={isDeleting}
            className={`rounded-lg p-2 text-red-400 transition-colors hover:bg-red-500/20 ${
              isDeleting ? "cursor-not-allowed opacity-50" : ""
            }`}
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    );
  }
);
FileCard.displayName = "FileCard";
