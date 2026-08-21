const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

let overriddenNow: Date | null = null;

function toDate(value: string | Date) {
  return typeof value === "string" ? new Date(value) : new Date(value);
}

export function now() {
  return overriddenNow ? new Date(overriddenNow) : new Date();
}

export function todayIsoDate() {
  return now().toISOString().slice(0, 10);
}

export function setNow(value: string | Date) {
  const next = toDate(value);
  if (Number.isNaN(next.getTime())) {
    throw new Error("Invalid date");
  }

  overriddenNow = next;
}

export function setToday(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    throw new Error("Date must be in YYYY-MM-DD format");
  }

  setNow(`${value}T00:00:00.000Z`);
}

export function resetNow() {
  overriddenNow = null;
}

export function advanceDays(days: number) {
  const next = now();
  next.setUTCDate(next.getUTCDate() + days);
  overriddenNow = next;
}
