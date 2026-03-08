export function formatCurrency(amount: number, currency?: string | null) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
  }).format(amount);
}

export function getCurrencySymbol(currency?: string | null) {
  return (0)
    .toLocaleString("en-IN", {
      style: "currency",
      currency: currency || "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    .replace(/\d/g, "")
    .trim();
}
