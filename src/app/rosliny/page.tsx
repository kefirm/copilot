import Link from "next/link";
import { PlantImportForm, PlantImportFormReadOnly } from "@/components/plant-import-form";
import { autoAssignPlantGroups, deletePlant } from "@/lib/actions";
import { syncPlantsFromGoogleSheetIfDue } from "@/lib/auto-sheet-sync";
import { readDb } from "@/lib/db";
import { categoryLabel } from "@/lib/plants";
import { isReadOnlyModeEnabled } from "@/lib/read-only";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import type { Plant } from "@/lib/types";

function qp(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

type PlantSortKey = "name" | "category";

function sortPlants(plants: Plant[], sortBy: PlantSortKey, sortOrder: "asc" | "desc"): Plant[] {
  const direction = sortOrder === "desc" ? -1 : 1;
  return [...plants].sort((a, b) => {
    const left = sortBy === "category" ? a.category : a.display_name;
    const right = sortBy === "category" ? b.category : b.display_name;
    return left.localeCompare(right, "pl-PL", { sensitivity: "base" }) * direction;
  });
}

function sortTextValues(values: string[]): string[] {
  return values.sort((a, b) => a.localeCompare(b, "pl-PL", { sensitivity: "base" }));
}

function plantsFilterHref(filters: {
  category: string;
  species: string;
  group: string;
  sort: PlantSortKey;
  order: "asc" | "desc";
}): string {
  const params = new URLSearchParams();
  params.set("sort", filters.sort);
  params.set("order", filters.order);
  params.set("category", filters.category);
  params.set("species", filters.species);
  params.set("group", filters.group);
  return `/rosliny?${params.toString()}`;
}

export default async function RoslinyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const readOnly = isReadOnlyModeEnabled();
  await syncPlantsFromGoogleSheetIfDue();
  const params = await searchParams;
  const db = await readDb();
  const groupsById = new Map(db.groups.map((group) => [group.id, group]));
  const categoryFilter = qp(params.category);
  const speciesFilter = qp(params.species);
  const groupFilter = qp(params.group);
  const sortByRaw = qp(params.sort);
  const sortOrderRaw = qp(params.order);
  const sortBy: PlantSortKey = sortByRaw === "category" ? "category" : "name";
  const sortOrder: "asc" | "desc" = sortOrderRaw === "desc" ? "desc" : "asc";

  const categoryOptions = sortTextValues([...new Set(db.plants.map((plant) => plant.category))]);
  const speciesOptions = sortTextValues(
    [
      ...new Set(
        db.plants.map((plant) => `${plant.species}${plant.variety ? ` / ${plant.variety}` : ""}`),
      ),
    ],
  );
  const groupOptions = sortTextValues(
    [
      ...new Set(
        db.plants
          .map((plant) => (plant.group_id ? (groupsById.get(plant.group_id)?.name ?? "") : ""))
          .filter(Boolean),
      ),
    ],
  );

  const filteredPlants = db.plants.filter((plant) => {
    const speciesVariety = `${plant.species}${plant.variety ? ` / ${plant.variety}` : ""}`;
    const groupName = plant.group_id ? (groupsById.get(plant.group_id)?.name ?? "") : "";

    return (
      (!categoryFilter || plant.category === categoryFilter) &&
      (!speciesFilter || speciesVariety === speciesFilter) &&
      (!groupFilter || groupName === groupFilter)
    );
  });

  const visiblePlants = sortPlants(filteredPlants, sortBy, sortOrder);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rośliny</h1>
        {!readOnly ? (
          <div className="flex gap-2">
            <form action={autoAssignPlantGroups}>
              <button type="submit" className="rounded-md border px-4 py-2 text-sm">
                Auto-przypisz grupy
              </button>
            </form>
            <Link href="/rosliny/nowa" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
              Dodaj roślinę
            </Link>
          </div>
        ) : null}
      </div>

      {readOnly ? <PlantImportFormReadOnly /> : <PlantImportForm />}

      <form method="get" className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-4">
        <input type="hidden" name="sort" value={sortBy} />
        <input type="hidden" name="order" value={sortOrder} />
        <label className="flex flex-col gap-1 text-sm">
          Kategoria
          <select name="category" defaultValue={categoryFilter}>
            <option value="">Wszystkie</option>
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {categoryLabel[option as keyof typeof categoryLabel] ?? option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Gatunek/odmiana
          <select name="species" defaultValue={speciesFilter}>
            <option value="">Wszystkie</option>
            {speciesOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Grupa
          <select name="group" defaultValue={groupFilter}>
            <option value="">Wszystkie</option>
            {groupOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-2 md:col-span-4">
          <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
            Filtruj
          </button>
          <Link href="/rosliny" className="rounded-md border px-4 py-2 text-sm">
            Wyczyść
          </Link>
          <span className="text-sm text-zinc-600">{visiblePlants.length} wyników</span>
        </div>
      </form>

      <div className="overflow-auto rounded-lg border border-zinc-200 bg-white">
        <table>
          <thead>
            <tr>
              <th>
                <div className="flex items-center gap-1">
                  Nazwa
                  <Link
                    href={plantsFilterHref({
                      category: categoryFilter,
                      species: speciesFilter,
                      group: groupFilter,
                      sort: "name",
                      order: "asc",
                    })}
                    className={sortBy === "name" && sortOrder === "asc" ? "font-semibold" : "text-zinc-500"}
                  >
                    ↑
                  </Link>
                  <Link
                    href={plantsFilterHref({
                      category: categoryFilter,
                      species: speciesFilter,
                      group: groupFilter,
                      sort: "name",
                      order: "desc",
                    })}
                    className={sortBy === "name" && sortOrder === "desc" ? "font-semibold" : "text-zinc-500"}
                  >
                    ↓
                  </Link>
                </div>
              </th>
              <th>
                <div className="flex items-center gap-1">
                  Kategoria
                  <Link
                    href={plantsFilterHref({
                      category: categoryFilter,
                      species: speciesFilter,
                      group: groupFilter,
                      sort: "category",
                      order: "asc",
                    })}
                    className={sortBy === "category" && sortOrder === "asc" ? "font-semibold" : "text-zinc-500"}
                  >
                    ↑
                  </Link>
                  <Link
                    href={plantsFilterHref({
                      category: categoryFilter,
                      species: speciesFilter,
                      group: groupFilter,
                      sort: "category",
                      order: "desc",
                    })}
                    className={sortBy === "category" && sortOrder === "desc" ? "font-semibold" : "text-zinc-500"}
                  >
                    ↓
                  </Link>
                </div>
              </th>
              <th>Gatunek/odmiana</th>
              <th>Grupa</th>
              <th>Pozycja</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {visiblePlants.length === 0 ? (
              <tr>
                <td colSpan={6}>Brak roślin.</td>
              </tr>
            ) : (
              visiblePlants.map((plant) => (
                <tr key={plant.id}>
                  <td>{plant.display_name}</td>
                  <td>{categoryLabel[plant.category] ?? plant.category}</td>
                  <td>
                    {plant.species}
                    {plant.variety ? ` / ${plant.variety}` : ""}
                  </td>
                  <td>{plant.group_id ? groupsById.get(plant.group_id)?.name ?? "-" : "-"}</td>
                  <td>
                    R{plant.row_num} C{plant.col_num}
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/rosliny/${plant.id}`} className="rounded border px-2 py-1 text-xs">
                        Szczegóły
                      </Link>
                      {!readOnly ? (
                        <Link href={`/rosliny/${plant.id}/edytuj`} className="rounded border px-2 py-1 text-xs">
                          Edytuj
                        </Link>
                      ) : null}
                      {!readOnly ? (
                        <form action={deletePlant}>
                          <input type="hidden" name="id" value={plant.id} />
                          <ConfirmSubmitButton
                            label="Usuń"
                            message="Czy na pewno usunąć roślinę?"
                            className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                          />
                        </form>
                      ) : null}
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
