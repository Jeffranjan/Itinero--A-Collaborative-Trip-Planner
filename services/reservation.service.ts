import { ID, Query, Permission, Role } from "appwrite";
import { databases } from "@/lib/appwrite";
import { TripReservation } from "@/types/reservation";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const RESERVATIONS_COLLECTION = "trip_reservations";

export const reservationService = {
  async getTripReservations(tripId: string): Promise<TripReservation[]> {
    try {
      const response = await databases.listDocuments<TripReservation>(
        DATABASE_ID,
        RESERVATIONS_COLLECTION,
        [Query.equal("tripId", tripId), Query.limit(100)]
      );
      return response.documents;
    } catch (error) {
      console.error("Error fetching trip reservations:", error);
      throw error;
    }
  },

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
    editors: string[],
    members: string[]
  ): Promise<TripReservation> {
    try {
      const permissions = [
        Permission.read(Role.any()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
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
