import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { ChecklistItem as ItemType } from "@/types/checklist";

interface Props {
  item: ItemType;
  isCompleted: boolean;
  isOwnerOrEditor: boolean;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export function ChecklistItem({
  item,
  isCompleted,
  isOwnerOrEditor,
  onToggle,
  onDelete,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.$id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-card-dark p-3 transition-colors hover:border-white/10 ${
        isCompleted ? "opacity-60" : ""
      }`}
    >
      <div className="flex w-full items-center gap-3">
        {isOwnerOrEditor && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab text-gray-500 hover:text-white active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}
        <input
          type="checkbox"
          checked={isCompleted}
          onChange={(e) => onToggle(item.$id, e.target.checked)}
          className="h-4 w-4 cursor-pointer rounded border-gray-600 bg-transparent text-accent-orange focus:ring-accent-orange focus:ring-offset-background-dark disabled:cursor-not-allowed"
        />
        <span
          className={`text-sm ${isCompleted ? "text-gray-500 line-through" : "text-white"}`}
        >
          {item.text}
        </span>
      </div>

      {isOwnerOrEditor && (
        <button
          onClick={() => onDelete(item.$id)}
          className="text-gray-500 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}
