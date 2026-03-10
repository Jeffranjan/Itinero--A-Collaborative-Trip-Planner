"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import ReactECharts from "echarts-for-react";
import { toast } from "sonner";
import {
  motion,
  AnimatePresence,
  useSpring,
  useTransform,
} from "framer-motion";

import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetService } from "@/services/budget.service";
import { memberService } from "@/services/member.service";
import { Expense, ExpenseSplit } from "@/types/expense";
import { Trip } from "@/types/trip";
import { formatCurrency } from "@/lib/currency";
import { calculateSplit } from "@/utils/calculateSplit";
import { calculateSettlements } from "@/utils/calculateSettlements";

import { CreateExpenseModal } from "./CreateExpenseModal";
import { ExpenseCard } from "./ExpenseCard";

interface TripMemberInfo {
  userId: string;
  name?: string;
  role: string;
}

interface BudgetTabProps {
  trip: Trip;
  currentUserId: string;
  isOwnerOrEditor: boolean;
}

function AnimatedCurrency({
  value,
  currency,
}: {
  value: number;
  currency?: string;
}) {
  const spring = useSpring(0, { bounce: 0, duration: 1500 });
  const display = useTransform(spring, (current) =>
    formatCurrency(current, currency)
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

export function BudgetTab({
  trip,
  currentUserId,
  isOwnerOrEditor,
}: BudgetTabProps) {
  const queryClient = useQueryClient();

  // Hydration guard: prevent calculations before trip data is available
  if (!trip?.$id) return null;

  const { data: members = [], isLoading: isLoadingMembers } = useQuery({
    queryKey: ["tripMembers", trip.$id],
    queryFn: async () => {
      const tripMembers = await memberService.getTripMembers(trip.$id);
      return tripMembers as unknown as TripMemberInfo[];
    },
  });

  const { data: expensesData, isLoading: isLoadingExpenses } = useQuery({
    queryKey: ["tripExpenses", trip.$id],
    queryFn: async () => {
      const tripExpenses = await budgetService.getTripExpenses(trip.$id);
      const allSplits: ExpenseSplit[] = [];
      await Promise.all(
        tripExpenses.map(async (exp) => {
          const expSplits = await budgetService.getExpenseSplits(exp.$id);
          allSplits.push(...expSplits);
        })
      );
      return { expenses: tripExpenses, splits: allSplits };
    },
  });

  const expenses = useMemo(
    () => expensesData?.expenses || [],
    [expensesData?.expenses]
  );
  const splits = useMemo(
    () => expensesData?.splits || [],
    [expensesData?.splits]
  );
  const isLoading = isLoadingMembers || isLoadingExpenses;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);

  // Delete mutation with optimistic UI and 404-safe error handling
  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => budgetService.deleteExpense(expenseId),
    onMutate: async (expenseId: string) => {
      await queryClient.cancelQueries({
        queryKey: ["tripExpenses", trip.$id],
      });

      const previousData = queryClient.getQueryData(["tripExpenses", trip.$id]);

      // Optimistic removal
      queryClient.setQueryData(
        ["tripExpenses", trip.$id],
        (old: typeof expensesData) => {
          if (!old) return old;
          return {
            expenses: old.expenses.filter(
              (exp: Expense) => exp.$id !== expenseId
            ),
            splits: old.splits.filter(
              (s: ExpenseSplit) => s.expenseId !== expenseId
            ),
          };
        }
      );

      return { previousData };
    },
    onError: (error: any, _expenseId, context) => {
      // If 404, the expense was already deleted (e.g., by a collaborator) — that's OK
      if (error?.code === 404 || error?.message?.includes("not be found")) {
        console.warn("Expense already removed by collaborator");
        return;
      }

      // Rollback optimistic update on real errors
      if (context?.previousData) {
        queryClient.setQueryData(
          ["tripExpenses", trip.$id],
          context.previousData
        );
      }
      toast.error("Failed to delete expense");
    },
    onSuccess: () => {
      toast.success("Expense deleted");
      queryClient.invalidateQueries({ queryKey: ["tripExpenses", trip.$id] });
    },
  });

  const handleDelete = (expenseId: string) => {
    deleteMutation.mutate(expenseId);
  };

  // Called when CreateExpenseModal successfully creates or updates an expense
  const handleExpenseChange = () => {
    queryClient.invalidateQueries({ queryKey: ["tripExpenses", trip.$id] });
  };

  // Use centralized split calculation helper
  const summary = useMemo(
    () => calculateSplit(expenses, splits, members, currentUserId),
    [expenses, splits, members, currentUserId]
  );

  const chartData = useMemo(() => {
    return Object.entries(summary.categoryTotals).map(([name, value]) => ({
      name,
      value,
    }));
  }, [summary.categoryTotals]);

  const chartOptions = {
    tooltip: {
      trigger: "item",
      formatter: (params: any) =>
        `${params.name}: ${formatCurrency(params.value, trip.currency)}`,
    },
    animationDuration: 1500,
    animationEasing: "cubicOut",
    series: [
      {
        name: "Spent",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#1a1a1a",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        data: chartData,
      },
    ],
    color: ["#ff4500", "#ff8c00", "#1e90ff", "#32cd32", "#8a2be2", "#ff1493"],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-accent-orange" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative z-10 flex items-center gap-3 text-gray-400">
            <Wallet className="h-5 w-5 text-blue-400 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="text-sm font-medium">Trip Total</h3>
          </div>
          <p className="relative z-10 mt-4 text-3xl font-bold text-white">
            <AnimatedCurrency value={summary.total} currency={trip.currency} />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative z-10 flex items-center gap-3 text-gray-400">
            <TrendingUp className="h-5 w-5 text-emerald-400 transition-transform duration-300 group-hover:scale-110" />
            <h3 className="text-sm font-medium">You Paid</h3>
          </div>
          <p className="relative z-10 mt-4 text-3xl font-bold text-white">
            <AnimatedCurrency
              value={summary.totalPaid}
              currency={trip.currency}
            />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-orange/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative z-10 flex items-center gap-3 text-gray-400">
            <TrendingDown className="h-5 w-5 text-accent-orange transition-transform duration-300 group-hover:scale-110" />
            <h3 className="text-sm font-medium">Your Share</h3>
          </div>
          <p className="relative z-10 mt-4 text-3xl font-bold text-white">
            <AnimatedCurrency
              value={summary.totalOwed}
              currency={trip.currency}
            />
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-6 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <div className="relative z-10 flex items-center gap-3 text-gray-400">
            <RefreshCcw className="h-5 w-5 text-purple-400 transition-transform duration-300 group-hover:rotate-180" />
            <h3 className="text-sm font-medium">Balance</h3>
          </div>
          <p
            className={`relative z-10 mt-4 text-3xl font-bold ${
              summary.userBalance > 0
                ? "text-emerald-400"
                : summary.userBalance < 0
                  ? "text-accent-orange"
                  : "text-white"
            }`}
          >
            {summary.userBalance > 0 ? "+" : ""}
            <AnimatedCurrency
              value={summary.userBalance}
              currency={trip.currency}
            />
          </p>
        </motion.div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Expense List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Expenses</h2>
            {isOwnerOrEditor && (
              <Button
                onClick={() => {
                  setExpenseToEdit(null);
                  setIsModalOpen(true);
                }}
                className="hover:bg-accent-red bg-accent-orange text-white"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {expenses.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center text-gray-400"
                >
                  No expenses added yet. Start tracking your costs!
                </motion.div>
              ) : (
                expenses.map((expense) => {
                  const expenseSplits = splits.filter(
                    (s) => s.expenseId === expense.$id
                  );
                  const mySplit = expenseSplits.find(
                    (s) => s.userId === currentUserId
                  );

                  return (
                    <ExpenseCard
                      key={expense.$id}
                      expense={expense}
                      members={members}
                      currentUserId={currentUserId}
                      onEdit={(expense) => {
                        setExpenseToEdit(expense);
                        setIsModalOpen(true);
                      }}
                      onDelete={handleDelete}
                      isDeleting={
                        deleteMutation.isPending &&
                        deleteMutation.variables === expense.$id
                      }
                      canEdit={isOwnerOrEditor}
                      userShare={mySplit ? mySplit.amountOwed : null}
                      currency={trip.currency}
                    />
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Charts */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Categories</h2>
          <div className="rounded-2xl border border-white/5 bg-white/5 p-6 shadow-xl">
            {chartData.length > 0 ? (
              <ReactECharts
                option={chartOptions}
                style={{ height: "250px" }}
                opts={{ renderer: "svg" }}
              />
            ) : (
              <div className="flex h-[250px] items-center justify-center text-sm text-gray-500">
                No data to display
              </div>
            )}

            {chartData.length > 0 && (
              <motion.div
                initial="initial"
                animate="animate"
                variants={{
                  animate: {
                    transition: { staggerChildren: 0.1, delayChildren: 0.5 },
                  },
                }}
                className="mt-4 space-y-2"
              >
                {chartData.map((d, i) => (
                  <motion.div
                    key={d.name}
                    variants={{
                      initial: { opacity: 0, x: -10 },
                      animate: { opacity: 1, x: 0 },
                    }}
                    className="group flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 text-gray-300 transition-colors group-hover:text-white">
                      <div
                        className="h-3 w-3 rounded-full shadow-sm"
                        style={{
                          backgroundColor:
                            chartOptions.color[i % chartOptions.color.length],
                        }}
                      />
                      <span className="capitalize">{d.name}</span>
                    </div>
                    <span className="font-medium text-white">
                      {formatCurrency(d.value, trip.currency)}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Settle Up Section */}
      {(() => {
        const settlements = calculateSettlements(summary.balances);
        if (settlements.length === 0) return null;

        const getName = (userId: string) => {
          if (userId === currentUserId) return "You";
          const member = members.find((m) => m.userId === userId);
          return member?.name || "Unknown";
        };

        return (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-white">Settle Up</h2>
            <div className="space-y-3">
              {settlements.map((s, i) => (
                <motion.div
                  key={`${s.fromUserId}-${s.toUserId}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-orange/20 text-sm font-bold text-accent-orange">
                      {getName(s.fromUserId).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">
                        <span className="font-medium text-white">
                          {getName(s.fromUserId)}
                        </span>
                        {" owes "}
                        <span className="font-medium text-white">
                          {getName(s.toUserId)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-accent-orange">
                    {formatCurrency(s.amount, trip.currency)}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        );
      })()}

      <CreateExpenseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setExpenseToEdit(null);
        }}
        onSuccess={handleExpenseChange}
        trip={trip}
        members={members}
        currentUserId={currentUserId}
        expenseToEdit={expenseToEdit}
        initialSplits={
          expenseToEdit
            ? splits
                .filter((s) => s.expenseId === expenseToEdit.$id)
                .map((s) => s.userId)
            : undefined
        }
      />
    </div>
  );
}
