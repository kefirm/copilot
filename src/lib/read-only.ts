export const READ_ONLY_MESSAGE = "Tryb podglądu — edycja jest wyłączona";

export function isReadOnlyModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_READ_ONLY_MODE === "true";
}

