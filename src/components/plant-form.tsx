"use client";

import { useState } from "react";
import {
  Group,
  Plant,
  PlantCategory,
  categoryLabels,
  loadDb,
  savePlant,
} from "@/lib/garden";
import { useRouter } from "next/navigation";

type PlantFormProps = {
  mode: "create" | "edit";
  plant?: Plant;
  groups: Group[];
};

const categories: PlantCategory[] = ["tree", "shrub", "vine", "potted"];

export function PlantForm({ mode, plant, groups }: PlantFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    displayName: plant?.displayName ?? "",
    species: plant?.species ?? "",
    variety: plant?.variety ?? "",
    originalLabel: plant?.originalLabel ?? "",
    category: plant?.category ?? "tree",
    groupId: plant?.groupId ?? "",
    rowNum: String(plant?.rowNum ?? 1),
    colNum: String(plant?.colNum ?? 1),
    notes: plant?.notes ?? "",
  });

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    const rowNum = Number(form.rowNum);
    const colNum = Number(form.colNum);

    if (!form.displayName.trim()) {
      setError("Nazwa rośliny jest wymagana.");
      return;
    }

    if (!Number.isInteger(rowNum) || rowNum < 1 || rowNum > 24) {
      setError("Wiersz musi być liczbą od 1 do 24.");
      return;
    }

    if (!Number.isInteger(colNum) || colNum < 1 || colNum > 120) {
      setError("Kolumna musi być liczbą od 1 do 120.");
      return;
    }

    try {
      savePlant(
        {
          displayName: form.displayName.trim(),
          species: form.species.trim(),
          variety: form.variety.trim(),
          originalLabel: form.originalLabel.trim(),
          category: form.category as PlantCategory,
          groupId: form.groupId || null,
          rowNum,
          colNum,
          notes: form.notes.trim(),
        },
        plant?.id,
      );
      router.push("/rosliny");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się zapisać rośliny.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <label className="block text-sm">
        Nazwa wyświetlana *
        <input
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          value={form.displayName}
          onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
        />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm">
          Gatunek
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={form.species}
            onChange={(e) => setForm((prev) => ({ ...prev, species: e.target.value }))}
          />
        </label>

        <label className="block text-sm">
          Odmiana
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={form.variety}
            onChange={(e) => setForm((prev) => ({ ...prev, variety: e.target.value }))}
          />
        </label>
      </div>

      <label className="block text-sm">
        Oryginalna etykieta
        <input
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          value={form.originalLabel}
          onChange={(e) => setForm((prev) => ({ ...prev, originalLabel: e.target.value }))}
        />
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="block text-sm">
          Kategoria
          <select
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={form.category}
            onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as PlantCategory }))}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {categoryLabels[category]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          Wiersz (1-24)
          <input
            type="number"
            min={1}
            max={24}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={form.rowNum}
            onChange={(e) => setForm((prev) => ({ ...prev, rowNum: e.target.value }))}
          />
        </label>

        <label className="block text-sm">
          Kolumna (1-120)
          <input
            type="number"
            min={1}
            max={120}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={form.colNum}
            onChange={(e) => setForm((prev) => ({ ...prev, colNum: e.target.value }))}
          />
        </label>
      </div>

      <label className="block text-sm">
        Grupa
        <select
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          value={form.groupId}
          onChange={(e) => setForm((prev) => ({ ...prev, groupId: e.target.value }))}
        >
          <option value="">Brak</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        Notatki
        <textarea
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />
      </label>

      <div className="flex gap-2">
        <button className="rounded bg-emerald-600 px-4 py-2 text-white" type="submit">
          {mode === "create" ? "Dodaj roślinę" : "Zapisz zmiany"}
        </button>
        <button
          className="rounded border border-zinc-300 px-4 py-2"
          type="button"
          onClick={() => {
            router.push("/rosliny");
          }}
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}

export function useGroupsForPlantForm() {
  return loadDb().groups;
}
