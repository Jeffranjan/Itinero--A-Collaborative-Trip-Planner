import { ID, Query, Permission, Role } from "appwrite";
import { databases } from "@/lib/appwrite";
import { TripActivity, CreateActivityInput } from "@/types/trip";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const ACTIVITIES_COLLECTION = "activities";

export const activityService = {
  /**
   * Creates a new activity
   */
  async createActivity(
    data: CreateActivityInput,
    userId: string
  ): Promise<TripActivity> {
    try {
      return await databases.createDocument<TripActivity>(
        DATABASE_ID,
        ACTIVITIES_COLLECTION,
        ID.unique(),
        data,
        [
          // Typically we would dynamically assign based on member roles, but for now
          // we add the creator specifically, or just rely on database level collection rules
          // if we want all members to access it. We'll add the creator for safety.
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );
    } catch (error) {
      console.error("Error creating activity:", error);
      throw error;
    }
  },

  /**
   * Fetches activities for a specific day
   */
  async getActivitiesByDay(dayId: string): Promise<TripActivity[]> {
    try {
      const activities = await databases.listDocuments<TripActivity>(
        DATABASE_ID,
        ACTIVITIES_COLLECTION,
        [Query.equal("dayId", dayId), Query.orderAsc("orderIndex")]
      );
      return activities.documents;
    } catch (error) {
      console.error("Error fetching activities:", error);
      throw error;
    }
  },

  /**
   * Update an existing activity
   */
  async updateActivity(
    activityId: string,
    data: Partial<CreateActivityInput>
  ): Promise<TripActivity> {
    try {
      return await databases.updateDocument<TripActivity>(
        DATABASE_ID,
        ACTIVITIES_COLLECTION,
        activityId,
        data
      );
    } catch (error) {
      console.error("Error updating activity:", error);
      throw error;
    }
  },

  /**
   * Delete an activity
   */
  async deleteActivity(activityId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        ACTIVITIES_COLLECTION,
        activityId
      );
    } catch (error) {
      console.error("Error deleting activity:", error);
      throw error;
    }
  },

  /**
   * Reorder activities mapping
   */
  async reorderActivities(
    updates: { id: string; orderIndex: number }[]
  ): Promise<void> {
    try {
      // Execute all updates concurrently
      await Promise.all(
        updates.map((update) =>
          databases.updateDocument(
            DATABASE_ID,
            ACTIVITIES_COLLECTION,
            update.id,
            { orderIndex: update.orderIndex }
          )
        )
      );
    } catch (error) {
      console.error("Error reordering activities:", error);
      throw error;
    }
  },
};
