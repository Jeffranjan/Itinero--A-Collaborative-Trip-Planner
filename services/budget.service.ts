import { ID, Query } from "appwrite";
import { databases } from "@/lib/appwrite";
import { CreateExpensePayload, Expense, ExpenseSplit } from "@/types/expense";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const EXPENSES_COLLECTION = "trip_expenses";
const EXPENSE_SPLITS_COLLECTION = "expense_splits";

export const budgetService = {
  /**
   * Creates a new expense and automatically calculates & generates splits
   */
  async createExpense(
    payload: CreateExpensePayload,
    userId: string
  ): Promise<{ expense: Expense; splits: ExpenseSplit[] }> {
    try {
      const { splitBetween, ...expenseData } = payload;

      // 1. Create the expense document
      const expense = await databases.createDocument<Expense>(
        DATABASE_ID,
        EXPENSES_COLLECTION,
        ID.unique(),
        {
          ...expenseData,
          currency: expenseData.currency || "USD",
          createdBy: userId,
          createdAt: new Date().toISOString(),
        }
      );

      // 2. Calculate split amounts
      const splitAmount = expenseData.amount / splitBetween.length;
      const splits: ExpenseSplit[] = [];

      // 3. Create expense splits
      for (const splitUserId of splitBetween) {
        const split = await databases.createDocument<ExpenseSplit>(
          DATABASE_ID,
          EXPENSE_SPLITS_COLLECTION,
          ID.unique(),
          {
            expenseId: expense.$id,
            userId: splitUserId,
            amountOwed: splitAmount,
          }
        );
        splits.push(split);
      }

      return { expense, splits };
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  },

  /**
   * Fetches all expenses for a specific trip
   */
  async getTripExpenses(tripId: string): Promise<Expense[]> {
    try {
      const expenses = await databases.listDocuments<Expense>(
        DATABASE_ID,
        EXPENSES_COLLECTION,
        [Query.equal("tripId", tripId), Query.orderDesc("$createdAt")]
      );
      return expenses.documents;
    } catch (error) {
      console.error("Error fetching trip expenses:", error);
      throw error;
    }
  },

  /**
   * Fetches splits for a specific expense
   */
  async getExpenseSplits(expenseId: string): Promise<ExpenseSplit[]> {
    try {
      const splits = await databases.listDocuments<ExpenseSplit>(
        DATABASE_ID,
        EXPENSE_SPLITS_COLLECTION,
        [Query.equal("expenseId", expenseId)]
      );
      return splits.documents;
    } catch (error) {
      console.error("Error fetching expense splits:", error);
      throw error;
    }
  },

  /**
   * Deletes an expense and its associated splits
   */
  async deleteExpense(expenseId: string): Promise<void> {
    try {
      // 1. Find and delete all associated splits
      const splits = await this.getExpenseSplits(expenseId);
      for (const split of splits) {
        await databases.deleteDocument(
          DATABASE_ID,
          EXPENSE_SPLITS_COLLECTION,
          split.$id
        );
      }

      // 2. Delete the expense itself
      await databases.deleteDocument(
        DATABASE_ID,
        EXPENSES_COLLECTION,
        expenseId
      );
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  },

  /**
   * Updates an expense
   */
  async updateExpense(
    expenseId: string,
    data: Partial<CreateExpensePayload>
  ): Promise<{ expense: Expense; splits: ExpenseSplit[] }> {
    try {
      const { splitBetween, ...updateData } = data;

      // 1. Update the main expense document
      const expense = await databases.updateDocument<Expense>(
        DATABASE_ID,
        EXPENSES_COLLECTION,
        expenseId,
        updateData
      );

      let splits: ExpenseSplit[] = [];

      // 2. If splitBetween and amount are provided, we should recalculate and recreate splits
      if (splitBetween && updateData.amount !== undefined) {
        // Delete old splits
        const oldSplits = await this.getExpenseSplits(expenseId);
        for (const split of oldSplits) {
          await databases.deleteDocument(
            DATABASE_ID,
            EXPENSE_SPLITS_COLLECTION,
            split.$id
          );
        }

        // Create new splits
        const splitAmount = updateData.amount / splitBetween.length;
        for (const splitUserId of splitBetween) {
          const split = await databases.createDocument<ExpenseSplit>(
            DATABASE_ID,
            EXPENSE_SPLITS_COLLECTION,
            ID.unique(),
            {
              expenseId: expense.$id,
              userId: splitUserId,
              amountOwed: splitAmount,
            }
          );
          splits.push(split);
        }
      } else {
        // Keep existing splits if no split details were changed
        splits = await this.getExpenseSplits(expenseId);
      }

      return { expense, splits };
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  },
};
