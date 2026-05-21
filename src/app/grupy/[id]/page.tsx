import { notFound } from "next/navigation";
import Link from "next/link";
import { deleteGroup, updateGroup } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function GrupaDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const group = db.groups.find((item) => item.id === id);
  if (!group) return notFound();

  const plants = db.plants.filter((plant) => plant.group_id === group.id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Grupa: {group.name}</h1>

      <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <form action={updateGroup} className="grid gap-3">
          <input type="hidden" name="id" value={group.id} />
          <label className="flex flex-col gap-1">
            Nazwa
            <input name="name" defaultValue={group.name} required />
          </label>
          <label className="flex flex-col gap-1">
            Opis
            <textarea name="description" rows={3} defaultValue={group.description} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
              Zapisz zmiany
            </button>
          </div>
        </form>
        <form action={deleteGroup}>
          <input type="hidden" name="id" value={group.id} />
          <ConfirmSubmitButton
            label="Usuń grupę"
            message="Czy na pewno usunąć grupę?"
            className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700"
          />
        </form>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="mb-2 font-medium">Rośliny w grupie</h2>
        {plants.length === 0 ? (
          <p className="text-sm text-zinc-600">Brak roślin.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {plants.map((plant) => (
              <li key={plant.id}>
                <Link href={`/rosliny/${plant.id}`} className="hover:underline">
                  {plant.display_name} (R{plant.row_num} C{plant.col_num})
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link href="/grupy" className="text-sm text-zinc-600 hover:underline">
        ← Wróć do grup
      </Link>
    </div>
  );
}
