import { ID, Query, Permission, Role } from "appwrite";
import { databases, account } from "@/lib/appwrite";
import { TripMember } from "@/types/trip";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const TRIP_MEMBERS_COLLECTION = "trip_members";
const USERS_COLLECTION = "users";

export const memberService = {
  /**
   * Self-join a trip via link
   */
  async joinTrip(
    tripId: string,
    userId: string,
    role: "viewer" | "editor" = "viewer"
  ): Promise<TripMember> {
    try {
      // 1. Check if already a member
      const existingMembers = await databases.listDocuments<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        [Query.equal("tripId", tripId), Query.equal("userId", userId)]
      );

      if (existingMembers.documents.length > 0) {
        throw new Error("You are already a member of this trip.");
      }

      // 2. Fetch user identity to populate name and avatar
      let name = "Unknown";
      let avatarInitial = "?";
      try {
        const userAccount = await account.get();
        if (userAccount.name) {
          name = userAccount.name;
          avatarInitial = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        } else {
          name = userAccount.email.split("@")[0] || "Unknown";
          avatarInitial = name.slice(0, 2).toUpperCase();
        }
      } catch (e) {
        console.error("Could not fetch account details for joinTrip:", e);
      }

      // 3. Create trip_member document defaulting to provided role
      const newMember = await databases.createDocument<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        ID.unique(),
        {
          tripId,
          userId,
          role,
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

      return newMember;
    } catch (error) {
      console.error("Error joining trip:", error);
      throw error;
    }
  },

  /**
   * Ensure user is a member of the trip, creating if not exists.
   */
  async ensureMembership(
    tripId: string,
    userId: string,
    role: "owner" | "editor" | "viewer" = "viewer"
  ): Promise<TripMember> {
    try {
      // 1. Check if already a member
      const existingMembers = await databases.listDocuments<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        [Query.equal("tripId", tripId), Query.equal("userId", userId)]
      );

      if (existingMembers.documents.length > 0) {
        return existingMembers.documents[0];
      }

      // 2. Fetch user identity to populate name and avatar
      let name = "Unknown";
      let avatarInitial = "??";

      try {
        const userAccount = await account.get();
        if (userAccount.name) {
          name = userAccount.name;
          avatarInitial = name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        } else {
          name = userAccount.email.split("@")[0] || "Unknown";
          avatarInitial = name.slice(0, 2).toUpperCase();
        }
      } catch (e) {
        console.error("Could not fetch account details for membership:", e);
      }

      // 3. Create trip_member document
      const newMember = await databases.createDocument<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        ID.unique(),
        {
          tripId,
          userId,
          role,
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

      return newMember;
    } catch (error) {
      console.error("Error creating/ensuring membership:", error);
      throw error;
    }
  },

  /**
   * Get all members of a trip
   */
  async getTripMembers(tripId: string) {
    try {
      const members = await databases.listDocuments<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        [Query.equal("tripId", tripId)]
      );

      const userIds = members.documents.map((m) => m.userId);

      if (userIds.length === 0) return [];

      // Query the users directory to get names and emails
      const usersResponse = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION,
        [Query.equal("$id", userIds)]
      );

      // Enhance the members array with user details
      const enrichedMembers = members.documents.map((member) => {
        const userDetails = usersResponse.documents.find(
          (u) => u.$id === member.userId
        );
        return {
          ...member,
          user: userDetails
            ? { name: userDetails.name, email: userDetails.email }
            : null,
        };
      });

      return enrichedMembers;
    } catch (error) {
      console.error("Error fetching trip members:", error);
      throw error;
    }
  },

  /**
   * Update a member's role
   */
  async updateMemberRole(memberId: string, role: "editor" | "viewer") {
    try {
      return await databases.updateDocument<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        memberId,
        { role }
      );
    } catch (error) {
      console.error("Error updating member role:", error);
      throw error;
    }
  },

  /**
   * Remove a member
   */
  async removeMember(memberId: string) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        memberId
      );
    } catch (error) {
      console.error("Error removing member:", error);
      throw error;
    }
  },
};
