import { ID, Query, Permission, Role } from "appwrite";
import { databases, account } from "@/lib/appwrite";
import { Trip, TripDay, TripMember, CreateTripInput } from "@/types/trip";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const TRIPS_COLLECTION = "trips";
const TRIP_MEMBERS_COLLECTION = "trip_members";
const TRIP_DAYS_COLLECTION = "trip_days";

export const tripService = {
  async createTrip(data: CreateTripInput, userId: string): Promise<Trip> {
    try {
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

      let name = "Unknown";
      let avatarInitial = "U";
      try {
        const userAccount = await account.get();
        if (userAccount.name) {
          name = userAccount.name;
          avatarInitial = name.charAt(0).toUpperCase();
        } else if (userAccount.email) {
          name = userAccount.email.split("@")[0] || "Unknown";
          avatarInitial = name.charAt(0).toUpperCase();
        }
      } catch (e) {
        console.error("Could not fetch account details for createTrip:", e);
      }

      await databases.createDocument<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        ID.unique(),
        {
          tripId: trip.$id,
          userId: userId,
          role: "owner",
          name,
          avatarInitial,
          joinedAt: new Date().toISOString(),
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(userId)),
          Permission.delete(Role.user(userId)),
        ]
      );

      return trip;
    } catch (error) {
      console.error("Error creating trip:", error);
      throw error;
    }
  },

  async getUserTrips(userId: string): Promise<Trip[]> {
    try {
      // Find trips through memberships (includes shared trips)
      const memberships = await databases.listDocuments<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        [Query.equal("userId", userId)]
      );

      if (memberships.documents.length === 0) {
        return [];
      }

      const tripIds = memberships.documents.map((m) => m.tripId);
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

  async deleteTrip(tripId: string): Promise<void> {
    try {
      // Clean up related documents before deleting the trip

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
      );
    } catch (error) {
      console.error("Error adding trip day:", error);
      throw error;
    }
  },

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

  async deleteTripDay(dayId: string): Promise<void> {
    try {
      await databases.deleteDocument(DATABASE_ID, TRIP_DAYS_COLLECTION, dayId);
    } catch (error) {
      console.error("Error deleting trip day:", error);
      throw error;
    }
  },
};
