"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deleteTreatment,
  findGroupName,
  findPlantName,
  findProductName,
  loadDb,
  treatmentLabels,
} from "@/lib/garden";

export default function ZabiegiPage() {
  const [db, setDb] = useState(loadDb());

  const refresh = () => setDb(loadDb());

  useEffect(() => {
    refresh();
  }, []);

  const treatments = [...db.treatments].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Zabiegi</h1>
        <Link href="/zabiegi/nowy" className="rounded bg-emerald-600 px-3 py-2 text-white">
          Dodaj zabieg
        </Link>
      </div>

      <div className="overflow-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Typ</th>
              <th className="px-3 py-2">Cel</th>
              <th className="px-3 py-2">Produkt</th>
              <th className="px-3 py-2">Dawka</th>
              <th className="px-3 py-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {treatments.length === 0 ? (
              <tr><td className="px-3 py-4" colSpan={6}>Brak zabiegów.</td></tr>
            ) : (
              treatments.map((item) => (
                <tr key={item.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2">{item.date}</td>
                  <td className="px-3 py-2">{treatmentLabels[item.treatmentType]}</td>
                  <td className="px-3 py-2">
                    {item.targetType === "plant" ? findPlantName(db, item.plantId) : findGroupName(db, item.groupId)}
                  </td>
                  <td className="px-3 py-2">{findProductName(db, item.productId, item.productNameManual)}</td>
                  <td className="px-3 py-2">{item.dose} {item.unit}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/zabiegi/${item.id}/edytuj`} className="rounded border border-zinc-300 px-2 py-1">Edytuj</Link>
                      <button
                        className="rounded border border-red-200 px-2 py-1 text-red-700"
                        onClick={() => {
                          if (window.confirm("Usunąć zabieg? Operacja jest nieodwracalna.")) {
                            deleteTreatment(item.id);
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
