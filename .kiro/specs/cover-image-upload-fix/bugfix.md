# Bugfix Requirements Document

## Introduction

Users are unable to add cover images to trips using the URL input method in the ImageUploadModal. When clicking the "Add URL" button after entering an image URL, the operation fails immediately with the error message "Failed to update cover image".

The user has created an Appwrite storage bucket named "trip_images" (ID: "trip_images") with proper CRUD permissions, but the application code is not configured to use this bucket. Additionally, there is a mismatch between the bucket ID expected by the code ("trip-media") and the actual bucket created by the user ("trip_images").

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user enters an image URL in the cover image upload modal and clicks "Add URL" THEN the system displays "Failed to update cover image" error immediately

1.2 WHEN the media service attempts to upload files THEN the system uses the hardcoded bucket ID "trip-media" which does not exist

1.3 WHEN the application tries to interact with Appwrite storage THEN the system fails because the configured bucket ID does not match the actual bucket created by the user

### Expected Behavior (Correct)

2.1 WHEN a user enters a valid image URL in the cover image upload modal and clicks "Add URL" THEN the system SHALL successfully update the trip's cover image with the provided URL

2.2 WHEN the media service attempts to upload files THEN the system SHALL use the correct bucket ID "trip_images" that exists in the Appwrite project

2.3 WHEN the application interacts with Appwrite storage THEN the system SHALL successfully connect to the "trip_images" bucket and perform storage operations

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user uploads a cover image via file upload (drag-and-drop or file picker) THEN the system SHALL CONTINUE TO upload the file to Appwrite storage and store the file ID

3.2 WHEN a trip has an existing cover image (either URL or file ID) THEN the system SHALL CONTINUE TO display the cover image correctly

3.3 WHEN a user changes an existing cover image THEN the system SHALL CONTINUE TO replace the old cover image reference with the new one

3.4 WHEN a user uploads images to activities or day covers THEN the system SHALL CONTINUE TO use the same storage bucket configuration
