import { id, nowIso } from "@/lib/db";
import type { Category, DatabaseSchema } from "@/lib/types";

export interface PlantsImportSummary {
  source_name: string;
  total_rows_scanned: number;
  total_cells_scanned: number;
  imported_count: number;
  updated_count: number;
  skipped_empty_rows: number;
  skipped_empty_cells: number;
  warnings: string[];
  errors: string[];
}

const MAX_ROWS = 24;
const MAX_COLS = 120;

const categoryHints: Array<{ category: Category; keywords: string[] }> = [
  { category: "potted", keywords: ["w doniczce", "w donicy", "doniczka", "donica", "patio"] },
  {
    category: "vine",
    keywords: [
      "kiwi",
      "ostrolistna",
      "smakowita",
      "arguta",
      "weiki",
      "geneva",
      "hayward",
      "issai",
      "dr szymanowski",
      "purpurna sadowa",
    ],
  },
  {
    category: "tree",
    keywords: [
      "jabłon",
      "jablon",
      "grusza",
      "śliwa",
      "sliwa",
      "czereśnia",
      "czeresnia",
      "wiśnia",
      "wisnia",
      "morela",
      "brzoskwinia",
      "nektaryna",
      "migdałowiec",
      "migdalowiec",
      "morwa",
      "figowiec",
    ],
  },
  {
    category: "shrub",
    keywords: [
      "borówka",
      "borowka",
      "porzeczka",
      "agrest",
      "aronia",
      "jeżyna",
      "jezyna",
      "malina",
      "jagoda goji",
      "goji",
      "pigwowiec",
    ],
  },
];

const speciesHints = [
  "Jagoda Goji",
  "Pigwowiec",
  "Borówka",
  "Porzeczka",
  "Agrest",
  "Aronia",
  "Jeżyna",
  "Malina",
  "Jabłoń",
  "Grusza",
  "Śliwa",
  "Czereśnia",
  "Wiśnia",
  "Morela",
  "Brzoskwinia",
  "Nektaryna",
  "Migdałowiec",
  "Morwa",
  "Figowiec",
  "Kiwi",
];

function normalizeWhitespace(value: string): string {
  return value.replace(/^\uFEFF/, "").replace(/\s+/g, " ").trim();
}

function normalizeForMatch(value: string): string {
  return normalizeWhitespace(value)
    .replace(/[łŁ]/g, (match) => (match === "ł" ? "l" : "L"))
    .toLocaleLowerCase("pl-PL")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function cleanupRemainder(value: string): string {
  return normalizeWhitespace(value.replace(/^[\s,;:/-]+|[\s,;:/-]+$/g, ""));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Detects whether the sparse spreadsheet export uses commas or semicolons as field separators.
 * The scan ignores quoted fragments and inspects only the first few lines because the delimiter
 * is expected to be consistent across the whole file.
 */
function detectDelimiter(input: string): "," | ";" {
  let commaCount = 0;
  let semicolonCount = 0;
  let inQuotes = false;
  let lines = 0;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (inQuotes && input[index + 1] === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (inQuotes) continue;
    if (char === ",") commaCount += 1;
    if (char === ";") semicolonCount += 1;
    if (char === "\n") {
      lines += 1;
      if (lines >= 10) break;
    }
  }

  return semicolonCount > commaCount ? ";" : ",";
}

/**
 * Parses the uploaded spreadsheet export into a 2D matrix while preserving empty cells.
 * Supports comma- and semicolon-delimited files, quoted values, escaped quotes, and CRLF/LF lines.
 */
export function parseCsvMatrix(input: string): string[][] {
  const source = input.replace(/^\uFEFF/, "");
  if (!source.trim()) return [];

  const delimiter = detectDelimiter(source);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (char === '"') {
      if (inQuotes && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === delimiter) {
      row.push(cell);
      cell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && source[index + 1] === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0 || source.endsWith(delimiter)) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

/**
 * Infers the plant category from the original spreadsheet label using fruit-name heuristics.
 * Falls back to "shrub" for berry-like labels and "unknown" when no supported hint is found.
 */
export function inferPlantCategory(label: string): Category {
  const normalized = normalizeForMatch(label);
  for (const hint of categoryHints) {
    if (hint.keywords.some((keyword) => normalized.includes(keyword))) {
      return hint.category;
    }
  }

  if (
    ["borow", "porzecz", "agrest", "aroni", "jezyn", "malin", "jagod", "goji"].some((keyword) =>
      normalized.includes(keyword),
    )
  ) {
    return "shrub";
  }

  return "unknown";
}

/**
 * Produces a user-friendly display name by trimming the imported label and normalizing whitespace.
 */
export function deriveDisplayName(label: string): string {
  return normalizeWhitespace(label);
}

/**
 * Splits the imported label into the app's species/variety fields.
 * It first uses known species hints, then falls back to a vine-specific default or a simple
 * first-word split when the label does not match any supported hint.
 */
export function deriveSpeciesAndVariety(
  label: string,
  category: Category,
): { species: string; variety: string } {
  for (const speciesHint of speciesHints) {
    const matcher = new RegExp(`(^|[\\s,;:/-])${escapeRegExp(speciesHint)}(?=$|[\\s,;:/-])`, "i");
    const match = matcher.exec(label);
    if (!match) continue;

    const matchIndex = match.index + match[1].length;
    const matchedValue = match[0].slice(match[1].length);
    return {
      species: speciesHint,
      variety: cleanupRemainder(
        `${label.slice(0, matchIndex)} ${label.slice(matchIndex + matchedValue.length)}`,
      ),
    };
  }

  if (category === "vine") {
    return { species: "Kiwi", variety: cleanupRemainder(label) };
  }

  const parts = normalizeWhitespace(label).split(" ").filter(Boolean);
  if (parts.length > 1) {
    return {
      species: parts[0],
      variety: cleanupRemainder(parts.slice(1).join(" ")),
    };
  }

  return { species: normalizeWhitespace(label), variety: "" };
}

/**
 * Imports sparse-grid CSV data into the local plant collection.
 * Every non-empty cell maps to its row/column coordinate; occupied coordinates update the
 * existing plant in place and are reported as warnings in the returned summary.
 */
export function importPlantsFromGrid(
  db: DatabaseSchema,
  csvText: string,
  sourceName: string,
): PlantsImportSummary {
  const rows = parseCsvMatrix(csvText);
  const plantsByPosition = new Map(db.plants.map((plant) => [`${plant.row_num}:${plant.col_num}`, plant]));
  const timestamp = nowIso();
  const summary: PlantsImportSummary = {
    source_name: sourceName,
    total_rows_scanned: rows.length,
    total_cells_scanned: 0,
    imported_count: 0,
    updated_count: 0,
    skipped_empty_rows: 0,
    skipped_empty_cells: 0,
    warnings: [],
    errors: [],
  };

  for (const [rowIndex, row] of rows.entries()) {
    summary.total_cells_scanned += row.length;
    const rowNum = rowIndex + 1;

    if (row.every((cell) => normalizeWhitespace(cell) === "")) {
      summary.skipped_empty_rows += 1;
      summary.skipped_empty_cells += row.length;
      continue;
    }

    for (const [columnIndex, rawCell] of row.entries()) {
      const originalLabel = normalizeWhitespace(rawCell);
      if (!originalLabel) {
        summary.skipped_empty_cells += 1;
        continue;
      }

      const colNum = columnIndex + 1;
      if (rowNum > MAX_ROWS || colNum > MAX_COLS) {
        summary.warnings.push(
          `Pominięto "${originalLabel}" na pozycji R${rowNum} C${colNum}, bo wykracza poza mapę 24×120.`,
        );
        continue;
      }

      const displayName = deriveDisplayName(originalLabel);
      const category = inferPlantCategory(originalLabel);
      const { species, variety } = deriveSpeciesAndVariety(displayName, category);
      const positionKey = `${rowNum}:${colNum}`;
      const existingPlant = plantsByPosition.get(positionKey);

      if (existingPlant) {
        existingPlant.display_name = displayName;
        existingPlant.species = species;
        existingPlant.variety = variety;
        existingPlant.original_label = originalLabel;
        existingPlant.category = category;
        existingPlant.updated_at = timestamp;
        summary.updated_count += 1;
        summary.warnings.push(`Pozycja R${rowNum} C${colNum} była już zajęta, więc roślina została zaktualizowana.`);
        continue;
      }

      const importedPlant = {
        id: id(),
        display_name: displayName,
        species,
        variety,
        original_label: originalLabel,
        category,
        group_id: null,
        row_num: rowNum,
        col_num: colNum,
        notes: "",
        created_at: timestamp,
        updated_at: timestamp,
      };

      db.plants.push(importedPlant);
      plantsByPosition.set(positionKey, importedPlant);
      summary.imported_count += 1;
    }
  }

  return summary;
}
