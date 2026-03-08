import { ID, Query, Models, Permission, Role } from "appwrite";
import { databases } from "@/lib/appwrite";
import { memberService } from "./member.service";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const ROLE_REQUESTS_COLLECTION = "role_requests";
const USERS_COLLECTION = "users";

export interface RoleRequest extends Models.Document {
  tripId: string;
  userId: string;
  requestedRole: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export const roleRequestService = {
  /**
   * Create a new role request (e.g., Viewer to Editor)
   */
  async createRoleRequest(
    tripId: string,
    userId: string,
    requestedRole: "editor" | "owner" = "editor"
  ): Promise<RoleRequest> {
    try {
      // Check if a pending request already exists for this user in this trip
      const existing = await this.checkPendingRequestExists(tripId, userId);
      if (existing) {
        throw new Error("You already have a pending request for this trip.");
      }

      const newRequest = await databases.createDocument<RoleRequest>(
        DATABASE_ID,
        ROLE_REQUESTS_COLLECTION,
        ID.unique(),
        {
          tripId,
          userId,
          requestedRole,
          status: "pending",
          createdAt: new Date().toISOString(),
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any()),
        ]
      );

      return newRequest;
    } catch (error) {
      console.error("Error creating role request:", error);
      throw error;
    }
  },

  /**
   * Check if a pending request exists
   */
  async checkPendingRequestExists(
    tripId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        ROLE_REQUESTS_COLLECTION,
        [
          Query.equal("tripId", tripId),
          Query.equal("userId", userId),
          Query.equal("status", "pending"),
        ]
      );
      return response.documents.length > 0;
    } catch (error) {
      console.error("Error checking pending request:", error);
      return false; // Fail safe to false, but errors during create will catch it anyway
    }
  },

  /**
   * Get all pending requests for a specific trip (For the Owner)
   */
  async getPendingRequestsForTrip(tripId: string): Promise<RoleRequest[]> {
    try {
      const response = await databases.listDocuments<RoleRequest>(
        DATABASE_ID,
        ROLE_REQUESTS_COLLECTION,
        [Query.equal("tripId", tripId), Query.equal("status", "pending")]
      );

      if (response.documents.length === 0) return [];

      const userIds = response.documents.map((req) => req.userId);

      // Fetch user details to enrich the request payload for the UI
      const usersResponse = await databases.listDocuments(
        DATABASE_ID,
        USERS_COLLECTION,
        [Query.equal("$id", userIds)]
      );

      return response.documents.map((request) => {
        const userDetails = usersResponse.documents.find(
          (u) => u.$id === request.userId
        );
        return {
          ...request,
          user: userDetails
            ? { name: userDetails.name, email: userDetails.email }
            : undefined,
        };
      });
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      throw error;
    }
  },

  /**
   * Approve a role request
   */
  async approveRoleRequest(
    requestId: string,
    memberDocumentId: string,
    newRole: "editor" | "viewer"
  ): Promise<void> {
    try {
      // 1. Update the actual member record in memberService
      await memberService.updateMemberRole(memberDocumentId, newRole);

      // 2. Mark the request as approved
      await databases.updateDocument(
        DATABASE_ID,
        ROLE_REQUESTS_COLLECTION,
        requestId,
        {
          status: "approved",
        }
      );
    } catch (error) {
      console.error("Error approving role request:", error);
      throw error;
    }
  },

  /**
   * Reject a role request
   */
  async rejectRoleRequest(requestId: string): Promise<void> {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        ROLE_REQUESTS_COLLECTION,
        requestId,
        {
          status: "rejected",
        }
      );
    } catch (error) {
      console.error("Error rejecting role request:", error);
      throw error;
    }
  },
};
