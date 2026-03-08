import { ID, Query } from "appwrite";
import { databases, storage } from "@/lib/appwrite";
import { TripFile } from "@/types/file";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const FILES_COLLECTION = "trip_files";
const BUCKET_ID = "trip_bucket_id";

export const fileService = {
  /**
   * Upload file to storage bucket and create metadata document.
   */
  async uploadTripFile(
    tripId: string,
    file: File,
    userId: string
  ): Promise<TripFile> {
    try {
      // 1. Upload to storage bucket
      const uploadedFile = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file
      );

      // 2. Create metadata doc
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

  /**
   * Delete file from bucket and metadata from database collection.
   */
  async deleteTripFile(documentId: string, fileId: string): Promise<void> {
    try {
      // 1. Delete File from Storage
      await storage.deleteFile(BUCKET_ID, fileId);

      // 2. Delete metadata doc from the DB
      await databases.deleteDocument(DATABASE_ID, FILES_COLLECTION, documentId);
    } catch (error) {
      console.error("Error deleting trip file:", error);
      throw error;
    }
  },

  /**
   * Fetch all files for a trip.
   */
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

  /**
   * Get File Preview URL for images.
   */
  getFilePreview(fileId: string): string {
    return storage.getFilePreview(BUCKET_ID, fileId).toString();
  },

  /**
   * Get File View URL for PDFs and other files.
   */
  getFileView(fileId: string): string {
    return storage.getFileView(BUCKET_ID, fileId).toString();
  },

  /**
   * Get File Download URL.
   */
  getFileDownload(fileId: string): string {
    return storage.getFileDownload(BUCKET_ID, fileId).toString();
  },
};
