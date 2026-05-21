import { promises as fs } from "node:fs";
import path from "node:path";
import { nowIso, readDb, writeDb } from "@/lib/db";
import { inferGroupIdForPlant } from "@/lib/grouping";
import { importPlantsFromGrid } from "@/lib/plant-import";

const AUTO_SYNC_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1fy1cGe-pLj0GIA7J_FqfWoRw69VSQINLPwllOBrL6oY/edit?gid=0#gid=0";
const AUTO_SYNC_META_PATH = path.join(process.cwd(), "data", "auto-sync.json");
const AUTO_SYNC_INTERVAL_MS = 60 * 1000;

type AutoSyncMeta = {
  last_attempt_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
};

const EMPTY_META: AutoSyncMeta = {
  last_attempt_at: null,
  last_success_at: null,
  last_error: null,
};

function toGoogleSheetParts(input: string): { sheetId: string; gid: string } {
  const url = new URL(input.trim());
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

async function readAutoSyncMeta(): Promise<AutoSyncMeta> {
  try {
    const raw = await fs.readFile(AUTO_SYNC_META_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<AutoSyncMeta>;
    return {
      last_attempt_at: parsed.last_attempt_at ?? null,
      last_success_at: parsed.last_success_at ?? null,
      last_error: parsed.last_error ?? null,
    };
  } catch {
    return EMPTY_META;
  }
}

async function writeAutoSyncMeta(meta: AutoSyncMeta): Promise<void> {
  await fs.mkdir(path.dirname(AUTO_SYNC_META_PATH), { recursive: true });
  await fs.writeFile(AUTO_SYNC_META_PATH, JSON.stringify(meta, null, 2), "utf8");
}

async function fetchGoogleSheetCsv(sheetUrl: string): Promise<string> {
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
    return primaryText;
  }

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
    throw new Error(
      'Nie mogę odczytać arkusza bez logowania. Ustaw udostępnienie "Każdy, kto ma link: Wyświetlający".',
    );
  }

  return fallbackText;
}

export async function syncPlantsFromGoogleSheetIfDue(): Promise<void> {
  const meta = await readAutoSyncMeta();
  const now = Date.now();
  const lastAttemptMs = meta.last_attempt_at ? new Date(meta.last_attempt_at).getTime() : 0;
  if (lastAttemptMs && now - lastAttemptMs < AUTO_SYNC_INTERVAL_MS) {
    return;
  }

  await writeAutoSyncMeta({
    ...meta,
    last_attempt_at: nowIso(),
  });

  try {
    const csvText = await fetchGoogleSheetCsv(AUTO_SYNC_SHEET_URL);
    const db = await readDb();
    db.plants = [];
    db.observations = [];
    db.treatments = db.treatments.filter((treatment) => treatment.target_type !== "plant");

    importPlantsFromGrid(db, csvText, `google-sheet:${AUTO_SYNC_SHEET_URL}`);
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

    await writeDb(db);
    await writeAutoSyncMeta({
      last_attempt_at: nowIso(),
      last_success_at: nowIso(),
      last_error: null,
    });
  } catch (error) {
    await writeAutoSyncMeta({
      last_attempt_at: nowIso(),
      last_success_at: meta.last_success_at,
      last_error: error instanceof Error ? error.message : "Nieznany błąd synchronizacji.",
    });
  }
}

