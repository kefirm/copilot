import { readDb } from "@/lib/db";
import { MapGrid } from "@/components/map-grid";
import { syncPlantsFromGoogleSheetIfDue } from "@/lib/auto-sheet-sync";
import { buildGroupColors } from "@/lib/group-colors";
import { isReadOnlyModeEnabled } from "@/lib/read-only";

const ROWS = 120;
const COLS = 24;
const START_VISIBLE_ROW = 36;

export default async function MapaPage() {
  const readOnly = isReadOnlyModeEnabled();
  await syncPlantsFromGoogleSheetIfDue();
  const db = await readDb();
  const groupColors = buildGroupColors(db.groups);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mapa ogrodu ({ROWS} × {COLS})</h1>
      <p className="text-sm text-zinc-600">
        {readOnly
          ? "Tryb podglądu: przeciąganie i usuwanie są wyłączone. Kliknij nazwę rośliny, aby pokazać szczegóły."
          : "Przeciągnij roślinę do nowej komórki. Kliknij nazwę rośliny, aby pokazać akcje. Wiersze 1-35 są ukryte."}
      </p>
      <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-xs">
        {db.groups.map((group) => (
          <span key={group.id} className="inline-flex items-center gap-2 rounded border px-2 py-1">
            <span
              className="inline-block h-3 w-3 rounded-full border border-zinc-400"
              style={{ backgroundColor: groupColors[group.id] || "#d4d4d8" }}
            />
            {group.name}
          </span>
        ))}
      </div>
      <MapGrid
        plants={db.plants}
        rows={ROWS}
        cols={COLS}
        startRow={START_VISIBLE_ROW}
        groupColors={groupColors}
        readOnly={readOnly}
      />
    </div>
  );
}
