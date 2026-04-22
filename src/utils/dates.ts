export function toIsoDate(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  return date.toISOString().slice(0, 10);
}

export function addDays(isoDate: string, days: number): string {
  const next = new Date(`${isoDate}T00:00:00`);
  next.setDate(next.getDate() + days);
  return toIsoDate(next);
}

export function diffDays(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T00:00:00`).getTime();
  const end = new Date(`${endIso}T00:00:00`).getTime();
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
}

export function nowIsoTimestamp(): string {
  return new Date().toISOString();
}

export function formatDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(`${iso}T00:00:00`));
}
