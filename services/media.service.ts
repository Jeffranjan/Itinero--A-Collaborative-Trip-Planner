import { ID } from "appwrite";
import { storage } from "@/lib/appwrite";

const BUCKET_ID = "trip_bucket_id";

export const mediaService = {
  async uploadImage(
    file: File,
    onProgress?: (progress: { progress: number }) => void
  ) {
    try {
      // Empty permissions array = use bucket-level defaults
      const response = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file,
        [],
        onProgress as any
      );
      return response.$id;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  async deleteImage(fileId: string) {
    try {
      await storage.deleteFile(BUCKET_ID, fileId);
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  },

  /** Preview URL — uses getFileView since Appwrite Free plan doesn't support preview transforms. */
  getImagePreview(fileId: string): string {
    return storage.getFileView(BUCKET_ID, fileId).toString();
  },

  getImageUrl(fileId: string): string {
    return storage.getFileView(BUCKET_ID, fileId).toString();
  },
};
