import type { Category } from "@/lib/types";

export const categoryLabel: Record<Category, string> = {
  tree: "Drzewo",
  shrub: "Krzew",
  vine: "Pnącze",
  potted: "Doniczkowa",
  unknown: "Nieznana",
};

export const categoryOptions: Array<{ value: Category; label: string }> = [
  { value: "tree", label: "Drzewo" },
  { value: "shrub", label: "Krzew" },
  { value: "vine", label: "Pnącze" },
  { value: "potted", label: "Doniczkowa" },
  { value: "unknown", label: "Nieznana" },
];
