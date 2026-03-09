import { ID, Query } from "appwrite";
import { databases, storage } from "@/lib/appwrite";
import { TripFile } from "@/types/file";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const FILES_COLLECTION = "trip_files";
const BUCKET_ID = "trip_bucket_id";

export const fileService = {
  async uploadTripFile(
    tripId: string,
    file: File,
    userId: string
  ): Promise<TripFile> {
    try {
      const uploadedFile = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      );

      const fileData = {
        tripId,
        fileId: uploadedFile.$id,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      };

      return await databases.createDocument<TripFile>(
        DATABASE_ID,
        FILES_COLLECTION,
        ID.unique(),
        fileData
      );
    } catch (error) {
      console.error("Error uploading trip file:", error);
      throw error;
    }
  },

  async deleteTripFile(documentId: string, fileId: string): Promise<void> {
    try {
      await storage.deleteFile(BUCKET_ID, fileId);

      await databases.deleteDocument(DATABASE_ID, FILES_COLLECTION, documentId);
    } catch (error) {
      console.error("Error deleting trip file:", error);
      throw error;
    }
  },

  async getTripFiles(tripId: string): Promise<TripFile[]> {
    try {
      const resp = await databases.listDocuments<TripFile>(
        DATABASE_ID,
        FILES_COLLECTION,
        [
          Query.equal("tripId", tripId),
          Query.orderDesc("uploadedAt"),
          Query.limit(100),
        ]
      );
      return resp.documents;
    } catch (error) {
      console.error("Error fetching trip files:", error);
      throw error;
    }
  },

  getFilePreview(fileId: string): string {
    return storage.getFilePreview(BUCKET_ID, fileId).toString();
  },

  getFileView(fileId: string): string {
    return storage.getFileView(BUCKET_ID, fileId).toString();
  },

  getFileDownload(fileId: string): string {
    return storage.getFileDownload(BUCKET_ID, fileId).toString();
  },
};
