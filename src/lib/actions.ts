"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { id, nowIso, readDb, writeDb } from "@/lib/db";
import { inferGroupIdForPlant } from "@/lib/grouping";
import { importPlantsFromGrid, type PlantsImportSummary } from "@/lib/plant-import";
import { isReadOnlyModeEnabled, READ_ONLY_MESSAGE } from "@/lib/read-only";
import { normalizeGroupName, parseIntSafe, text } from "@/lib/utils";

function refreshAll(): void {
  revalidatePath("/");
  revalidatePath("/mapa");
  revalidatePath("/rosliny");
  revalidatePath("/grupy");
  revalidatePath("/produkty");
  revalidatePath("/zabiegi");
  revalidatePath("/obserwacje");
}

function assertWritable(): void {
  if (isReadOnlyModeEnabled()) {
    throw new Error(READ_ONLY_MESSAGE);
  }
}

function assertPlantPositionAvailable(
  plants: Array<{ id: string; row_num: number; col_num: number }>,
  row: number,
  col: number,
  currentId?: string,
): void {
  const occupied = plants.find(
    (p) => p.row_num === row && p.col_num === col && p.id !== currentId,
  );
  if (occupied) {
    throw new Error("To pole mapy jest już zajęte przez inną roślinę.");
  }
}

const SAMPLE_GARDEN_CSV_PATH = path.join(
  process.cwd(),
  "public",
  "examples",
  "przykladowy-arkusz-ogrodu.csv",
);
// Imports are handled fully in-memory via server action. For the fixed 20 × 200 grid, 2 MB is
// comfortably enough for sparse CSV exports while still preventing unexpectedly large uploads.
const MAX_IMPORT_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;

function parseCategory(value: string): "tree" | "shrub" | "vine" | "potted" | "unknown" {
  if (
    value === "tree" ||
    value === "shrub" ||
    value === "vine" ||
    value === "potted" ||
    value === "unknown"
  ) {
    return value;
  }
  throw new Error("Nieprawidłowa kategoria rośliny.");
}

function parseTreatmentType(value: string): "spray" | "fertilization" {
  if (value === "spray" || value === "fertilization") {
    return value;
  }
  throw new Error("Nieprawidłowy typ zabiegu.");
}

function parseTargetType(value: string): "plant" | "group" {
  if (value === "plant" || value === "group") {
    return value;
  }
  throw new Error("Nieprawidłowy typ celu zabiegu.");
}

function isUploadedFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File;
}

function toGoogleSheetParts(input: string): { sheetId: string; gid: string } {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("Podaj link do Google Sheets.");
  }

  const url = new URL(trimmed);
  const match = url.pathname.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error("Nieprawidłowy link Google Sheets.");
  }

  const sheetId = match[1];
  const gidFromSearch = url.searchParams.get("gid");
  const gidFromHash = url.hash.match(/gid=(\d+)/)?.[1];
  const gid = gidFromSearch || gidFromHash || "0";

  return { sheetId, gid };
}

function toGoogleSheetCsvExportUrl(input: string): string {
  const { sheetId, gid } = toGoogleSheetParts(input);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

function toGoogleSheetGvizCsvUrl(input: string): string {
  const { sheetId, gid } = toGoogleSheetParts(input);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

function looksLikeGoogleLoginOrCookiePage(content: string): boolean {
  return (
    content.includes("ServiceLogin") ||
    content.includes("InteractiveLogin") ||
    content.includes("Zaloguj się na konto Google") ||
    content.includes("Zezwól usłudze Arkusze Google na dostęp do niezbędnych plików cookie")
  );
}

type ImportPlantsActionState = {
  status: "idle" | "success" | "error";
  message: string;
  summary: PlantsImportSummary | null;
};

export async function createGroup(formData: FormData): Promise<void> {
  assertWritable();
  const db = await readDb();
  const timestamp = nowIso();
  db.groups.push({
    id: id(),
    name: normalizeGroupName(text(formData.get("name"))),
    description: text(formData.get("description")),
    created_at: timestamp,
    updated_at: timestamp,
  });
  await writeDb(db);
  refreshAll();
  redirect("/grupy");
}

export async function updateGroup(formData: FormData): Promise<void> {
  assertWritable();
  const db = await readDb();
  const groupId = text(formData.get("id"));
  const group = db.groups.find((g) => g.id === groupId);
  if (!group) {
    redirect("/grupy");
    return;
  }

  group.name = normalizeGroupName(text(formData.get("name")));
  group.description = text(formData.get("description"));
  group.updated_at = nowIso();

  await writeDb(db);
  refreshAll();
  redirect(`/grupy/${groupId}`);
}

export async function deleteGroup(formData: FormData): Promise<void> {
  assertWritable();
  const groupId = text(formData.get("id"));
  const db = await readDb();
  db.groups = db.groups.filter((g) => g.id !== groupId);
  db.plants = db.plants.map((plant) =>
    plant.group_id === groupId ? { ...plant, group_id: null, updated_at: nowIso() } : plant,
  );
  db.treatments = db.treatments.map((treatment) =>
    treatment.group_id === groupId
      ? { ...treatment, group_id: null, updated_at: nowIso() }
      : treatment,
  );
  await writeDb(db);
  refreshAll();
  redirect("/grupy");
}

export async function createPlant(formData: FormData): Promise<void> {
  assertWritable();
  const db = await readDb();
  const rowNum = parseIntSafe(formData.get("row_num"));
  const colNum = parseIntSafe(formData.get("col_num"));

  if (rowNum < 1 || rowNum > 200 || colNum < 1 || colNum > 20) {
    throw new Error("Współrzędne muszą mieścić się w zakresie 1-200 (wiersz) i 1-20 (kolumna).");
  }
  assertPlantPositionAvailable(db.plants, rowNum, colNum);

  const timestamp = nowIso();
  const groupId = text(formData.get("group_id"));

  const displayName = text(formData.get("display_name"));
  const species = text(formData.get("species"));
  const variety = text(formData.get("variety"));
  const originalLabel = text(formData.get("original_label"));
  const category = parseCategory(text(formData.get("category")));

  db.plants.push({
    id: id(),
    display_name: displayName,
    species,
    variety,
    original_label: originalLabel,
    category,
    group_id:
      groupId ||
      inferGroupIdForPlant(db.groups, {
        category,
        display_name: displayName,
        species,
        variety,
        original_label: originalLabel,
      }) ||
      null,
    row_num: rowNum,
    col_num: colNum,
    notes: text(formData.get("notes")),
    created_at: timestamp,
    updated_at: timestamp,
  });

  await writeDb(db);
  refreshAll();
  redirect("/rosliny");
}

export async function updatePlant(formData: FormData): Promise<void> {
  assertWritable();
  const db = await readDb();
  const plantId = text(formData.get("id"));
  const plant = db.plants.find((p) => p.id === plantId);
  if (!plant) {
    redirect("/rosliny");
    return;
  }

  const rowNum = parseIntSafe(formData.get("row_num"));
  const colNum = parseIntSafe(formData.get("col_num"));

  if (rowNum < 1 || rowNum > 200 || colNum < 1 || colNum > 20) {
    throw new Error("Współrzędne muszą mieścić się w zakresie 1-200 (wiersz) i 1-20 (kolumna).");
  }
  assertPlantPositionAvailable(db.plants, rowNum, colNum, plantId);

  const groupId = text(formData.get("group_id"));
  const displayName = text(formData.get("display_name"));
  const species = text(formData.get("species"));
  const variety = text(formData.get("variety"));
  const originalLabel = text(formData.get("original_label"));
  const category = parseCategory(text(formData.get("category")));

  plant.display_name = displayName;
  plant.species = species;
  plant.variety = variety;
  plant.original_label = originalLabel;
  plant.category = category;
  plant.group_id =
    groupId ||
    inferGroupIdForPlant(db.groups, {
      category,
      display_name: displayName,
      species,
      variety,
      original_label: originalLabel,
    }) ||
    null;
  plant.row_num = rowNum;
  plant.col_num = colNum;
  plant.notes = text(formData.get("notes"));
  plant.updated_at = nowIso();

  await writeDb(db);
  refreshAll();
  redirect(`/rosliny/${plantId}`);
}

export async function deletePlant(formData: FormData): Promise<void> {
  assertWritable();
  const plantId = text(formData.get("id"));
  const db = await readDb();
  db.plants = db.plants.filter((p) => p.id !== plantId);
  db.treatments = db.treatments.filter((t) => t.plant_id !== plantId);
  db.observations = db.observations.filter((o) => o.plant_id !== plantId);
  await writeDb(db);
  refreshAll();
  redirect("/rosliny");
}

export async function movePlantOnMap(formData: FormData): Promise<void> {
  assertWritable();
  const db = await readDb();
  const plantId = text(formData.get("plant_id"));
  const rowNum = parseIntSafe(formData.get("row_num"));
  const colNum = parseIntSafe(formData.get("col_num"));

  if (rowNum < 1 || rowNum > 200 || colNum < 1 || colNum > 20) {
    throw new Error("Współrzędne muszą mieścić się w zakresie 1-200 (wiersz) i 1-20 (kolumna).");
  }

  const plant = db.plants.find((p) => p.id === plantId);
  if (!plant) {
    return;
  }

  assertPlantPositionAvailable(db.plants, rowNum, colNum, plantId);
  plant.row_num = rowNum;
  plant.col_num = colNum;
  plant.updated_at = nowIso();

  await writeDb(db);
  refreshAll();
}

export async function deletePlantOnMap(formData: FormData): Promise<void> {
  assertWritable();
  const plantId = text(formData.get("id"));
  const db = await readDb();
  db.plants = db.plants.filter((p) => p.id !== plantId);
  db.treatments = db.treatments.filter((t) => t.plant_id !== plantId);
  db.observations = db.observations.filter((o) => o.plant_id !== plantId);
  await writeDb(db);
  refreshAll();
}

/**
 * Server action used by the Rośliny import form.
 * Reads either an uploaded CSV file or the bundled sample, imports grid data into local storage,
 * and returns a serializable summary for useActionState-based UI feedback.
 */
export async function importPlantsFromGridCsv(
  _prevState: ImportPlantsActionState,
  formData: FormData,
): Promise<ImportPlantsActionState> {
  try {
    assertWritable();
    const rawImportSource = text(formData.get("import_source"));
    const importSource =
      rawImportSource === "sample"
        ? "sample"
        : rawImportSource === "google_sheet"
          ? "google_sheet"
          : "upload";
    let csvText = "";
    let sourceName = "";

    if (importSource === "sample") {
      csvText = await fs.readFile(SAMPLE_GARDEN_CSV_PATH, "utf8");
      sourceName = "przykladowy-arkusz-ogrodu.csv";
    } else if (importSource === "google_sheet") {
      const sheetUrl = text(formData.get("google_sheet_url"));
      const exportUrl = toGoogleSheetCsvExportUrl(sheetUrl);
      const gvizUrl = toGoogleSheetGvizCsvUrl(sheetUrl);

      const primaryResponse = await fetch(exportUrl, {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const primaryText = await primaryResponse.text();
      const primaryContentType = (primaryResponse.headers.get("content-type") || "").toLowerCase();
      const primaryLooksLikeCsv =
        primaryContentType.includes("text/csv") ||
        primaryContentType.includes("application/csv") ||
        primaryContentType.includes("application/vnd.ms-excel");
      const primaryBlocked =
        !primaryResponse.ok ||
        primaryResponse.url.includes("accounts.google.com") ||
        looksLikeGoogleLoginOrCookiePage(primaryText) ||
        !primaryLooksLikeCsv;

      if (!primaryBlocked) {
        csvText = primaryText;
      } else {
        const fallbackResponse = await fetch(gvizUrl, {
          cache: "no-store",
          signal: AbortSignal.timeout(15000),
        });
        const fallbackText = await fallbackResponse.text();
        const fallbackContentType = (fallbackResponse.headers.get("content-type") || "").toLowerCase();
        const fallbackLooksLikeCsv =
          fallbackContentType.includes("text/csv") ||
          fallbackContentType.includes("application/csv") ||
          fallbackContentType.includes("application/vnd.ms-excel");
        const fallbackBlocked =
          !fallbackResponse.ok ||
          fallbackResponse.url.includes("accounts.google.com") ||
          looksLikeGoogleLoginOrCookiePage(fallbackText) ||
          !fallbackLooksLikeCsv;

        if (fallbackBlocked) {
          return {
            status: "error",
            message:
              "Nie mogę odczytać arkusza bez logowania. Ustaw udostępnienie \"Każdy, kto ma link: Wyświetlający\" i spróbuj ponownie.",
            summary: null,
          };
        }

        csvText = fallbackText;
      }

      sourceName = `google-sheet:${sheetUrl}`;
    } else {
      const file = formData.get("csv_file");
      if (!isUploadedFile(file) || file.size === 0) {
        return {
          status: "error",
          message: "Wybierz plik CSV, podaj link Google Sheets albo użyj przykładu z repo.",
          summary: null,
        };
      }

      if (file.size > MAX_IMPORT_UPLOAD_SIZE_BYTES) {
        return {
          status: "error",
          message: "Plik jest zbyt duży. Maksymalny rozmiar importu to 2 MB.",
          summary: null,
        };
      }

      csvText = await file.text();
      sourceName = file.name || "import.csv";
    }

    const db = await readDb();
    db.plants = [];
    db.observations = [];
    db.treatments = db.treatments.filter((treatment) => treatment.target_type !== "plant");

    const summary = importPlantsFromGrid(db, csvText, sourceName);
    for (const plant of db.plants) {
      plant.group_id =
        inferGroupIdForPlant(db.groups, {
          category: plant.category,
          display_name: plant.display_name,
          species: plant.species,
          variety: plant.variety,
          original_label: plant.original_label,
        }) || null;
    }
    const changedPlants = summary.imported_count + summary.updated_count;

    if (summary.total_cells_scanned === 0) {
      return {
        status: "error",
        message: "Plik CSV jest pusty.",
        summary,
      };
    }

    if (changedPlants === 0) {
      return {
        status: "error",
        message: "Nie znaleziono żadnych niepustych komórek z roślinami do importu.",
        summary,
      };
    }

    await writeDb(db);
    refreshAll();

    return {
      status: "success",
      message: `Import zakończony. Dodano ${summary.imported_count} roślin i zaktualizowano ${summary.updated_count}.`,
      summary,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Nie udało się zaimportować pliku CSV.",
      summary: null,
    };
  }
}

export async function autoAssignPlantGroups(): Promise<void> {
  assertWritable();
  const db = await readDb();
  const timestamp = nowIso();

  for (const plant of db.plants) {
    const nextGroupId =
      inferGroupIdForPlant(db.groups, {
        category: plant.category,
        display_name: plant.display_name,
        species: plant.species,
        variety: plant.variety,
        original_label: plant.original_label,
      }) || null;

    if (plant.group_id !== nextGroupId) {
      plant.group_id = nextGroupId;
      plant.updated_at = timestamp;
    }
  }

  await writeDb(db);
  refreshAll();
}

export async function createProduct(formData: FormData): Promise<void> {
  assertWritable();
  const db = await readDb();
  const timestamp = nowIso();

  db.products.push({
    id: id(),
    name: text(formData.get("name")),
    product_type: text(formData.get("product_type")),
    default_dose: text(formData.get("default_dose")),
    default_unit: text(formData.get("default_unit")),
    notes: text(formData.get("notes")),
    created_at: timestamp,
    updated_at: timestamp,
  });

  await writeDb(db);
  refreshAll();
  redirect("/produkty");
}

export async function updateProduct(formData: FormData): Promise<void> {
  assertWritable();
  const db = await readDb();
  const productId = text(formData.get("id"));
  const product = db.products.find((p) => p.id === productId);
  if (!product) {
    redirect("/produkty");
    return;
  }

  product.name = text(formData.get("name"));
  product.product_type = text(formData.get("product_type"));
  product.default_dose = text(formData.get("default_dose"));
  product.default_unit = text(formData.get("default_unit"));
  product.notes = text(formData.get("notes"));
  product.updated_at = nowIso();

  await writeDb(db);
  refreshAll();
  redirect("/produkty");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  assertWritable();
  const productId = text(formData.get("id"));
  const db = await readDb();
  db.products = db.products.filter((p) => p.id !== productId);
  db.treatments = db.treatments.map((t) =>
    t.product_id === productId ? { ...t, product_id: null, updated_at: nowIso() } : t,
  );
  await writeDb(db);
  refreshAll();
  redirect("/produkty");
}

export async function createTreatment(formData: FormData): Promise<void> {
  assertWritable();
  const db = await readDb();
  const timestamp = nowIso();
  const targetType = parseTargetType(text(formData.get("target_type")));
  const plantId = text(formData.get("plant_id"));
  const groupId = text(formData.get("group_id"));
  const productId = text(formData.get("product_id"));

  db.treatments.push({
    id: id(),
    target_type: targetType,
    plant_id: targetType === "plant" && plantId ? plantId : null,
    group_id: targetType === "group" && groupId ? groupId : null,
    treatment_type: parseTreatmentType(text(formData.get("treatment_type"))),
    date: text(formData.get("date")),
    product_id: productId || null,
    product_name_manual: text(formData.get("product_name_manual")),
    dose: text(formData.get("dose")),
    unit: text(formData.get("unit")),
    reason: text(formData.get("reason")),
    notes: text(formData.get("notes")),
    completed_at: null,
    created_at: timestamp,
    updated_at: timestamp,
  });

  await writeDb(db);
  refreshAll();
  redirect("/zabiegi");
}

export async function updateTreatment(formData: FormData): Promise<void> {
  assertWritable();
  const db = await readDb();
  const treatmentId = text(formData.get("id"));
  const treatment = db.treatments.find((t) => t.id === treatmentId);
  if (!treatment) {
    redirect("/zabiegi");
    return;
  }

  const targetType = parseTargetType(text(formData.get("target_type")));
  const plantId = text(formData.get("plant_id"));
  const groupId = text(formData.get("group_id"));
  const productId = text(formData.get("product_id"));

  treatment.target_type = targetType;
  treatment.plant_id = targetType === "plant" && plantId ? plantId : null;
  treatment.group_id = targetType === "group" && groupId ? groupId : null;
  treatment.treatment_type = parseTreatmentType(text(formData.get("treatment_type")));
  treatment.date = text(formData.get("date"));
  treatment.product_id = productId || null;
  treatment.product_name_manual = text(formData.get("product_name_manual"));
  treatment.dose = text(formData.get("dose"));
  treatment.unit = text(formData.get("unit"));
  treatment.reason = text(formData.get("reason"));
  treatment.notes = text(formData.get("notes"));
  treatment.completed_at = treatment.completed_at ?? null;
  treatment.updated_at = nowIso();

  await writeDb(db);
  refreshAll();
  redirect("/zabiegi");
}

export async function deleteTreatment(formData: FormData): Promise<void> {
  assertWritable();
  const treatmentId = text(formData.get("id"));
  const db = await readDb();
  db.treatments = db.treatments.filter((t) => t.id !== treatmentId);
  await writeDb(db);
  refreshAll();
  redirect("/zabiegi");
}

export async function deleteCompletedTreatments(): Promise<void> {
  assertWritable();
  const db = await readDb();
  db.treatments = db.treatments.filter((treatment) => !treatment.completed_at);
  await writeDb(db);
  refreshAll();
  redirect("/zabiegi");
}

export async function toggleTreatmentCompleted(formData: FormData): Promise<void> {
  assertWritable();
  const treatmentId = text(formData.get("id"));
  const db = await readDb();
  const treatment = db.treatments.find((t) => t.id === treatmentId);
  if (!treatment) {
    return;
  }

  treatment.completed_at = treatment.completed_at ? null : nowIso();
  treatment.updated_at = nowIso();

  await writeDb(db);
  refreshAll();
}

export async function createObservation(formData: FormData): Promise<void> {
  assertWritable();
  const db = await readDb();
  const timestamp = nowIso();

  db.observations.push({
    id: id(),
    plant_id: text(formData.get("plant_id")),
    date: text(formData.get("date")),
    observation_type: text(formData.get("observation_type")),
    title: text(formData.get("title")),
    description: text(formData.get("description")),
    created_at: timestamp,
    updated_at: timestamp,
  });

  await writeDb(db);
  refreshAll();
  redirect("/obserwacje");
}

export async function updateObservation(formData: FormData): Promise<void> {
  assertWritable();
  const db = await readDb();
  const observationId = text(formData.get("id"));
  const observation = db.observations.find((o) => o.id === observationId);
  if (!observation) {
    redirect("/obserwacje");
    return;
  }

  observation.plant_id = text(formData.get("plant_id"));
  observation.date = text(formData.get("date"));
  observation.observation_type = text(formData.get("observation_type"));
  observation.title = text(formData.get("title"));
  observation.description = text(formData.get("description"));
  observation.updated_at = nowIso();

  await writeDb(db);
  refreshAll();
  redirect("/obserwacje");
}

export async function deleteObservation(formData: FormData): Promise<void> {
  assertWritable();
  const observationId = text(formData.get("id"));
  const db = await readDb();
  db.observations = db.observations.filter((o) => o.id !== observationId);
  await writeDb(db);
  refreshAll();
  redirect("/obserwacje");
}
