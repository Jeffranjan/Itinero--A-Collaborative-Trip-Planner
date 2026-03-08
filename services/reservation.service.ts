import { ID, Query, Permission, Role } from "appwrite";
import { databases } from "@/lib/appwrite";
import { TripReservation } from "@/types/reservation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const RESERVATIONS_COLLECTION = "trip_reservations";

export const reservationService = {
  /**
   * Fetch all reservations for a specific trip, ordered by start date (if possible) or creation.
   */
  async getTripReservations(tripId: string): Promise<TripReservation[]> {
    try {
      const response = await databases.listDocuments<TripReservation>(
        DATABASE_ID,
        RESERVATIONS_COLLECTION,
        [
          Query.equal("tripId", tripId),
          Query.orderAsc("startDate"), // Order by start date
          Query.limit(100),
        ]
      );
      return response.documents;
    } catch (error) {
      console.error("Error fetching trip reservations:", error);
      throw error;
    }
  },

  /**
   * Create a new reservation for a trip.
   */
  async createReservation(
    tripId: string,
    payload:
      | Omit<
          TripReservation,
          | "$id"
          | "$collectionId"
          | "$databaseId"
          | "$createdAt"
          | "$updatedAt"
          | "$permissions"
          | "tripId"
          | "createdAt"
        >
      | any,
    userId: string,
    // Note: Trip editors can edit/delete, trip members can only read
    editors: string[],
    members: string[]
  ): Promise<TripReservation> {
    try {
      const permissions = [
        Permission.read(Role.any()), // Allow anyone with access to read
        Permission.update(Role.users()), // Allow authenticated users to update
        Permission.delete(Role.users()), // Allow authenticated users to delete
      ];

      const documentData = {
        tripId,
        createdAt: new Date().toISOString(),
        ...payload,
      };

      return await databases.createDocument<TripReservation>(
        DATABASE_ID,
        RESERVATIONS_COLLECTION,
        ID.unique(),
        documentData,
        permissions
      );
    } catch (error) {
      console.error("Error creating reservation:", error);
      throw error;
    }
  },

  /**
   * Update an existing reservation.
   */
  async updateReservation(
    reservationId: string,
    payload: Partial<
      Omit<
        TripReservation,
        | "$id"
        | "$collectionId"
        | "$databaseId"
        | "$createdAt"
        | "$updatedAt"
        | "$permissions"
        | "tripId"
        | "createdAt"
        | "createdBy"
      >
    >
  ): Promise<TripReservation> {
    try {
      return await databases.updateDocument<TripReservation>(
        DATABASE_ID,
        RESERVATIONS_COLLECTION,
        reservationId,
        payload
      );
    } catch (error) {
      console.error("Error updating reservation:", error);
      throw error;
    }
  },

  /**
   * Delete a reservation.
   */
  async deleteReservation(reservationId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        RESERVATIONS_COLLECTION,
        reservationId
      );
    } catch (error) {
      console.error("Error deleting reservation:", error);
      throw error;
    }
  },
};
