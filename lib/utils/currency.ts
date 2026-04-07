const fmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Convert paise (integer) to a formatted ₹ string. e.g. 150000 → "₹1,500" */
export function paiseToCurrency(paise: number): string {
  return fmt.format(paise / 100);
}

/** Convert paise to rupees as a plain number. e.g. 150000 → 1500 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Convert rupees to paise. e.g. 1500 → 150000 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
