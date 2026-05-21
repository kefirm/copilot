export function formatDate(date: string): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("pl-PL").format(new Date(date));
}

export function normalizeGroupName(name: string): string {
  const trimmed = name.trim();
  const normalized = trimmed.toLocaleLowerCase("pl-PL");

  if (normalized === "krzewy jagodowe" || normalized === "krzewy owocowe" || normalized === "krzewy") {
    return "Krzewy";
  }

  return trimmed;
}

export function parseIntSafe(value: FormDataEntryValue | null, fallback = 0): number {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function text(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}
