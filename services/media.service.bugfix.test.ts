/**
 * Bug Condition Exploration Test for Cover Image Upload Fix
 *
 * **CRITICAL**: This test is EXPECTED TO FAIL on unfixed code.
 * The failure confirms that the bug exists (bucket ID mismatch).
 *
 * **Validates: Requirements 2.1, 2.2, 2.3**
 *
 * This test encodes the EXPECTED behavior after the fix:
 * - File uploads should succeed when using the correct bucket ID "trip_bucket_id"
 * - The media service should successfully upload files to Appwrite storage
 * - Uploaded files should be retrievable using the returned file ID
 */

import { describe, it, expect } from "vitest";
import { mediaService } from "./media.service";
import { storage } from "@/lib/appwrite";

describe("Bug Condition Exploration: File Upload Bucket Mismatch", () => {
  /**
   * Property 1: Bug Condition - File Upload Bucket Mismatch
   *
   * **Validates: Requirements 2.1, 2.2, 2.3**
   *
   * This property tests that file uploads work correctly when the bucket exists.
   * On UNFIXED code, this will FAIL because BUCKET_ID is "trip-media" but
   * the actual bucket is "trip_bucket_id".
   *
   * Expected error on unfixed code: "Bucket with the requested ID could not be found"
   */

  it("Property 1: Trip cover file upload should succeed with correct bucket", async () => {
    // Create a minimal valid image file for testing
    const createTestImageFile = (name: string): File => {
      // Create a minimal 1x1 PNG image (base64 encoded)
      const pngData =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const binaryString = atob(pngData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/png" });
      return new File([blob], name, { type: "image/png" });
    };

    const testFile = createTestImageFile("trip-cover.png");

    // Attempt to upload the file
    // On UNFIXED code: This will throw "Bucket with the requested ID could not be found"
    // On FIXED code: This will succeed and return a file ID
    const fileId = await mediaService.uploadImage(testFile);

    // Verify the upload succeeded
    expect(fileId).toBeDefined();
    expect(fileId).not.toBe("");
    expect(typeof fileId).toBe("string");

    // Verify we can retrieve the file from the correct bucket
    // This confirms the file was uploaded to "trip_bucket_id" bucket
    const fileView = storage.getFileView("trip_bucket_id", fileId);
    expect(fileView).toBeDefined();

    // Clean up: delete the test file
    await mediaService.deleteImage(fileId);
  }, 30000); // 30 second timeout for network operations

  it("Property 1: Day cover file upload should succeed with correct bucket", async () => {
    const createTestImageFile = (name: string): File => {
      const pngData =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const binaryString = atob(pngData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/png" });
      return new File([blob], name, { type: "image/png" });
    };

    const testFile = createTestImageFile("day-cover.png");

    // On UNFIXED code: This will fail with bucket not found error
    // On FIXED code: This will succeed
    const fileId = await mediaService.uploadImage(testFile);

    expect(fileId).toBeDefined();
    expect(fileId).not.toBe("");

    // Verify file exists in correct bucket
    const fileView = storage.getFileView("trip_bucket_id", fileId);
    expect(fileView).toBeDefined();

    await mediaService.deleteImage(fileId);
  }, 30000);

  it("Property 1: Activity image file upload should succeed with correct bucket", async () => {
    const createTestImageFile = (name: string): File => {
      const pngData =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const binaryString = atob(pngData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/png" });
      return new File([blob], name, { type: "image/png" });
    };

    const testFile = createTestImageFile("activity-image.png");

    // On UNFIXED code: This will fail with bucket not found error
    // On FIXED code: This will succeed
    const fileId = await mediaService.uploadImage(testFile);

    expect(fileId).toBeDefined();
    expect(fileId).not.toBe("");

    // Verify file exists in correct bucket
    const fileView = storage.getFileView("trip_bucket_id", fileId);
    expect(fileView).toBeDefined();

    await mediaService.deleteImage(fileId);
  }, 30000);

  it("Property 1: Multiple file uploads should all succeed with correct bucket", async () => {
    const createTestImageFile = (name: string): File => {
      const pngData =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
      const binaryString = atob(pngData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "image/png" });
      return new File([blob], name, { type: "image/png" });
    };

    const fileIds: string[] = [];

    try {
      // Upload 3 files in sequence
      for (let i = 0; i < 3; i++) {
        const testFile = createTestImageFile(`test-image-${i}.png`);

        // On UNFIXED code: All uploads will fail
        // On FIXED code: All uploads will succeed
        const fileId = await mediaService.uploadImage(testFile);

        expect(fileId).toBeDefined();
        expect(fileId).not.toBe("");
        fileIds.push(fileId);
      }

      // Verify all files exist in correct bucket
      for (const fileId of fileIds) {
        const fileView = storage.getFileView("trip_bucket_id", fileId);
        expect(fileView).toBeDefined();
      }
    } finally {
      // Clean up all uploaded files
      for (const fileId of fileIds) {
        try {
          await mediaService.deleteImage(fileId);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  }, 60000); // 60 second timeout for multiple uploads
});
