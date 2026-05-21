import Link from "next/link";
import { notFound } from "next/navigation";
import { updateObservation } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { READ_ONLY_MESSAGE, isReadOnlyModeEnabled } from "@/lib/read-only";

export default async function EdytujObserwacjePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const observation = db.observations.find((item) => item.id === id);
  if (!observation) return notFound();
  if (isReadOnlyModeEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Edycja obserwacji</h1>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">{READ_ONLY_MESSAGE}</div>
        <Link href="/obserwacje" className="text-sm text-zinc-600 hover:underline">
          ← Wróć do listy obserwacji
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edycja obserwacji</h1>
      <form action={updateObservation} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <input type="hidden" name="id" value={observation.id} />
        <label className="flex flex-col gap-1">
          Roślina
          <select name="plant_id" defaultValue={observation.plant_id} required>
            {db.plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.display_name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Data
          <input type="date" name="date" defaultValue={observation.date} required />
        </label>
        <label className="flex flex-col gap-1">
          Typ obserwacji
          <input name="observation_type" defaultValue={observation.observation_type} required />
        </label>
        <label className="flex flex-col gap-1">
          Tytuł
          <input name="title" defaultValue={observation.title} required />
        </label>
        <label className="flex flex-col gap-1">
          Opis
          <textarea name="description" rows={4} defaultValue={observation.description} />
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
