"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { deleteGroup, loadDb, saveGroup } from "@/lib/garden";

export default function GrupyPage() {
  const [db, setDb] = useState(loadDb());
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const refresh = () => setDb(loadDb());

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Grupy roślin</h1>

      <form
        className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError("");
          if (!name.trim()) {
            setError("Nazwa grupy jest wymagana.");
            return;
          }
          try {
            saveGroup({ name: name.trim(), description: description.trim() });
            setName("");
            setDescription("");
            refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Nie udało się zapisać grupy.");
          }
        }}
      >
        <h2 className="text-lg font-semibold">Dodaj grupę</h2>
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <label className="block text-sm">
          Nazwa grupy *
          <input className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm">
          Opis
          <textarea className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <button className="rounded bg-emerald-600 px-3 py-2 text-white" type="submit">Dodaj</button>
      </form>

      <div className="overflow-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <th className="px-3 py-2">Nazwa</th>
              <th className="px-3 py-2">Opis</th>
              <th className="px-3 py-2">Liczba roślin</th>
              <th className="px-3 py-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {db.groups.length === 0 ? (
              <tr><td className="px-3 py-4" colSpan={4}>Brak grup.</td></tr>
            ) : (
              db.groups.map((group) => (
                <tr key={group.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2">{group.name}</td>
                  <td className="px-3 py-2">{group.description || "-"}</td>
                  <td className="px-3 py-2">{db.plants.filter((plant) => plant.groupId === group.id).length}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/grupy/${group.id}`} className="rounded border border-zinc-300 px-2 py-1">Szczegóły</Link>
                      <button
                        className="rounded border border-red-200 px-2 py-1 text-red-700"
                        onClick={() => {
                          if (window.confirm("Usunąć grupę? Operacja jest nieodwracalna.")) {
                            deleteGroup(group.id);
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
