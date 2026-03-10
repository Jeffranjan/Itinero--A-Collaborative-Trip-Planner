import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Receipt, Users, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { budgetService } from "@/services/budget.service";
import {
  ExpenseCategory,
  Expense,
  ExpenseSplit,
  CreateExpensePayload,
} from "@/types/expense";
import { Trip } from "@/types/trip";
import { getCurrencySymbol } from "@/lib/currency";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface TripMemberInfo {
  userId: string;
  name?: string;
  role: string;
}

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  trip: Trip;
  members: TripMemberInfo[];
  currentUserId: string;
  expenseToEdit?: Expense | null;
  initialSplits?: string[];
}

const CATEGORIES: { label: string; value: ExpenseCategory }[] = [
  { label: "Transport", value: "transport" },
  { label: "Accommodation", value: "accommodation" },
  { label: "Food & Drinks", value: "food" },
  { label: "Activities", value: "activities" },
  { label: "Shopping", value: "shopping" },
  { label: "Other", value: "other" },
];

export function CreateExpenseModal({
  isOpen,
  onClose,
  onSuccess,
  trip,
  members,
  currentUserId,
  expenseToEdit,
  initialSplits,
}: CreateExpenseModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [date, setDate] = useState("");
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitBetween, setSplitBetween] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  // Create mutation with optimistic UI
  const createMutation = useMutation({
    mutationFn: (payload: { data: CreateExpensePayload; userId: string }) =>
      budgetService.createExpense(payload.data, payload.userId),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: ["tripExpenses", trip.$id],
      });

      const previousData = queryClient.getQueryData(["tripExpenses", trip.$id]);

      // Build optimistic expense and splits
      const tempId = `temp-${Date.now()}`;
      const splitAmount =
        Math.round(
          (payload.data.amount / payload.data.splitBetween.length) * 100
        ) / 100;

      const optimisticExpense = {
        $id: tempId,
        $collectionId: "",
        $databaseId: "",
        $createdAt: new Date().toISOString(),
        $updatedAt: new Date().toISOString(),
        $permissions: [],
        ...payload.data,
        createdBy: payload.userId,
        createdAt: new Date().toISOString(),
      } as unknown as Expense;

      const optimisticSplits = payload.data.splitBetween.map(
        (userId, i) =>
          ({
            $id: `${tempId}-split-${i}`,
            $collectionId: "",
            $databaseId: "",
            $createdAt: new Date().toISOString(),
            $updatedAt: new Date().toISOString(),
            $permissions: [],
            expenseId: tempId,
            userId,
            amountOwed: splitAmount,
          }) as unknown as ExpenseSplit
      );

      queryClient.setQueryData(
        ["tripExpenses", trip.$id],
        (old: { expenses: Expense[]; splits: ExpenseSplit[] } | undefined) => {
          const prev = old || { expenses: [], splits: [] };
          return {
            expenses: [optimisticExpense, ...prev.expenses],
            splits: [...prev.splits, ...optimisticSplits],
          };
        }
      );

      return { previousData };
    },
    onError: (_error, _payload, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ["tripExpenses", trip.$id],
          context.previousData
        );
      }
      toast.error("Failed to add expense");
    },
    onSuccess: () => {
      toast.success("Expense added successfully");
      onSuccess?.();
      onClose();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tripExpenses", trip.$id] });
    },
  });

  // Update mutation with optimistic UI
  const updateMutation = useMutation({
    mutationFn: (payload: {
      expenseId: string;
      data: Partial<CreateExpensePayload>;
    }) => budgetService.updateExpense(payload.expenseId, payload.data),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({
        queryKey: ["tripExpenses", trip.$id],
      });

      const previousData = queryClient.getQueryData(["tripExpenses", trip.$id]);

      // Optimistically patch the expense in cache
      queryClient.setQueryData(
        ["tripExpenses", trip.$id],
        (old: { expenses: Expense[]; splits: ExpenseSplit[] } | undefined) => {
          if (!old) return old;
          return {
            expenses: old.expenses.map((exp) =>
              exp.$id === payload.expenseId ? { ...exp, ...payload.data } : exp
            ),
            splits: old.splits,
          };
        }
      );

      return { previousData };
    },
    onError: (_error, _payload, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ["tripExpenses", trip.$id],
          context.previousData
        );
      }
      toast.error("Failed to update expense");
    },
    onSuccess: () => {
      toast.success("Expense updated successfully");
      onSuccess?.();
      onClose();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tripExpenses", trip.$id] });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Initialize defaults when modal opens
  useEffect(() => {
    if (isOpen) {
      if (expenseToEdit) {
        setTitle(expenseToEdit.title);
        setAmount(expenseToEdit.amount);
        setCategory(expenseToEdit.category as ExpenseCategory);
        setDate(new Date(expenseToEdit.date).toISOString().split("T")[0]);
        setPaidBy(expenseToEdit.paidBy);
        setSplitBetween(initialSplits || members.map((m) => m.userId));
        setNotes(expenseToEdit.notes || "");
      } else {
        setTitle("");
        setAmount("");
        setCategory("food");
        setDate(new Date().toISOString().split("T")[0]);
        setPaidBy(currentUserId);
        setSplitBetween(members.map((m) => m.userId));
        setNotes("");
      }
    }
  }, [isOpen, currentUserId, members, expenseToEdit, initialSplits]);

  const toggleSplitUser = (userId: string) => {
    setSplitBetween((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !amount || amount <= 0 || splitBetween.length === 0) {
      toast.error(
        "Please fill required fields and select at least one person to split with."
      );
      return;
    }

    const expenseData = {
      title: title.trim(),
      amount: Number(amount),
      currency: trip.currency || "INR",
      category,
      paidBy,
      date: new Date(date).toISOString(),
      notes: notes.trim(),
      splitBetween,
    };

    if (expenseToEdit) {
      updateMutation.mutate({
        expenseId: expenseToEdit.$id,
        data: expenseData,
      });
    } else {
      createMutation.mutate({
        data: { ...expenseData, tripId: trip.$id },
        userId: currentUserId,
      });
    }
  };

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto px-4 pb-8 pt-24 font-[family-name:var(--font-geist-sans)]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-card-dark shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-orange/20 text-accent-orange">
                  <Receipt className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {expenseToEdit ? "Edit Expense" : "Add Expense"}
                  </h2>
                  <p className="text-xs text-gray-400">
                    {expenseToEdit
                      ? "Update expense details"
                      : "Track and split costs"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                {/* Title & Amount */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Description
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Dinner, Taxi, etc."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-orange focus:outline-none focus:ring-1 focus:ring-accent-orange"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Amount ({getCurrencySymbol(trip.currency)})
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-2.5 text-gray-500">
                        {getCurrencySymbol(trip.currency)}
                      </span>
                      <input
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) =>
                          setAmount(Number(e.target.value) || "")
                        }
                        className="w-full rounded-xl border border-white/10 bg-black/20 py-2.5 pl-8 pr-4 text-white placeholder-gray-500 focus:border-accent-orange focus:outline-none focus:ring-1 focus:ring-accent-orange"
                      />
                    </div>
                  </div>
                </div>

                {/* Category & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) =>
                        setCategory(e.target.value as ExpenseCategory)
                      }
                      className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-white focus:border-accent-orange focus:outline-none focus:ring-1 focus:ring-accent-orange"
                    >
                      {CATEGORIES.map((c) => (
                        <option
                          key={c.value}
                          value={c.value}
                          className="bg-neutral-800 text-white"
                        >
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Date
                    </label>
                    <input
                      required
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-white focus:border-accent-orange focus:outline-none focus:ring-1 focus:ring-accent-orange [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                </div>

                {/* Paid By */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Paid By
                  </label>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-white focus:border-accent-orange focus:outline-none focus:ring-1 focus:ring-accent-orange"
                  >
                    {members.map((m) => (
                      <option
                        key={m.userId}
                        value={m.userId}
                        className="bg-neutral-800 text-white"
                      >
                        {m.userId === currentUserId
                          ? "Me"
                          : m.name || "Unknown"}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Split Between */}
                <div className="space-y-3 rounded-xl border border-white/5 bg-white/5 p-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-accent-orange" />
                    <label className="text-sm font-medium text-white">
                      Split Equal Between
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {members.map((m) => {
                      const isSelected = splitBetween.includes(m.userId);
                      return (
                        <button
                          key={m.userId}
                          type="button"
                          onClick={() => toggleSplitUser(m.userId)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all ${
                            isSelected
                              ? "border-accent-orange bg-accent-orange/20 text-accent-orange"
                              : "border-white/10 bg-black/20 text-gray-400 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {isSelected && (
                            <div className="h-1.5 w-1.5 rounded-full bg-accent-orange" />
                          )}
                          {m.userId === currentUserId
                            ? "Me"
                            : m.name || "Unknown"}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any extra details..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-white placeholder-gray-500 focus:border-accent-orange focus:outline-none focus:ring-1 focus:ring-accent-orange"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-8 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !title ||
                    amount === "" ||
                    Number(amount) <= 0 ||
                    splitBetween.length === 0
                  }
                  className="to-accent-red flex-1 bg-gradient-to-r from-accent-orange text-white hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Saving..."
                    : expenseToEdit
                      ? "Save Changes"
                      : "Add Expense"}
                  {!isSubmitting && !expenseToEdit && (
                    <PlusCircle className="ml-2 h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
