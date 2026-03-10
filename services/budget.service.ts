import { ID, Query } from "appwrite";
import { databases } from "@/lib/appwrite";
import { CreateExpensePayload, Expense, ExpenseSplit } from "@/types/expense";

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const EXPENSES_COLLECTION = "trip_expenses";
const EXPENSE_SPLITS_COLLECTION = "expense_splits";

/** Round to 2 decimal places to avoid floating-point precision issues */
function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export const budgetService = {
  async createExpense(
    payload: CreateExpensePayload,
    userId: string
  ): Promise<{ expense: Expense; splits: ExpenseSplit[] }> {
    try {
      const { splitBetween, ...expenseData } = payload;

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

      const splitAmount = roundCurrency(
        expenseData.amount / splitBetween.length
      );
      const splits: ExpenseSplit[] = [];

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

  async getTripExpenses(tripId: string): Promise<Expense[]> {
    try {
      const expenses = await databases.listDocuments<Expense>(
        DATABASE_ID,
        EXPENSES_COLLECTION,
        [Query.equal("tripId", tripId), Query.orderDesc("$createdAt")]
      );
      return expenses?.documents ?? [];
    } catch (error) {
      console.error("Error fetching trip expenses:", error);
      return [];
    }
  },

  async getExpenseSplits(expenseId: string): Promise<ExpenseSplit[]> {
    try {
      const splits = await databases.listDocuments<ExpenseSplit>(
        DATABASE_ID,
        EXPENSE_SPLITS_COLLECTION,
        [Query.equal("expenseId", expenseId)]
      );
      return splits?.documents ?? [];
    } catch (error) {
      console.error("Error fetching expense splits:", error);
      return [];
    }
  },

  async deleteExpense(expenseId: string): Promise<void> {
    try {
      const splits = await this.getExpenseSplits(expenseId);
      for (const split of splits) {
        await databases.deleteDocument(
          DATABASE_ID,
          EXPENSE_SPLITS_COLLECTION,
          split.$id
        );
      }

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

  async updateExpense(
    expenseId: string,
    data: Partial<CreateExpensePayload>
  ): Promise<{ expense: Expense; splits: ExpenseSplit[] }> {
    try {
      const { splitBetween, ...updateData } = data;

      const expense = await databases.updateDocument<Expense>(
        DATABASE_ID,
        EXPENSES_COLLECTION,
        expenseId,
        updateData
      );

      let splits: ExpenseSplit[] = [];

      // Recalculate splits if split members or amount changed
      if (splitBetween && updateData.amount !== undefined) {
        const oldSplits = await this.getExpenseSplits(expenseId);
        for (const split of oldSplits) {
          await databases.deleteDocument(
            DATABASE_ID,
            EXPENSE_SPLITS_COLLECTION,
            split.$id
          );
        }

        const splitAmount = roundCurrency(
          updateData.amount / splitBetween.length
        );
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
        splits = await this.getExpenseSplits(expenseId);
      }

      return { expense, splits };
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  },
};
