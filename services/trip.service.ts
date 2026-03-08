import { ID, Query, Permission, Role } from "appwrite";
import { databases } from "@/lib/appwrite";
import { Trip, TripDay, TripMember, CreateTripInput } from "@/types/trip";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const TRIPS_COLLECTION = "trips";
const TRIP_MEMBERS_COLLECTION = "trip_members";
const TRIP_DAYS_COLLECTION = "trip_days";

export const tripService = {
  /**
   * Creates a new trip and adds the creator as the owner.
   */
  async createTrip(data: CreateTripInput, userId: string): Promise<Trip> {
    try {
      // 1. Create the trip document
      const trip = await databases.createDocument<Trip>(
        DATABASE_ID,
        TRIPS_COLLECTION,
        ID.unique(),
        {
          ...data,
          currency: data.currency || "INR",
          createdBy: userId,
        },
        [
          Permission.read(Role.user(userId)),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );

      // 2. Add user as trip owner
      await databases.createDocument<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        ID.unique(),
        {
          tripId: trip.$id,
          userId: userId,
          role: "owner",
        }
      );

      return trip;
    } catch (error) {
      console.error("Error creating trip:", error);
      throw error;
    }
  },

  /**
   * Fetches all trips belonging to a user
   */
  async getUserTrips(userId: string): Promise<Trip[]> {
    try {
      // First find all memberships for this user
      const memberships = await databases.listDocuments<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        [Query.equal("userId", userId)]
      );

      if (memberships.documents.length === 0) {
        return [];
      }

      // Get the tripIds
      const tripIds = memberships.documents.map((m) => m.tripId);

      // Fetch the actual trips
      // Appwrite's max queries in OR/equal might be limited, but for small arrays it's fine.
      // Another approach is just querying trips where createdBy = userId, but this doesn't include shared trips.
      // For now, let's query the trips matching the IDs.
      const trips = await databases.listDocuments<Trip>(
        DATABASE_ID,
        TRIPS_COLLECTION,
        [Query.equal("$id", tripIds), Query.orderDesc("$createdAt")]
      );

      return trips.documents;
    } catch (error) {
      console.error("Error fetching user trips:", error);
      throw error;
    }
  },

  /**
   * Gets a specific trip by ID
   */
  async getTrip(tripId: string): Promise<Trip> {
    try {
      return await databases.getDocument<Trip>(
        DATABASE_ID,
        TRIPS_COLLECTION,
        tripId
      );
    } catch (error) {
      console.error("Error fetching trip:", error);
      throw error;
    }
  },

  /**
   * Deletes a trip entirely
   */
  async deleteTrip(tripId: string): Promise<void> {
    try {
      // Normally, you might also want to delete related trip_members and trip_days.
      // Assuming Appwrite relations or manual cleanup. For now, we will manually clean up.

      const relatedMembers = await databases.listDocuments(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        [Query.equal("tripId", tripId)]
      );

      for (const member of relatedMembers.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          TRIP_MEMBERS_COLLECTION,
          member.$id
        );
      }

      const relatedDays = await databases.listDocuments(
        DATABASE_ID,
        TRIP_DAYS_COLLECTION,
        [Query.equal("tripId", tripId)]
      );

      for (const day of relatedDays.documents) {
        await databases.deleteDocument(
          DATABASE_ID,
          TRIP_DAYS_COLLECTION,
          day.$id
        );
      }

      await databases.deleteDocument(DATABASE_ID, TRIPS_COLLECTION, tripId);
    } catch (error) {
      console.error("Error deleting trip:", error);
      throw error;
    }
  },

  /**
   * Update an existing trip
   */
  async updateTrip(
    tripId: string,
    data: Partial<CreateTripInput>
  ): Promise<Trip> {
    try {
      return await databases.updateDocument<Trip>(
        DATABASE_ID,
        TRIPS_COLLECTION,
        tripId,
        data
      );
    } catch (error) {
      console.error("Error updating trip:", error);
      throw error;
    }
  },

  /**
   * Adds a day to a trip
   */
  async addTripDay(
    tripId: string,
    date: string,
    orderIndex: number
  ): Promise<TripDay> {
    try {
      return await databases.createDocument<TripDay>(
        DATABASE_ID,
        TRIP_DAYS_COLLECTION,
        ID.unique(),
        {
          tripId,
          date,
          orderIndex,
        }
        // Inheriting permissions from trip members would be ideal.
        // For now, these are restricted depending on user rules or default DB permissions.
      );
    } catch (error) {
      console.error("Error adding trip day:", error);
      throw error;
    }
  },

  /**
   * Get days for a trip
   */
  async getTripDays(tripId: string): Promise<TripDay[]> {
    try {
      const days = await databases.listDocuments<TripDay>(
        DATABASE_ID,
        TRIP_DAYS_COLLECTION,
        [Query.equal("tripId", tripId), Query.orderAsc("orderIndex")]
      );
      return days.documents;
    } catch (error) {
      console.error("Error fetching trip days:", error);
      throw error;
    }
  },

  /**
   * Updates a trip day
   */
  async updateTripDay(dayId: string, data: Partial<TripDay>): Promise<TripDay> {
    try {
      return await databases.updateDocument<TripDay>(
        DATABASE_ID,
        TRIP_DAYS_COLLECTION,
        dayId,
        data
      );
    } catch (error) {
      console.error("Error updating trip day:", error);
      throw error;
    }
  },

  /**
   * Deletes a trip day
   */
  async deleteTripDay(dayId: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, TRIP_DAYS_COLLECTION, dayId);
    } catch (error) {
      console.error("Error deleting trip day:", error);
      throw error;
    }
  },
};
