import Link from "next/link";
import { deleteObservation } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { isReadOnlyModeEnabled } from "@/lib/read-only";
import { formatDate } from "@/lib/utils";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function ObserwacjePage() {
  const readOnly = isReadOnlyModeEnabled();
  const db = await readDb();
  const plantsById = new Map(db.plants.map((plant) => [plant.id, plant]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Obserwacje</h1>
        {!readOnly ? (
          <Link href="/obserwacje/nowa" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
            Dodaj obserwację
          </Link>
        ) : null}
      </div>

      <div className="overflow-auto rounded-lg border border-zinc-200 bg-white">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Roślina</th>
              <th>Typ</th>
              <th>Tytuł</th>
              <th>Opis</th>
              {!readOnly ? <th>Akcje</th> : null}
            </tr>
          </thead>
          <tbody>
            {db.observations.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 5 : 6}>Brak obserwacji.</td>
              </tr>
            ) : (
              db.observations.map((observation) => (
                <tr key={observation.id}>
                  <td>{formatDate(observation.date)}</td>
                  <td>{plantsById.get(observation.plant_id)?.display_name ?? "Roślina usunięta"}</td>
                  <td>{observation.observation_type}</td>
                  <td>{observation.title}</td>
                  <td>{observation.description || "-"}</td>
                  {!readOnly ? (
                    <td>
                      <div className="flex gap-2">
                        <Link href={`/obserwacje/${observation.id}/edytuj`} className="rounded border px-2 py-1 text-xs">
                          Edytuj
                        </Link>
                        <form action={deleteObservation}>
                          <input type="hidden" name="id" value={observation.id} />
                          <ConfirmSubmitButton
                            label="Usuń"
                            message="Czy na pewno usunąć obserwację?"
                            className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                          />
                        </form>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
