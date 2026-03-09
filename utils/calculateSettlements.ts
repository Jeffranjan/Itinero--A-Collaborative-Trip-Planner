interface Settlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

interface Balance {
  userId: string;
  balance: number;
}

/** Greedy min-transactions settlement: match largest creditor with largest debtor. */
export function calculateSettlements(balances: Balance[]): Settlement[] {
  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  balances.forEach((b) => {
    const rounded = Math.round(b.balance * 100) / 100;
    if (rounded > 0) {
      creditors.push({ userId: b.userId, amount: rounded });
    } else if (rounded < 0) {
      debtors.push({ userId: b.userId, amount: Math.abs(rounded) });
    }
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];

  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const settleAmount = Math.min(creditor.amount, debtor.amount);

    if (settleAmount > 0.01) {
      settlements.push({
        fromUserId: debtor.userId,
        toUserId: creditor.userId,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    creditor.amount -= settleAmount;
    debtor.amount -= settleAmount;

    if (creditor.amount < 0.01) ci++;
    if (debtor.amount < 0.01) di++;
  }

  return settlements;
}
