import { Models } from "appwrite";

export interface TripChecklist extends Models.Document {
  tripId: string;
  title: string;
  createdBy: string;
  createdAt: string;
  order: number;
}

export interface ChecklistItem extends Models.Document {
  checklistId: string;
  text: string;
  order: number;
  createdBy: string;
  createdAt: string;
}

export interface ChecklistItemCompletion extends Models.Document {
  itemId: string;
  userId: string;
  completed: boolean;
  completedAt: string;
}
