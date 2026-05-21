import Link from "next/link";
import { createGroup, deleteGroup } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function GrupyPage() {
  const db = await readDb();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Grupy</h1>
      <form action={createGroup} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-3">
        <label className="flex flex-col gap-1 md:col-span-1">
          Nazwa grupy
          <input name="name" required />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          Opis
          <input name="description" />
        </label>
        <div className="md:col-span-3">
          <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
            Dodaj grupę
          </button>
        </div>
      </form>

      <div className="overflow-auto rounded-lg border border-zinc-200 bg-white">
        <table>
          <thead>
            <tr>
              <th>Nazwa</th>
              <th>Opis</th>
              <th>Rośliny</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {db.groups.length === 0 ? (
              <tr>
                <td colSpan={4}>Brak grup.</td>
              </tr>
            ) : (
              db.groups.map((group) => (
                <tr key={group.id}>
                  <td>{group.name}</td>
                  <td>{group.description || "-"}</td>
                  <td>{db.plants.filter((p) => p.group_id === group.id).length}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/grupy/${group.id}`} className="rounded border px-2 py-1 text-xs">
                        Szczegóły
                      </Link>
                      <form action={deleteGroup}>
                        <input type="hidden" name="id" value={group.id} />
                        <ConfirmSubmitButton
                          label="Usuń"
                          message="Czy na pewno usunąć grupę?"
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
