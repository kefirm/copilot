import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePlant } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { categoryOptions } from "@/lib/plants";

export default async function EdytujRoslinePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const plant = db.plants.find((item) => item.id === id);
  if (!plant) return notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edycja rośliny</h1>
      <form action={updatePlant} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-2">
        <input type="hidden" name="id" value={plant.id} />
        <label className="flex flex-col gap-1">
          Nazwa wyświetlana
          <input name="display_name" defaultValue={plant.display_name} required />
        </label>
        <label className="flex flex-col gap-1">
          Gatunek
          <input name="species" defaultValue={plant.species} required />
        </label>
        <label className="flex flex-col gap-1">
          Odmiana
          <input name="variety" defaultValue={plant.variety} />
        </label>
        <label className="flex flex-col gap-1">
          Oryginalna etykieta
          <input name="original_label" defaultValue={plant.original_label} />
        </label>
        <label className="flex flex-col gap-1">
          Kategoria
          <select name="category" required defaultValue={plant.category}>
            {categoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Grupa logiczna
          <select name="group_id" defaultValue={plant.group_id ?? ""}>
            <option value="">Brak</option>
            {db.groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Wiersz (1-120)
          <input type="number" min={1} max={120} name="row_num" defaultValue={plant.row_num} required />
        </label>
        <label className="flex flex-col gap-1">
          Kolumna (1-30)
          <input type="number" min={1} max={30} name="col_num" defaultValue={plant.col_num} required />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          Notatki
          <textarea name="notes" rows={3} defaultValue={plant.notes} />
        </label>
        <div className="flex gap-2 md:col-span-2">
          <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
            Zapisz
          </button>
          <Link href={`/rosliny/${plant.id}`} className="rounded-md border px-4 py-2 text-sm">
            Anuluj
          </Link>
        </div>
      </form>
    </div>
  );
}
