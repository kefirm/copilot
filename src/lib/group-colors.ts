import type { Group } from "@/lib/types";

const PALETTE = [
  "#fca5a5",
  "#fdba74",
  "#fcd34d",
  "#86efac",
  "#67e8f9",
  "#93c5fd",
  "#c4b5fd",
  "#f9a8d4",
  "#94a3b8",
];

export function buildGroupColors(groups: Group[]): Record<string, string> {
  const sorted = [...groups].sort((a, b) => a.name.localeCompare(b.name, "pl-PL", { sensitivity: "base" }));
  const colors: Record<string, string> = {};

  for (const [index, group] of sorted.entries()) {
    colors[group.id] = PALETTE[index % PALETTE.length];
  }

  return colors;
}

