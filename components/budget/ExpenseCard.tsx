import { motion } from "framer-motion";
import { format } from "date-fns";
import { Trash2, TrendingDown, TrendingUp, Edit2 } from "lucide-react";
import { Expense, ExpenseCategory } from "@/types/expense";
import { formatCurrency } from "@/lib/currency";

interface TripMemberInfo {
  userId: string;
  name?: string;
  role: string;
}

interface ExpenseCardProps {
  expense: Expense;
  members: TripMemberInfo[];
  currentUserId: string;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  canEdit: boolean;
  userShare: number | null; // amount owed by current user for this expense
  currency?: string;
}

const CATEGORY_ICONS: Record<ExpenseCategory | string, string> = {
  transport: "🚗",
  accommodation: "🏨",
  food: "🍔",
  activities: "🎫",
  shopping: "🛍️",
  other: "🏷️",
};

export function ExpenseCard({
  expense,
  members,
  currentUserId,
  onEdit,
  onDelete,
  isDeleting,
  canEdit,
  userShare,
  currency,
}: ExpenseCardProps) {
  const payer = members.find((m) => m.userId === expense.paidBy);
  const isPayer = expense.paidBy === currentUserId;

  const payerName = isPayer ? "You" : payer?.name || "Unknown";
  const icon = CATEGORY_ICONS[expense.category] || "🧾";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      className="group relative flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-all duration-300 hover:bg-white/10 hover:shadow-lg"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/20 text-2xl transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110">
          {icon}
        </div>

        {/* Details */}
        <div>
          <h4 className="font-semibold text-white">{expense.title}</h4>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
            <span className="capitalize">{expense.category}</span>
            <span>•</span>
            <span>{format(new Date(expense.date), "MMM d, yyyy")}</span>
            <span>•</span>
            <span>Paid by {payerName}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Amounts */}
        <div className="text-right">
          <div className="font-semibold text-white">
            {formatCurrency(expense.amount, currency)}
          </div>
          {userShare !== null && (
            <div
              className={`mt-1 flex items-center justify-end gap-1 text-xs font-medium ${
                isPayer ? "text-emerald-400" : "text-accent-orange"
              }`}
            >
              {isPayer ? (
                <>
                  <TrendingUp className="h-3 w-3" /> You lent{" "}
                  {formatCurrency(expense.amount - userShare, currency)}
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3" /> You borrowed{" "}
                  {formatCurrency(userShare, currency)}
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {canEdit && (
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => onEdit(expense)}
              disabled={isDeleting}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(expense.$id)}
              disabled={isDeleting}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
