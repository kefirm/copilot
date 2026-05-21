import { readDb } from "@/lib/db";
import { MapGrid } from "@/components/map-grid";

const ROWS = 120;
const COLS = 30;

export default async function MapaPage() {
  const db = await readDb();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mapa ogrodu ({ROWS} × {COLS})</h1>
      <p className="text-sm text-zinc-600">
        Przeciągnij roślinę do nowej komórki. Kliknij nazwę rośliny, aby pokazać akcje.
      </p>
      <MapGrid plants={db.plants} rows={ROWS} cols={COLS} />
    </div>
  );
}
