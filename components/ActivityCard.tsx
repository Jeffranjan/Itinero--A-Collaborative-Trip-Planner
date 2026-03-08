"use client";

import { CSSProperties, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import {
  GripVertical,
  MapPin,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  ImageIcon,
} from "lucide-react";
import { mediaService } from "@/services/media.service";

import { TripActivity } from "@/types/trip";

interface ActivityCardProps {
  activity: TripActivity;
  isOwnerOrEditor: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onAddImage?: () => void;
  onImageClick?: (images: string[], index: number) => void;
}

export function ActivityCard({
  activity,
  isOwnerOrEditor,
  onEdit,
  onDelete,
  onAddImage,
  onImageClick,
}: ActivityCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const images = [
    ...(activity.imageIds || []).map((id) => mediaService.getImagePreview(id)),
    ...(activity.imageUrls || []),
  ];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: activity.$id,
    data: {
      type: "Activity",
      activity,
    },
    disabled: !isOwnerOrEditor,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      layout
      layoutId={`activity-card-${activity.$id}`}
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-start gap-3 rounded-xl border border-white/5 bg-card-dark p-4 transition-all duration-300 ${
        isDragging
          ? "scale-[1.04] cursor-grabbing border-accent-orange bg-accent-orange/5 shadow-xl"
          : "hover:scale-[1.01] hover:border-accent-orange/30 hover:shadow-lg"
      }`}
    >
      {/* Drag Handle */}
      {isOwnerOrEditor && (
        <div
          {...attributes}
          {...listeners}
          className="mt-1 shrink-0 cursor-grab text-gray-500 hover:text-white active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <h4 className="truncate font-semibold text-white">
            {activity.title}
          </h4>

          <div className="flex shrink-0 items-center justify-end">
            {/* Time range if present */}
            {(activity.startTime || activity.endTime) && (
              <div className="flex shrink-0 items-center gap-1 rounded-md bg-accent-orange/10 px-2 py-1 text-xs text-accent-orange">
                <Clock className="h-3 w-3" />
                {activity.startTime || "?"} - {activity.endTime || "?"}
              </div>
            )}

            {/* Options Menu */}
            {isOwnerOrEditor && (
              <div className="relative ml-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowMenu(!showMenu);
                  }}
                  className="rounded-full p-1.5 text-gray-500 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="More options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowMenu(false);
                      }}
                    />
                    <div className="absolute right-0 top-full z-50 mt-1 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#1A1A1A] py-1 shadow-lg">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setShowMenu(false);
                          onAddImage?.();
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <ImageIcon className="mr-2 h-4 w-4" /> Add Image
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setShowMenu(false);
                          onEdit?.();
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setShowMenu(false);
                          onDelete?.();
                        }}
                        className="flex w-full items-center px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {activity.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-400">
            {activity.description}
          </p>
        )}

        {activity.location && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{activity.location}</span>
          </div>
        )}

        {/* Image Gallery */}
        {images.length > 0 && (
          <motion.div
            layout
            className="relative z-20 mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5"
          >
            {images.map((url, i) => (
              <motion.div
                layoutId={`activity-${activity.$id}-image-${i}`}
                key={url + i}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onImageClick?.(images, i);
                }}
                className="relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-black/20 transition-opacity hover:opacity-80"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Activity Image ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
