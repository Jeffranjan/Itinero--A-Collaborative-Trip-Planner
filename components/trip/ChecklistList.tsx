import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Trash2, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { TripChecklist, ChecklistItem as ItemType } from "@/types/checklist";
import { ChecklistItem } from "./ChecklistItem";

interface Props {
  checklist: TripChecklist;
  items: ItemType[];
  completionsMap: Record<string, boolean>;
  isOwnerOrEditor: boolean;
  onAddItem: (checklistId: string, text: string) => void;
  onToggleItem: (itemId: string, completed: boolean) => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteList: (checklistId: string) => void;
  onReorderItems: (
    checklistId: string,
    oldIndex: number,
    newIndex: number
  ) => void;
}

export function ChecklistList({
  checklist,
  items,
  completionsMap,
  isOwnerOrEditor,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onDeleteList,
  onReorderItems,
}: Props) {
  const [newItemText, setNewItemText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.$id === active.id);
      const newIndex = items.findIndex((i) => i.$id === over.id);
      onReorderItems(checklist.$id, oldIndex, newIndex);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newItemText.trim()) {
      onAddItem(checklist.$id, newItemText.trim());
      setNewItemText("");
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-white/5 bg-card-dark p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">{checklist.title}</h3>
        {isOwnerOrEditor && (
          <button
            onClick={() => onDeleteList(checklist.$id)}
            className="text-gray-500 transition-colors hover:text-red-400"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={items.map((i) => i.$id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence mode="popLayout">
              {items.map((item) => (
                <ChecklistItem
                  key={item.$id}
                  item={item}
                  isCompleted={!!completionsMap[item.$id]}
                  isOwnerOrEditor={isOwnerOrEditor}
                  onToggle={onToggleItem}
                  onDelete={onDeleteItem}
                />
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      </div>

      {isOwnerOrEditor && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-white/10 px-3 py-2 transition-colors focus-within:border-accent-orange/50">
          <Plus className="h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Add Item (Press Enter)"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}
