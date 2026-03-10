import { useState } from "react";
import { Plus, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { checklistService } from "@/services/checklist.service";
import { ChecklistItem as ItemType } from "@/types/checklist";
import { ChecklistList } from "./ChecklistList";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { arrayMove } from "@dnd-kit/sortable";

interface Props {
  tripId: string;
  isOwnerOrEditor: boolean;
  userId: string | undefined;
}

export function ChecklistTab({ tripId, isOwnerOrEditor, userId }: Props) {
  const queryClient = useQueryClient();
  const [newListTitle, setNewListTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { data: checklistData, isLoading: isLoadingChecklists } = useQuery({
    queryKey: ["tripChecklists", tripId],
    queryFn: async () => {
      const lists = await checklistService.getTripChecklists(tripId);

      const newItemsMap: Record<string, ItemType[]> = {};
      const allItemIds: string[] = [];
      await Promise.all(
        lists.map(async (list) => {
          const items = await checklistService.getChecklistItems(list.$id);
          newItemsMap[list.$id] = items;
          allItemIds.push(...items.map((i) => i.$id));
        })
      );

      return { lists, itemsMap: newItemsMap, allItemIds };
    },
  });

  const { data: completionsMap = {}, isLoading: isLoadingCompletions } =
    useQuery({
      queryKey: ["tripChecklistsCompletions", tripId, userId],
      enabled: !!userId && !!checklistData?.allItemIds?.length,
      queryFn: async () => {
        const allItemIds = checklistData!.allItemIds;
        if (allItemIds.length === 0) return {};

        const completions = await checklistService.getUserItemCompletions(
          userId!,
          allItemIds
        );
        const map: Record<string, boolean> = {};
        for (const comp of completions) {
          map[comp.itemId] = comp.completed;
        }
        return map;
      },
    });

  const checklists = checklistData?.lists || [];
  const itemsMap = checklistData?.itemsMap || {};
  const isLoading = isLoadingChecklists || isLoadingCompletions;

  const handleCreateList = async () => {
    if (!newListTitle.trim() || !userId) return;
    try {
      setIsCreating(true);
      await checklistService.createChecklist(
        tripId,
        newListTitle.trim(),
        userId
      );
      setNewListTitle("");
      queryClient.invalidateQueries({ queryKey: ["tripChecklists", tripId] });
    } catch (error) {
      toast.error("Failed to create checklist");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await checklistService.deleteChecklist(listId);
      queryClient.invalidateQueries({ queryKey: ["tripChecklists", tripId] });
    } catch (error) {
      toast.error("Failed to delete checklist");
    }
  };

  const handleAddItem = async (listId: string, text: string) => {
    if (!userId) return;
    try {
      await checklistService.createChecklistItem(listId, text, userId);
      queryClient.invalidateQueries({ queryKey: ["tripChecklists", tripId] });
    } catch (error) {
      toast.error("Failed to add item");
    }
  };

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    if (!userId) return;

    try {
      await checklistService.toggleItemCompletion(itemId, userId, completed);
      queryClient.invalidateQueries({
        queryKey: ["tripChecklistsCompletions", tripId, userId],
      });
    } catch (error) {
      toast.error("Failed to update item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await checklistService.deleteChecklistItem(itemId);
      queryClient.invalidateQueries({ queryKey: ["tripChecklists", tripId] });
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  const handleReorderItems = async (
    checklistId: string,
    oldIndex: number,
    newIndex: number
  ) => {
    const listItems = itemsMap[checklistId] || [];
    const newItems = arrayMove(listItems, oldIndex, newIndex);

    try {
      const updates = newItems.map((item, index) => ({
        id: item.$id,
        order: index,
      }));
      await checklistService.reorderChecklistItems(updates);
      queryClient.invalidateQueries({ queryKey: ["tripChecklists", tripId] });
    } catch (error) {
      console.error(error);
    }
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold text-white">Checklists</h2>

        {isOwnerOrEditor && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New list name..."
              value={newListTitle}
              onChange={(e) => setNewListTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
              className="rounded-lg border border-white/10 bg-black/20 px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-accent-orange focus:outline-none"
            />
            <Button
              onClick={handleCreateList}
              disabled={isCreating || !newListTitle.trim()}
              className="bg-accent-orange text-white hover:bg-orange-600"
            >
              <Plus className="mr-2 h-4 w-4" /> Create
            </Button>
          </div>
        )}
      </div>

      {checklists.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/5 py-16 text-center text-gray-400">
          <ListTodo className="mb-4 h-12 w-12 text-white/20" />
          <p className="mb-2 text-lg text-white">No checklists yet</p>
          <p className="text-sm">
            Create your first packing list or to-do list.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
          {checklists.map((list) => (
            <ChecklistList
              key={list.$id}
              checklist={list}
              items={itemsMap[list.$id] || []}
              completionsMap={completionsMap}
              isOwnerOrEditor={isOwnerOrEditor}
              onAddItem={handleAddItem}
              onToggleItem={handleToggleItem}
              onDeleteItem={handleDeleteItem}
              onDeleteList={handleDeleteList}
              onReorderItems={handleReorderItems}
            />
          ))}
        </div>
      )}
    </div>
  );
}
