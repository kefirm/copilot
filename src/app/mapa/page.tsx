import { readDb } from "@/lib/db";
import { GardenMap } from "@/components/garden-map";

const ROWS = 24;
const COLS = 120;

export default async function MapaPage() {
  const db = await readDb();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mapa ogrodu ({ROWS} × {COLS})</h1>
      <GardenMap initialPlants={db.plants} rows={ROWS} cols={COLS} />
    </div>
  );
}
