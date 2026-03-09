import { ID, Query, Permission, Role, Models } from "appwrite";
import { databases } from "@/lib/appwrite";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = "trip_presence";

export interface TripPresence extends Models.Document {
  tripId: string;
  userId: string;
  userName: string;
  avatarInitial: string;
  status: "viewing" | "editing";
  editingDayId?: string;
  lastSeen: string;
}

export const presenceService = {
  async upsertPresence(
    data: Omit<TripPresence, keyof Models.Document | "lastSeen">
  ): Promise<TripPresence> {
    try {
      const now = new Date().toISOString();

      const existing = await databases.listDocuments<TripPresence>(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("tripId", data.tripId), Query.equal("userId", data.userId)]
      );

      if (existing.documents.length > 0) {
        const docId = existing.documents[0].$id;
        try {
          return await databases.updateDocument<TripPresence>(
            DATABASE_ID,
            COLLECTION_ID,
            docId,
            {
              ...data,
              lastSeen: now,
            }
          );
        } catch (error: any) {
          // Doc was deleted between read and update — create a new one below
          if (error?.code !== 404) throw error;
        }
      }

      return await databases.createDocument<TripPresence>(
        DATABASE_ID,
        COLLECTION_ID,
        ID.unique(),
        {
          ...data,
          lastSeen: now,
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(data.userId)),
          Permission.delete(Role.user(data.userId)),
        ]
      );
    } catch (error) {
      console.error("Error upserting presence:", error);
      throw error;
    }
  },

  async updateStatus(
    tripId: string,
    userId: string,
    status: "viewing" | "editing",
    editingDayId?: string
  ) {
    try {
      const existing = await databases.listDocuments<TripPresence>(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("tripId", tripId), Query.equal("userId", userId)]
      );

      if (existing.documents.length > 0) {
        const docId = existing.documents[0].$id;
        const now = new Date().toISOString();
        try {
          return await databases.updateDocument<TripPresence>(
            DATABASE_ID,
            COLLECTION_ID,
            docId,
            {
              status,
              editingDayId,
              lastSeen: now,
            }
          );
        } catch (error: any) {
          if (error?.code !== 404) throw error;
        }
      }
    } catch (error) {
      console.error("Error updating presence status:", error);
    }
  },

  async updateHeartbeat(tripId: string, userId: string) {
    try {
      const existing = await databases.listDocuments<TripPresence>(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("tripId", tripId), Query.equal("userId", userId)]
      );

      if (existing.documents.length > 0) {
        const docId = existing.documents[0].$id;
        const now = new Date().toISOString();
        try {
          return await databases.updateDocument<TripPresence>(
            DATABASE_ID,
            COLLECTION_ID,
            docId,
            {
              lastSeen: now,
            }
          );
        } catch (error: any) {
          if (error?.code !== 404) throw error;
        }
      }
    } catch (error) {
      console.error("Error updating presence heartbeat:", error);
    }
  },

  async removePresence(tripId: string, userId: string) {
    try {
      const existing = await databases.listDocuments<TripPresence>(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("tripId", tripId), Query.equal("userId", userId)]
      );

      if (existing.documents.length > 0) {
        // Delete all (may have duplicates from race conditions)
        for (const doc of existing.documents) {
          await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id);
        }
      }
    } catch (error) {
      console.error("Error removing presence:", error);
    }
  },

  async removePresenceById(docId: string) {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, docId);
    } catch (error) {
      console.error("Error removing presence by ID:", error);
    }
  },

  /** Returns presences updated within the last 30s. */
  async getTripPresence(tripId: string) {
    try {
      const response = await databases.listDocuments<TripPresence>(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("tripId", tripId)]
      );

      const now = new Date().getTime();
      return response.documents.filter((doc) => {
        const lastSeen = new Date(doc.lastSeen).getTime();
        return now - lastSeen < 30000;
      });
    } catch (error) {
      console.error("Error fetching trip presence:", error);
      return [];
    }
  },
};
