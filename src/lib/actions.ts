"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { id, nowIso, readDb, writeDb } from "@/lib/db";
import { importPlantsFromGrid, type PlantsImportSummary } from "@/lib/plant-import";
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

function revalidatePlantDetailPaths(plantId: string): void {
  revalidatePath(`/rosliny/${plantId}`);
  revalidatePath(`/rosliny/${plantId}/edytuj`);
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

type ImportPlantsActionState = {
  status: "idle" | "success" | "error";
  message: string;
  summary: PlantsImportSummary | null;
};

export async function createGroup(formData: FormData): Promise<void> {
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
  const db = await readDb();
  const rowNum = parseIntSafe(formData.get("row_num"));
  const colNum = parseIntSafe(formData.get("col_num"));

  if (rowNum < 1 || rowNum > 24 || colNum < 1 || colNum > 120) {
    throw new Error("Współrzędne muszą mieścić się w zakresie 1-24 (wiersz) i 1-120 (kolumna).");
  }
  assertPlantPositionAvailable(db.plants, rowNum, colNum);

  const timestamp = nowIso();
  const groupId = text(formData.get("group_id"));

  db.plants.push({
    id: id(),
    display_name: text(formData.get("display_name")),
    species: text(formData.get("species")),
    variety: text(formData.get("variety")),
    original_label: text(formData.get("original_label")),
    category: parseCategory(text(formData.get("category"))),
    group_id: groupId || null,
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
  const db = await readDb();
  const plantId = text(formData.get("id"));
  const plant = db.plants.find((p) => p.id === plantId);
  if (!plant) {
    redirect("/rosliny");
    return;
  }

  const rowNum = parseIntSafe(formData.get("row_num"));
  const colNum = parseIntSafe(formData.get("col_num"));

  if (rowNum < 1 || rowNum > 24 || colNum < 1 || colNum > 120) {
    throw new Error("Współrzędne muszą mieścić się w zakresie 1-24 (wiersz) i 1-120 (kolumna).");
  }
  assertPlantPositionAvailable(db.plants, rowNum, colNum, plantId);

  const groupId = text(formData.get("group_id"));

  plant.display_name = text(formData.get("display_name"));
  plant.species = text(formData.get("species"));
  plant.variety = text(formData.get("variety"));
  plant.original_label = text(formData.get("original_label"));
  plant.category = parseCategory(text(formData.get("category")));
  plant.group_id = groupId || null;
  plant.row_num = rowNum;
  plant.col_num = colNum;
  plant.notes = text(formData.get("notes"));
  plant.updated_at = nowIso();

  await writeDb(db);
  refreshAll();
  redirect(`/rosliny/${plantId}`);
}

export async function deletePlant(formData: FormData): Promise<void> {
  const plantId = text(formData.get("id"));
  const db = await readDb();
  db.plants = db.plants.filter((p) => p.id !== plantId);
  db.treatments = db.treatments.filter((t) => t.plant_id !== plantId);
  db.observations = db.observations.filter((o) => o.plant_id !== plantId);
  await writeDb(db);
  refreshAll();
  redirect("/rosliny");
}

export async function movePlantOnMap(input: {
  plantId: string;
  rowNum: number;
  colNum: number;
}): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const db = await readDb();
  const plant = db.plants.find((item) => item.id === input.plantId);

  if (!plant) {
    return { ok: false, message: "Nie znaleziono rośliny do przeniesienia." };
  }

  if (input.rowNum < 1 || input.rowNum > 24 || input.colNum < 1 || input.colNum > 120) {
    return {
      ok: false,
      message: "Pole docelowe jest poza mapą. Wybierz komórkę w zakresie 24 × 120.",
    };
  }

  if (plant.row_num === input.rowNum && plant.col_num === input.colNum) {
    return {
      ok: true,
      message: `${plant.display_name} już znajduje się w tym polu.`,
    };
  }

  try {
    assertPlantPositionAvailable(db.plants, input.rowNum, input.colNum, plant.id);
  } catch {
    return {
      ok: false,
      message: "To pole jest już zajęte. Wybierz puste pole na mapie.",
    };
  }

  plant.row_num = input.rowNum;
  plant.col_num = input.colNum;
  plant.updated_at = nowIso();

  await writeDb(db);
  refreshAll();
  revalidatePlantDetailPaths(plant.id);

  return {
    ok: true,
    message: `Przeniesiono ${plant.display_name} do wiersza ${input.rowNum}, kolumny ${input.colNum}.`,
  };
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
    const importSource = text(formData.get("import_source")) === "sample" ? "sample" : "upload";
    let csvText = "";
    let sourceName = "";

    if (importSource === "sample") {
      csvText = await fs.readFile(SAMPLE_GARDEN_CSV_PATH, "utf8");
      sourceName = "przykladowy-arkusz-ogrodu.csv";
    } else {
      const file = formData.get("csv_file");
      if (!isUploadedFile(file) || file.size === 0) {
        return {
          status: "error",
          message: "Wybierz plik CSV albo użyj przykładu z repo.",
          summary: null,
        };
      }

      if (file.size > 2 * 1024 * 1024) {
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
    const summary = importPlantsFromGrid(db, csvText, sourceName);
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

export async function createProduct(formData: FormData): Promise<void> {
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
    created_at: timestamp,
    updated_at: timestamp,
  });

  await writeDb(db);
  refreshAll();
  redirect("/zabiegi");
}

export async function updateTreatment(formData: FormData): Promise<void> {
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
  treatment.updated_at = nowIso();

  await writeDb(db);
  refreshAll();
  redirect("/zabiegi");
}

export async function deleteTreatment(formData: FormData): Promise<void> {
  const treatmentId = text(formData.get("id"));
  const db = await readDb();
  db.treatments = db.treatments.filter((t) => t.id !== treatmentId);
  await writeDb(db);
  refreshAll();
  redirect("/zabiegi");
}

export async function createObservation(formData: FormData): Promise<void> {
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
  const observationId = text(formData.get("id"));
  const db = await readDb();
  db.observations = db.observations.filter((o) => o.id !== observationId);
  await writeDb(db);
  refreshAll();
  redirect("/obserwacje");
}
