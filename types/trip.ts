import { Models } from "appwrite";

export interface Trip extends Models.Document {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  coverImage?: string;
  coverImageId?: string;
  createdBy: string;
  currency?: string;
}

export interface TripMember extends Models.Document {
  tripId: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
}

export interface TripDay extends Models.Document {
  tripId: string;
  date: string;
  orderIndex: number;
  notes?: string;
  title?: string;
  coverImageId?: string;
  coverImage?: string;
}

export type CreateTripInput = {
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  coverImageId?: string;
  coverImage?: string;
  currency?: string;
};

export interface TripActivity extends Models.Document {
  dayId: string;
  tripId: string;
  title: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  orderIndex: number;
  imageIds?: string[];
  imageUrls?: string[];
}

export type CreateActivityInput = {
  dayId: string;
  tripId: string;
  title: string;
  description?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  orderIndex: number;
  imageIds?: string[];
  imageUrls?: string[];
};
