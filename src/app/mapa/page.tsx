import { readDb } from "@/lib/db";

const ROWS = 24;
const COLS = 120;

export default async function MapaPage() {
  const db = await readDb();
  const occupied = new Map(db.plants.map((plant) => [`${plant.row_num}:${plant.col_num}`, plant]));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mapa ogrodu ({ROWS} × {COLS})</h1>
      <p className="text-sm text-zinc-600">
        Komórka pokazuje nazwę rośliny tylko wtedy, gdy jest zajęta.
      </p>
      <div className="overflow-auto rounded-lg border border-zinc-200 bg-white">
        <div className="min-w-[2600px] p-3">
          <table>
            <thead>
              <tr>
                <th>Wiersz/Kol.</th>
                {Array.from({ length: COLS }, (_, col) => (
                  <th key={col + 1} className="text-center text-xs">{col + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }, (_, row) => {
                const rowNum = row + 1;
                return (
                  <tr key={rowNum}>
                    <th className="bg-zinc-50 text-center text-xs">{rowNum}</th>
                    {Array.from({ length: COLS }, (_, col) => {
                      const colNum = col + 1;
                      const plant = occupied.get(`${rowNum}:${colNum}`);
                      return (
                        <td key={colNum} className={plant ? "bg-emerald-50 text-xs" : "bg-white text-xs"}>
                          {plant?.display_name ?? ""}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
