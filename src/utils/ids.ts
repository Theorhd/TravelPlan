const HANDLE_MIN_LENGTH = 8;

export function ensureUserIdFormat(input: string): string {
  const normalized = input.trim().toLowerCase().replaceAll(/[^a-z0-9_]/g, "");
  const padded = normalized.padEnd(HANDLE_MIN_LENGTH - 1, "x").slice(0, 24);
  return `@${padded}`;
}

export function isValidUserId(input: string): boolean {
  return /^@[a-z0-9_]{7,24}$/.test(input);
}

export function generateUserId(seed = "travelmate"): string {
  const base = seed.trim().toLowerCase().replaceAll(/[^a-z0-9_]/g, "") || "travelmate";
  const random = Math.floor(Math.random() * 9000 + 1000).toString();
  const candidate = `${base}${random}`.slice(0, 24);
  return ensureUserIdFormat(candidate);
}

export function createEntityId(prefix: string): string {
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}
