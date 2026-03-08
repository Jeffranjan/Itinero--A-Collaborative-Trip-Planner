import { Models } from "appwrite";

export interface TripFile extends Models.Document {
  tripId: string;
  fileId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
}
