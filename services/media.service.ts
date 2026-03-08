import { ID } from "appwrite";
import { storage } from "@/lib/appwrite";

const BUCKET_ID = "trip_bucket_id";

export const mediaService = {
  /**
   * Upload an image to the Appwrite storage bucket.
   */
  async uploadImage(
    file: File,
    onProgress?: (progress: { progress: number }) => void
  ) {
    try {
      // Pass an empty array for permissions to use bucket-level permissions
      const response = await storage.createFile(
        BUCKET_ID,
        ID.unique(),
        file,
        [], // Empty array means use bucket-level permissions
        onProgress as any
      );
      return response.$id;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  /**
   * Delete an image from the storage bucket.
   */
  async deleteImage(fileId: string) {
    try {
      await storage.deleteFile(BUCKET_ID, fileId);
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  },

  /**
   * Get an optimized preview URL for an image.
   * Note: The Appwrite Free plan does not support the preview endpoint.
   * Falling back to the direct view URL to prevent 403 Forbidden errors.
   */
  getImagePreview(fileId: string): string {
    return storage.getFileView(BUCKET_ID, fileId).toString();
  },

  /**
   * Get the direct download/view URL for an image.
   * Falls back to this if preview isn't desired.
   */
  getImageUrl(fileId: string): string {
    return storage.getFileView(BUCKET_ID, fileId).toString();
  },
};
