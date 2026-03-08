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
  /**
   * Set or update presence for a user in a trip
   */
  async upsertPresence(
    data: Omit<TripPresence, keyof Models.Document | "lastSeen">
  ): Promise<TripPresence> {
    try {
      const now = new Date().toISOString();

      // Check if presence document already exists for this user in this trip
      const existing = await databases.listDocuments<TripPresence>(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("tripId", data.tripId), Query.equal("userId", data.userId)]
      );

      if (existing.documents.length > 0) {
        // Update existing presence
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
          // If the document was deleted by the unmount cleanup right before this update, simply fall through to create a new one.
          if (error?.code !== 404) throw error;
        }
      }

      // Create new presence document
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

  /**
   * Update the status and optionally editingDayId of existing presence
   */
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

  /**
   * Update the lastSeen timestamp (heartbeat)
   */
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

  /**
   * Remove a user's presence from a trip
   */
  async removePresence(tripId: string, userId: string) {
    try {
      const existing = await databases.listDocuments<TripPresence>(
        DATABASE_ID,
        COLLECTION_ID,
        [Query.equal("tripId", tripId), Query.equal("userId", userId)]
      );

      if (existing.documents.length > 0) {
        // Can be multiple if race conditions occurred, delete all
        for (const doc of existing.documents) {
          await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, doc.$id);
        }
      }
    } catch (error) {
      console.error("Error removing presence:", error);
    }
  },

  /**
   * Remove a user's presence instantly by its known Document ID
   */
  async removePresenceById(docId: string) {
    try {
      await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, docId);
    } catch (error) {
      console.error("Error removing presence by ID:", error);
    }
  },

  /**
   * Get all active presences for a trip (culling stale ones is handled here and on client)
   */
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
