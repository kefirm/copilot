import Link from "next/link";
import { PlantImportForm } from "@/components/plant-import-form";
import { deletePlant } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { categoryLabel } from "@/lib/plants";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function RoslinyPage() {
  const db = await readDb();
  const groupsById = new Map(db.groups.map((group) => [group.id, group]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Rośliny</h1>
        <Link href="/rosliny/nowa" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
          Dodaj roślinę
        </Link>
      </div>

      <PlantImportForm />

      <div className="overflow-auto rounded-lg border border-zinc-200 bg-white">
        <table>
          <thead>
            <tr>
              <th>Nazwa</th>
              <th>Kategoria</th>
              <th>Gatunek/odmiana</th>
              <th>Grupa</th>
              <th>Pozycja</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {db.plants.length === 0 ? (
              <tr>
                <td colSpan={6}>Brak roślin.</td>
              </tr>
            ) : (
              db.plants.map((plant) => (
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
                      <Link href={`/rosliny/${plant.id}/edytuj`} className="rounded border px-2 py-1 text-xs">
                        Edytuj
                      </Link>
                      <form action={deletePlant}>
                        <input type="hidden" name="id" value={plant.id} />
                        <ConfirmSubmitButton
                          label="Usuń"
                          message="Czy na pewno usunąć roślinę?"
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                        />
                      </form>
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
