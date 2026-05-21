"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { categoryLabels, deletePlant, findGroupName, loadDb } from "@/lib/garden";

export default function RoslinyPage() {
  const [db, setDb] = useState(loadDb());

  const refresh = () => setDb(loadDb());

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Rośliny</h1>
        <Link href="/rosliny/nowa" className="rounded bg-emerald-600 px-3 py-2 text-white">
          Dodaj roślinę
        </Link>
      </div>

      <div className="overflow-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <th className="px-3 py-2">Nazwa</th>
              <th className="px-3 py-2">Gatunek</th>
              <th className="px-3 py-2">Kategoria</th>
              <th className="px-3 py-2">Grupa</th>
              <th className="px-3 py-2">Pozycja</th>
              <th className="px-3 py-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {db.plants.length === 0 ? (
              <tr>
                <td className="px-3 py-4" colSpan={6}>
                  Brak roślin.
                </td>
              </tr>
            ) : (
              db.plants.map((plant) => (
                <tr key={plant.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2">{plant.displayName}</td>
                  <td className="px-3 py-2">{plant.species || "-"}</td>
                  <td className="px-3 py-2">{categoryLabels[plant.category]}</td>
                  <td className="px-3 py-2">{findGroupName(db, plant.groupId)}</td>
                  <td className="px-3 py-2">R{plant.rowNum} C{plant.colNum}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link className="rounded border border-zinc-300 px-2 py-1" href={`/rosliny/${plant.id}`}>
                        Szczegóły
                      </Link>
                      <Link className="rounded border border-zinc-300 px-2 py-1" href={`/rosliny/${plant.id}/edytuj`}>
                        Edytuj
                      </Link>
                      <button
                        className="rounded border border-red-200 px-2 py-1 text-red-700"
                        onClick={() => {
                          if (window.confirm("Usunąć roślinę? Operacja jest nieodwracalna.")) {
                            deletePlant(plant.id);
                            refresh();
                          }
                        }}
                      >
                        Usuń
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
