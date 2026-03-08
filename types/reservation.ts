import { Models } from "appwrite";

export type ReservationType =
  | "flight"
  | "hotel"
  | "train"
  | "car"
  | "activity"
  | "restaurant"
  | "other";

export interface TripReservation extends Models.Document {
  tripId: string;
  type: ReservationType;
  title: string;
  location?: string;
  reservationNumber?: string;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}
