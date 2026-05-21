import type { Group, Plant } from "@/lib/types";

type GroupKey =
  | "tree_pome"
  | "tree_stone"
  | "tree_special"
  | "shrub_blueberry"
  | "shrub_raspberry_kiwi"
  | "shrub_ribes"
  | "shrub_neutral"
  | "mixed_unknown";

interface GroupTargets {
  tree_pome: string | null;
  tree_stone: string | null;
  tree_special: string | null;
  shrub_blueberry: string | null;
  shrub_raspberry_kiwi: string | null;
  shrub_ribes: string | null;
  shrub_neutral: string | null;
  mixed_unknown: string | null;
}

function normalizeForMatch(value: string): string {
  return value
    .trim()
    .replace(/[łŁ]/g, (match) => (match === "ł" ? "l" : "L"))
    .toLocaleLowerCase("pl-PL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function hasAny(text: string, keywords: string[]): boolean {
  return keywords.some((keyword) => text.includes(keyword));
}

function groupKeyFromGroup(group: Group): GroupKey | null {
  const normalizedName = normalizeForMatch(group.name);

  switch (group.id) {
    case "group-tree-pome":
      return "tree_pome";
    case "group-tree-stone":
      return "tree_stone";
    case "group-tree-special":
      return "tree_special";
    case "group-shrub-blueberry":
      return "shrub_blueberry";
    case "group-shrub-raspberry-kiwi":
      return "shrub_raspberry_kiwi";
    case "group-shrub-ribes":
      return "shrub_ribes";
    case "group-shrub-neutral":
      return "shrub_neutral";
    case "group-mixed-unknown":
      return "mixed_unknown";
    default:
      break;
  }

  if (hasAny(normalizedName, ["ziarnkowe", "jablonie", "grusze"])) return "tree_pome";
  if (hasAny(normalizedName, ["pestkowe", "sliwy", "wisnie", "czeresnie", "morele", "brzoskwinie"])) {
    return "tree_stone";
  }
  if (hasAny(normalizedName, ["specjalne", "donicowe", "figow", "morwa"])) return "tree_special";
  if (hasAny(normalizedName, ["borowki", "kwasnolubne"])) return "shrub_blueberry";
  if (hasAny(normalizedName, ["maliny", "jezyny", "kiwi"])) return "shrub_raspberry_kiwi";
  if (hasAny(normalizedName, ["porzeczki", "agrest"])) return "shrub_ribes";
  if (hasAny(normalizedName, ["neutralne", "aronia", "goji", "pigwowce"])) return "shrub_neutral";
  if (hasAny(normalizedName, ["obserwacji", "niepewna", "identyfikacja"])) return "mixed_unknown";

  return null;
}

function getGroupTargets(groups: Group[]): GroupTargets {
  const targets: GroupTargets = {
    tree_pome: null,
    tree_stone: null,
    tree_special: null,
    shrub_blueberry: null,
    shrub_raspberry_kiwi: null,
    shrub_ribes: null,
    shrub_neutral: null,
    mixed_unknown: null,
  };

  for (const group of groups) {
    const key = groupKeyFromGroup(group);
    if (!key || targets[key]) continue;
    targets[key] = group.id;
  }

  return targets;
}

function inferPlantGroupKey(plant: Pick<Plant, "category" | "display_name" | "species" | "variety" | "original_label">): GroupKey {
  const normalized = normalizeForMatch(
    `${plant.display_name} ${plant.species} ${plant.variety} ${plant.original_label}`,
  );
  const unknownKeywords = ["nie wiadomo", "unknown", "nieznan", "do identyfikacji"];
  const pomeKeywords = ["jablon", "grusza", "grusze", "jablonie"];
  const stoneKeywords = [
    "sliwa",
    "sliwomorela",
    "plumcot",
    "wisia",
    "wisnia",
    "czeresnia",
    "morela",
    "brzoskwinia",
    "nektaryna",
  ];
  const specialTreeKeywords = ["morwa", "fig", "migdal", "donic", "mini drzew"];
  const blueberryKeywords = ["borowka", "borowki"];
  const raspberryKiwiKeywords = ["malina", "maliny", "jezyna", "jezyny", "kiwi", "aktinidia"];
  const ribesKeywords = ["porzeczka", "porzeczki", "agrest", "agresty"];
  const neutralShrubKeywords = ["aronia", "goji", "pigwowiec", "kamczack", "poziomk", "josta"];

  if (plant.category === "unknown" || hasAny(normalized, unknownKeywords)) {
    return "mixed_unknown";
  }

  if (plant.category === "tree") {
    if (hasAny(normalized, pomeKeywords)) return "tree_pome";
    if (hasAny(normalized, stoneKeywords)) return "tree_stone";
    if (hasAny(normalized, specialTreeKeywords)) return "tree_special";
    return "tree_special";
  }

  if (plant.category === "shrub" || plant.category === "vine" || plant.category === "potted") {
    if (hasAny(normalized, blueberryKeywords)) return "shrub_blueberry";
    if (hasAny(normalized, raspberryKiwiKeywords)) return "shrub_raspberry_kiwi";
    if (hasAny(normalized, ribesKeywords)) return "shrub_ribes";
    if (hasAny(normalized, neutralShrubKeywords)) return "shrub_neutral";
    return "shrub_neutral";
  }

  return "mixed_unknown";
}

export function inferGroupIdForPlant(
  groups: Group[],
  plant: Pick<Plant, "category" | "display_name" | "species" | "variety" | "original_label">,
): string | null {
  const targets = getGroupTargets(groups);
  const key = inferPlantGroupKey(plant);
  return targets[key];
}

