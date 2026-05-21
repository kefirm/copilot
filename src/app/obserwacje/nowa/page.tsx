import Link from "next/link";
import { createObservation } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { READ_ONLY_MESSAGE, isReadOnlyModeEnabled } from "@/lib/read-only";

export default async function NowaObserwacjaPage() {
  if (isReadOnlyModeEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Nowa obserwacja</h1>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">{READ_ONLY_MESSAGE}</div>
        <Link href="/obserwacje" className="text-sm text-zinc-600 hover:underline">
          ← Wróć do listy obserwacji
        </Link>
      </div>
    );
  }

  const db = await readDb();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nowa obserwacja</h1>
      <form action={createObservation} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <label className="flex flex-col gap-1">
          Roślina
          <select name="plant_id" required defaultValue="">
            <option value="" disabled>
              Wybierz roślinę
            </option>
            {db.plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.display_name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Data
          <input type="date" name="date" required />
        </label>
        <label className="flex flex-col gap-1">
          Typ obserwacji
          <input name="observation_type" placeholder="np. choroba, wzrost" required />
        </label>
        <label className="flex flex-col gap-1">
          Tytuł
          <input name="title" required />
        </label>
        <label className="flex flex-col gap-1">
          Opis
          <textarea name="description" rows={4} />
        </label>
        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
            Zapisz
          </button>
          <Link href="/obserwacje" className="rounded-md border px-4 py-2 text-sm">
            Anuluj
          </Link>
        </div>
      </form>
    </div>
  );
}
