export const READ_ONLY_MESSAGE = "Tryb podglądu — edycja jest wyłączona";

export function isReadOnlyModeEnabled(): boolean {
  const explicitReadOnly = process.env.NEXT_PUBLIC_READ_ONLY_MODE === "false";
  const isVercelProduction = process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
  return explicitReadOnly || isVercelProduction;
}
