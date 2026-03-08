import { Models } from "appwrite";

export type ExpenseCategory =
  | "transport"
  | "accommodation"
  | "food"
  | "activities"
  | "shopping"
  | "other";

export interface Expense extends Models.Document {
  tripId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory | string;
  paidBy: string; // userId of the payer
  date: string; // ISO date string
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface ExpenseSplit extends Models.Document {
  expenseId: string;
  userId: string;
  amountOwed: number;
}

export interface CreateExpensePayload {
  tripId: string;
  title: string;
  amount: number;
  currency?: string;
  category: ExpenseCategory | string;
  paidBy: string;
  date: string;
  notes?: string;
  splitBetween: string[]; // User IDs to split the expense evenly
}
