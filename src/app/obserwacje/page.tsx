"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ObservationType,
  deleteObservation,
  findPlantName,
  loadDb,
  observationTypeLabels,
  saveObservation,
} from "@/lib/garden";

const observationTypes: ObservationType[] = ["disease", "pest", "general"];

export default function ObserwacjePage() {
  const [, forceRender] = useState(0);
  const db = loadDb();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    plantId: "",
    date: new Date().toISOString().slice(0, 10),
    observationType: "general",
    title: "",
    description: "",
  });

  const refresh = () => forceRender((v) => v + 1);

  const isPlantSelected = useMemo(() => db.plants.some((plant) => plant.id === form.plantId), [db.plants, form.plantId]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Obserwacje</h1>

      <form
        className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");

          if (!form.plantId || !isPlantSelected) {
            setError("Wybierz roślinę.");
            return;
          }

          if (!form.title.trim()) {
            setError("Tytuł obserwacji jest wymagany.");
            return;
          }

          saveObservation({
            plantId: form.plantId,
            date: form.date,
            observationType: form.observationType as ObservationType,
            title: form.title.trim(),
            description: form.description.trim(),
          });

          setForm((prev) => ({ ...prev, title: "", description: "" }));
          refresh();
        }}
      >
        <h2 className="text-lg font-semibold">Dodaj obserwację</h2>
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block text-sm">
            Roślina
            <select className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" value={form.plantId} onChange={(e) => setForm((prev) => ({ ...prev, plantId: e.target.value }))}>
              {db.plants.length === 0 && <option value="">Brak roślin</option>}
              {db.plants.length > 0 && !isPlantSelected && form.plantId && (
                <option value={form.plantId}>Wybierz roślinę</option>
              )}
              {db.plants.map((plant) => (
                <option key={plant.id} value={plant.id}>{plant.displayName}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Data
            <input type="date" className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
          </label>

          <label className="block text-sm">
            Typ
            <select className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" value={form.observationType} onChange={(e) => setForm((prev) => ({ ...prev, observationType: e.target.value }))}>
              {observationTypes.map((type) => (
                <option key={type} value={type}>{observationTypeLabels[type]}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm">
          Tytuł *
          <input className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
        </label>

        <label className="block text-sm">
          Opis
          <textarea className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" rows={3} value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
        </label>

        <button className="rounded bg-emerald-600 px-3 py-2 text-white" type="submit">Dodaj obserwację</button>
      </form>

      <div className="overflow-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Roślina</th>
              <th className="px-3 py-2">Typ</th>
              <th className="px-3 py-2">Tytuł</th>
              <th className="px-3 py-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {db.observations.length === 0 ? (
              <tr><td className="px-3 py-4" colSpan={5}>Brak obserwacji.</td></tr>
            ) : (
              [...db.observations].sort((a, b) => b.date.localeCompare(a.date)).map((item) => (
                <tr key={item.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2">{item.date}</td>
                  <td className="px-3 py-2">
                    <Link href={`/rosliny/${item.plantId}`} className="text-emerald-700 hover:underline">
                      {findPlantName(db, item.plantId)}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{observationTypeLabels[item.observationType]}</td>
                  <td className="px-3 py-2">{item.title}</td>
                  <td className="px-3 py-2">
                    <button
                      className="rounded border border-red-200 px-2 py-1 text-red-700"
                      onClick={() => {
                        if (window.confirm("Usunąć obserwację? Operacja jest nieodwracalna.")) {
                          deleteObservation(item.id);
                          refresh();
                        }
                      }}
                    >
                      Usuń
                    </button>
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
