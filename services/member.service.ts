import { ID, Query, Permission, Role } from "appwrite";
import { databases, account } from "@/lib/appwrite";
import { TripMember } from "@/types/trip";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const TRIP_MEMBERS_COLLECTION = "trip_members";

/** Resolves name and avatar from the current Appwrite session. */
async function resolveUserIdentity(): Promise<{
  name: string;
  avatarInitial: string;
}> {
  try {
    const userAccount = await account.get();
    if (userAccount.name) {
      return {
        name: userAccount.name,
        avatarInitial: userAccount.name.charAt(0).toUpperCase(),
      };
    }
    if (userAccount.email) {
      const emailName = userAccount.email.split("@")[0] || "Unknown";
      return {
        name: emailName,
        avatarInitial: emailName.charAt(0).toUpperCase(),
      };
    }
  } catch (e) {
    console.error("Could not fetch account details:", e);
  }
  return { name: "Unknown", avatarInitial: "U" };
}

export const memberService = {
  async ensureMembership(
    tripId: string,
    userId: string,
    role: "owner" | "editor" | "viewer" = "viewer"
  ): Promise<TripMember> {
    try {
      const existing = await databases.listDocuments<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        [Query.equal("tripId", tripId), Query.equal("userId", userId)]
      );

      if (existing.documents.length > 0) {
        const member = existing.documents[0];

        // Backfill name/avatar if empty
        if (!member.name || member.name === "Unknown") {
          const identity = await resolveUserIdentity();
          if (identity.name !== "Unknown") {
            try {
              await databases.updateDocument<TripMember>(
                DATABASE_ID,
                TRIP_MEMBERS_COLLECTION,
                member.$id,
                {
                  name: identity.name,
                  avatarInitial: identity.avatarInitial,
                }
              );
              return {
                ...member,
                name: identity.name,
                avatarInitial: identity.avatarInitial,
              };
            } catch (e) {
              console.error("Could not backfill member name:", e);
            }
          }
        }

        return member;
      }

      const identity = await resolveUserIdentity();

      const newMember = await databases.createDocument<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        ID.unique(),
        {
          tripId,
          userId,
          role,
          name: identity.name,
          avatarInitial: identity.avatarInitial,
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
      console.error("Error in ensureMembership:", error);
      throw error;
    }
  },

  async joinTrip(
    tripId: string,
    userId: string,
    role: "viewer" | "editor" = "viewer"
  ): Promise<TripMember> {
    const existing = await databases.listDocuments<TripMember>(
      DATABASE_ID,
      TRIP_MEMBERS_COLLECTION,
      [Query.equal("tripId", tripId), Query.equal("userId", userId)]
    );

    if (existing.documents.length > 0) {
      const member = await this.ensureMembership(tripId, userId, role);
      throw Object.assign(new Error("You are already a member of this trip."), {
        member,
      });
    }

    return this.ensureMembership(tripId, userId, role);
  },

  async getTripMembers(tripId: string): Promise<TripMember[]> {
    try {
      const members = await databases.listDocuments<TripMember>(
        DATABASE_ID,
        TRIP_MEMBERS_COLLECTION,
        [Query.equal("tripId", tripId)]
      );

      return members.documents;
    } catch (error) {
      console.error("Error fetching trip members:", error);
      throw error;
    }
  },

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
