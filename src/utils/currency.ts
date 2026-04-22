const EURO_EXCHANGE_RATES: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.16,
  THB: 0.025,
  JPY: 0.006,
  AUD: 0.6,
  CAD: 0.67,
  CHF: 1.03,
  VND: 0.000037,
};

export function toEuro(amount: number, currency: string): number {
  const key = currency.toUpperCase();
  const rate = EURO_EXCHANGE_RATES[key] ?? 1;
  return roundCurrency(amount * rate);
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrency(value: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function normalizeCurrency(input: string): string {
  return input.trim().toUpperCase() || "EUR";
}
