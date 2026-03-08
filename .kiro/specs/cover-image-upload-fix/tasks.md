# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - File Upload Bucket Mismatch
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to concrete failing cases - file uploads when BUCKET_ID is "trip-media" but actual bucket is "trip_images"
  - Test that mediaService.uploadImage() fails when BUCKET_ID is "trip-media" and bucket "trip_images" exists
  - Test trip cover file upload, day cover file upload, and activity image file upload
  - The test assertions should verify successful upload to "trip_images" bucket (this is the expected behavior)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS with "Bucket with the requested ID could not be found" or similar error
  - Document counterexamples found (e.g., "uploadImage(testFile) throws bucket not found error")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - URL Upload and Display Behavior
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (URL uploads, image display, previews, deletion)
  - Write property-based tests capturing observed behavior patterns:
    - URL-based uploads work correctly and bypass media service
    - Image display works for both file IDs and URLs
    - Image preview generation works with getImagePreview()
    - Image deletion works for existing uploaded files
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix for cover image upload bucket mismatch
  - [x] 3.1 Implement the fix
    - Update BUCKET_ID constant in services/media.service.ts from "trip-media" to "trip_images"
    - Verify the bucket ID matches exactly what exists in the Appwrite project (case-sensitive)
    - _Bug_Condition: isBugCondition(input) where input.uploadMethod === 'file-upload' AND NOT bucketExists('trip-media') AND bucketExists('trip_images') AND mediaService.BUCKET_ID === 'trip-media'_
    - _Expected_Behavior: For any file upload operation, the fixed mediaService SHALL successfully upload the file to the "trip_images" bucket and return a valid file ID_
    - _Preservation: URL-based uploads, image display, image previews, and image deletion SHALL produce exactly the same behavior as the original code_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - File Upload Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed and file uploads work)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - URL Upload and Display Behavior
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in URL uploads, display, previews, deletion)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
