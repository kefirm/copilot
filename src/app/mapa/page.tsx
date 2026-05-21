"use client";

import Link from "next/link";
import { Fragment, useMemo } from "react";
import { GRID_COLS, GRID_ROWS, loadDb } from "@/lib/garden";

export default function MapaPage() {
  const db = loadDb();

  const plantByCell = useMemo(() => {
    const map = new Map<string, { id: string; displayName: string }>();
    db.plants.forEach((plant) => {
      map.set(`${plant.rowNum}-${plant.colNum}`, {
        id: plant.id,
        displayName: plant.displayName,
      });
    });
    return map;
  }, [db.plants]);

  const rows = Array.from({ length: GRID_ROWS }, (_, index) => index + 1);
  const cols = Array.from({ length: GRID_COLS }, (_, index) => index + 1);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Mapa ogrodu</h1>
      <p className="text-sm text-zinc-600">Siatka {GRID_ROWS} × {GRID_COLS}, jedna komórka = jedna roślina.</p>

      <div className="overflow-auto rounded-xl border border-zinc-300 bg-white p-2">
        <div
          className="grid gap-px bg-zinc-200"
          style={{
            gridTemplateColumns: `56px repeat(${GRID_COLS}, minmax(120px, 120px))`,
          }}
        >
          <div className="sticky left-0 z-10 bg-zinc-100 p-2 text-center text-xs font-semibold">R/C</div>
          {cols.map((col) => (
            <div key={`header-${col}`} className="bg-zinc-100 p-2 text-center text-xs font-semibold">
              {col}
            </div>
          ))}

          {rows.map((row) => (
            <Fragment key={`row-wrap-${row}`}>
              <div className="sticky left-0 z-10 bg-zinc-100 p-2 text-center text-xs font-semibold">{row}</div>
              {cols.map((col) => {
                const plant = plantByCell.get(`${row}-${col}`);
                return (
                  <div key={`${row}-${col}`} className="min-h-14 bg-white p-1 text-xs">
                    {plant ? (
                      <Link href={`/rosliny/${plant.id}`} className="block text-emerald-800 hover:underline">
                        {plant.displayName}
                      </Link>
                    ) : null}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
