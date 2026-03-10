import { Expense, ExpenseSplit } from "@/types/expense";

interface MemberInfo {
  userId: string;
}

interface SplitResult {
  total: number;
  balances: {
    userId: string;
    paid: number;
    share: number;
    balance: number;
  }[];
  categoryTotals: Record<string, number>;
}

/**
 * Centralized expense split calculations.
 * Computes totals, per-user paid/owed, balances, and category breakdowns.
 */
export function calculateSplit(
  expenses: Expense[],
  splits: ExpenseSplit[],
  members: MemberInfo[],
  currentUserId: string
): SplitResult & { totalPaid: number; totalOwed: number; userBalance: number } {
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const safeSplits = Array.isArray(splits) ? splits : [];
  const safeMembers = Array.isArray(members) ? members : [];

  // Return safe defaults when data hasn't loaded yet
  if (safeExpenses.length === 0 && safeMembers.length === 0) {
    return {
      total: 0,
      totalPaid: 0,
      totalOwed: 0,
      userBalance: 0,
      balances: [],
      categoryTotals: {},
    };
  }

  let total = 0;
  let totalPaid = 0;
  let totalOwed = 0;
  const categoryTotals: Record<string, number> = {};
  const paidMap: Record<string, number> = {};
  const shareMap: Record<string, number> = {};

  safeMembers.forEach((m) => {
    paidMap[m.userId] = 0;
    shareMap[m.userId] = 0;
  });

  safeExpenses.forEach((exp) => {
    total += exp.amount;

    if (exp.paidBy === currentUserId) {
      totalPaid += exp.amount;
    }

    paidMap[exp.paidBy] = (paidMap[exp.paidBy] || 0) + exp.amount;

    categoryTotals[exp.category] =
      (categoryTotals[exp.category] || 0) + exp.amount;
  });

  safeSplits.forEach((split) => {
    shareMap[split.userId] = (shareMap[split.userId] || 0) + split.amountOwed;
    if (split.userId === currentUserId) {
      totalOwed += split.amountOwed;
    }
  });

  const balances = safeMembers.map((member) => {
    const paid = paidMap[member.userId] || 0;
    const share = shareMap[member.userId] || 0;
    return {
      userId: member.userId,
      paid,
      share,
      balance: paid - share,
    };
  });

  return {
    total,
    totalPaid,
    totalOwed,
    userBalance: totalPaid - totalOwed,
    balances,
    categoryTotals,
  };
}
