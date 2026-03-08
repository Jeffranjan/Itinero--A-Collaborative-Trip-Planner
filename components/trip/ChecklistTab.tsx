import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, ListTodo } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { checklistService } from "@/services/checklist.service";
import { TripChecklist, ChecklistItem as ItemType } from "@/types/checklist";
import { ChecklistList } from "./ChecklistList";
import { useRealtimeSubscription } from "@/hooks/useRealtimeSubscription";
import { arrayMove } from "@dnd-kit/sortable";

interface Props {
  tripId: string;
  isOwnerOrEditor: boolean;
  userId: string | undefined;
}

export function ChecklistTab({ tripId, isOwnerOrEditor, userId }: Props) {
  const [checklists, setChecklists] = useState<TripChecklist[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, ItemType[]>>({});
  const [completionsMap, setCompletionsMap] = useState<Record<string, boolean>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const lists = await checklistService.getTripChecklists(tripId);
      setChecklists(lists);

      const newItemsMap: Record<string, ItemType[]> = {};
      const allItemIds: string[] = [];
      await Promise.all(
        lists.map(async (list) => {
          const items = await checklistService.getChecklistItems(list.$id);
          newItemsMap[list.$id] = items;
          allItemIds.push(...items.map((i) => i.$id));
        })
      );
      setItemsMap(newItemsMap);

      if (userId && allItemIds.length > 0) {
        const completions = await checklistService.getUserItemCompletions(
          userId,
          allItemIds
        );
        const map: Record<string, boolean> = {};
        for (const comp of completions) {
          map[comp.itemId] = comp.completed;
        }
        setCompletionsMap(map);
      }
    } catch (error) {
      console.error("Error loading checklists:", error);
      toast.error("Failed to load checklists");
    } finally {
      setIsLoading(false);
    }
  }, [tripId, userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const realtimeChannels = useMemo(
    () => [
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!}.collections.trip_checklists.documents`,
      `databases.${process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!}.collections.checklist_items.documents`,
    ],
    []
  );

  useRealtimeSubscription(
    realtimeChannels,
    useCallback(
      (event) => {
        const payload = event.payload as any;
        const isCreate = event.events.some((e: string) =>
          e.includes(".create")
        );
        const isUpdate = event.events.some((e: string) =>
          e.includes(".update")
        );
        const isDelete = event.events.some((e: string) =>
          e.includes(".delete")
        );

        if (
          event.events.some((e: string) =>
            e.includes(".collections.trip_checklists.")
          )
        ) {
          if (payload.tripId !== tripId) return;
          const list = payload as TripChecklist;

          if (isCreate) {
            setChecklists((prev) => {
              if (prev.some((l) => l.$id === list.$id)) return prev;
              return [...prev, list].sort((a, b) => a.order - b.order);
            });
            setItemsMap((prev) => ({
              ...prev,
              [list.$id]: prev[list.$id] || [],
            }));
          } else if (isUpdate) {
            setChecklists((prev) =>
              prev.map((l) => (l.$id === list.$id ? list : l))
            );
          } else if (isDelete) {
            setChecklists((prev) => prev.filter((l) => l.$id !== list.$id));
            setItemsMap((prev) => {
              const newMap = { ...prev };
              delete newMap[list.$id];
              return newMap;
            });
          }
        }

        if (
          event.events.some((e: string) =>
            e.includes(".collections.checklist_items.")
          )
        ) {
          const item = payload as ItemType;

          setChecklists((currentLists) => {
            if (!currentLists.some((l) => l.$id === item.checklistId))
              return currentLists;

            if (isCreate) {
              setItemsMap((prev) => {
                const listItems = prev[item.checklistId] || [];
                if (listItems.some((i) => i.$id === item.$id)) return prev;
                return {
                  ...prev,
                  [item.checklistId]: [...listItems, item].sort(
                    (a, b) => a.order - b.order
                  ),
                };
              });
            } else if (isUpdate) {
              setItemsMap((prev) => {
                const listItems = prev[item.checklistId] || [];
                const newItems = listItems.some((i) => i.$id === item.$id)
                  ? listItems.map((i) => (i.$id === item.$id ? item : i))
                  : [...listItems, item];
                return {
                  ...prev,
                  [item.checklistId]: newItems.sort(
                    (a, b) => a.order - b.order
                  ),
                };
              });
            } else if (isDelete) {
              setItemsMap((prev) => {
                const listItems = prev[item.checklistId] || [];
                return {
                  ...prev,
                  [item.checklistId]: listItems.filter(
                    (i) => i.$id !== item.$id
                  ),
                };
              });
            }
            return currentLists;
          });
        }
      },
      [tripId]
    )
  );

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
    } catch (error) {
      toast.error("Failed to create checklist");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      await checklistService.deleteChecklist(listId);
    } catch (error) {
      toast.error("Failed to delete checklist");
    }
  };

  const handleAddItem = async (listId: string, text: string) => {
    if (!userId) return;
    try {
      await checklistService.createChecklistItem(listId, text, userId);
    } catch (error) {
      toast.error("Failed to add item");
    }
  };

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    if (!userId) return;

    // Optimistic update
    setCompletionsMap((prev) => ({ ...prev, [itemId]: completed }));

    try {
      await checklistService.toggleItemCompletion(itemId, userId, completed);
    } catch (error) {
      toast.error("Failed to update item");
      // Revert on error
      setCompletionsMap((prev) => ({ ...prev, [itemId]: !completed }));
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await checklistService.deleteChecklistItem(itemId);
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

    setItemsMap((prev) => ({
      ...prev,
      [checklistId]: newItems.map((item, index) => ({ ...item, order: index })),
    }));

    try {
      const updates = newItems.map((item, index) => ({
        id: item.$id,
        order: index,
      }));
      await checklistService.reorderChecklistItems(updates);
    } catch (error) {
      toast.error("Failed to reorder items");
      loadData();
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
