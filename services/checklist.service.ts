import { ID, Query, Permission, Role, Models } from "appwrite";
import { databases } from "@/lib/appwrite";
import { TripChecklist, ChecklistItem } from "@/types/checklist";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const CHECKLISTS_COLLECTION = "trip_checklists";
const CHECKLIST_ITEMS_COLLECTION = "checklist_items";
const CHECKLIST_ITEM_COMPLETIONS_COLLECTION = "checklist_item_completions";

export const checklistService = {
  async createChecklist(
    tripId: string,
    title: string,
    userId: string
  ): Promise<TripChecklist> {
    try {
      // Append to end of existing checklists
      const existing = await databases.listDocuments<TripChecklist>(
        DATABASE_ID,
        CHECKLISTS_COLLECTION,
        [
          Query.equal("tripId", tripId),
          Query.orderDesc("order"),
          Query.limit(1),
        ]
      );
      const newOrder =
        existing.documents.length > 0 ? existing.documents[0].order + 1 : 0;

      return await databases.createDocument<TripChecklist>(
        DATABASE_ID,
        CHECKLISTS_COLLECTION,
        ID.unique(),
        {
          tripId,
          title,
          createdBy: userId,
          createdAt: new Date().toISOString(),
          order: newOrder,
        }
      );
    } catch (error) {
      console.error("Error creating checklist:", error);
      throw error;
    }
  },

  async getTripChecklists(tripId: string): Promise<TripChecklist[]> {
    try {
      const resp = await databases.listDocuments<TripChecklist>(
        DATABASE_ID,
        CHECKLISTS_COLLECTION,
        [
          Query.equal("tripId", tripId),
          Query.orderAsc("order"),
          Query.limit(100),
        ]
      );
      return resp.documents;
    } catch (error) {
      console.error("Error fetching trip checklists:", error);
      throw error;
    }
  },

  async deleteChecklist(checklistId: string): Promise<void> {
    try {
      // Delete all items first
      const items = await databases.listDocuments<ChecklistItem>(
        DATABASE_ID,
        CHECKLIST_ITEMS_COLLECTION,
        [Query.equal("checklistId", checklistId), Query.limit(100)]
      );

      for (const item of items.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          CHECKLIST_ITEMS_COLLECTION,
          item.$id
        );
      }

      await databases.deleteDocument(
        DATABASE_ID,
        CHECKLISTS_COLLECTION,
        checklistId
      );
    } catch (error) {
      console.error("Error deleting checklist:", error);
      throw error;
    }
  },

  async createChecklistItem(
    checklistId: string,
    text: string,
    userId: string
  ): Promise<ChecklistItem> {
    try {
      const existing = await databases.listDocuments<ChecklistItem>(
        DATABASE_ID,
        CHECKLIST_ITEMS_COLLECTION,
        [
          Query.equal("checklistId", checklistId),
          Query.orderDesc("order"),
          Query.limit(1),
        ]
      );
      const newOrder =
        existing.documents.length > 0 ? existing.documents[0].order + 1 : 0;

      return await databases.createDocument<ChecklistItem>(
        DATABASE_ID,
        CHECKLIST_ITEMS_COLLECTION,
        ID.unique(),
        {
          checklistId,
          text,
          createdBy: userId,
          createdAt: new Date().toISOString(),
          order: newOrder,
        }
      );
    } catch (error) {
      console.error("Error creating checklist item:", error);
      throw error;
    }
  },

  async getChecklistItems(checklistId: string): Promise<ChecklistItem[]> {
    try {
      const resp = await databases.listDocuments<ChecklistItem>(
        DATABASE_ID,
        CHECKLIST_ITEMS_COLLECTION,
        [
          Query.equal("checklistId", checklistId),
          Query.orderAsc("order"),
          Query.limit(100),
        ]
      );
      return resp.documents;
    } catch (error) {
      console.error("Error fetching checklist items:", error);
      throw error;
    }
  },

  async updateChecklistItem(
    itemId: string,
    payload: Partial<Omit<ChecklistItem, keyof Models.Document>>
  ): Promise<ChecklistItem> {
    try {
      return await databases.updateDocument<ChecklistItem>(
        DATABASE_ID,
        CHECKLIST_ITEMS_COLLECTION,
        itemId,
        payload
      );
    } catch (error) {
      console.error("Error updating checklist item:", error);
      throw error;
    }
  },

  async deleteChecklistItem(itemId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        CHECKLIST_ITEMS_COLLECTION,
        itemId
      );
    } catch (error) {
      console.error("Error deleting checklist item:", error);
      throw error;
    }
  },

  async reorderChecklistItems(
    items: { id: string; order: number }[]
  ): Promise<void> {
    try {
      await Promise.all(
        items.map((item) =>
          databases.updateDocument(
            DATABASE_ID,
            CHECKLIST_ITEMS_COLLECTION,
            item.id,
            {
              order: item.order,
            }
          )
        )
      );
    } catch (error) {
      console.error("Error reordering checklist items:", error);
      throw error;
    }
  },

  async getUserItemCompletions(userId: string, itemIds: string[]) {
    if (itemIds.length === 0) return [];
    try {
      const resp = await databases.listDocuments<any>(
        DATABASE_ID,
        CHECKLIST_ITEM_COMPLETIONS_COLLECTION,
        [
          Query.equal("userId", userId),
          Query.equal("itemId", itemIds),
          Query.limit(100),
        ]
      );
      return resp.documents;
    } catch (error) {
      console.error("Error fetching user item completions:", error);
      throw error;
    }
  },

  async toggleItemCompletion(
    itemId: string,
    userId: string,
    completed: boolean
  ) {
    try {
      const existing = await databases.listDocuments<any>(
        DATABASE_ID,
        CHECKLIST_ITEM_COMPLETIONS_COLLECTION,
        [Query.equal("itemId", itemId), Query.equal("userId", userId)]
      );

      if (existing.documents.length > 0) {
        return await databases.updateDocument(
          DATABASE_ID,
          CHECKLIST_ITEM_COMPLETIONS_COLLECTION,
          existing.documents[0].$id,
          {
            completed,
            completedAt: new Date().toISOString(),
          }
        );
      } else {
        return await databases.createDocument(
          DATABASE_ID,
          CHECKLIST_ITEM_COMPLETIONS_COLLECTION,
          ID.unique(),
          {
            itemId,
            userId,
            completed,
            completedAt: new Date().toISOString(),
          },
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ]
        );
      }
    } catch (error) {
      console.error("Error toggling item completion:", error);
      throw error;
    }
  },
};
