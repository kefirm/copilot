import Link from "next/link";
import { notFound } from "next/navigation";
import { deletePlant } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { categoryLabel } from "@/lib/plants";
import { isReadOnlyModeEnabled } from "@/lib/read-only";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function RoslinaDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const readOnly = isReadOnlyModeEnabled();
  const { id } = await params;
  const db = await readDb();
  const plant = db.plants.find((item) => item.id === id);
  if (!plant) return notFound();

  const group = plant.group_id ? db.groups.find((item) => item.id === plant.group_id) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{plant.display_name}</h1>
        {!readOnly ? (
          <div className="flex gap-2">
            <Link href={`/rosliny/${plant.id}/edytuj`} className="rounded-md border px-3 py-2 text-sm">
              Edytuj
            </Link>
            <form action={deletePlant}>
              <input type="hidden" name="id" value={plant.id} />
              <ConfirmSubmitButton
                label="Usuń"
                message="Czy na pewno usunąć roślinę i powiązane zabiegi oraz obserwacje?"
                className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700"
              />
            </form>
          </div>
        ) : null}
      </div>
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <dl className="grid gap-3 md:grid-cols-2">
          <Meta label="Gatunek" value={plant.species} />
          <Meta label="Odmiana" value={plant.variety || "-"} />
          <Meta label="Oryginalna etykieta" value={plant.original_label || "-"} />
          <Meta label="Kategoria" value={categoryLabel[plant.category] ?? plant.category} />
          <Meta label="Grupa" value={group?.name ?? "-"} />
          <Meta label="Pozycja" value={`Wiersz ${plant.row_num}, kolumna ${plant.col_num}`} />
          <Meta label="Notatki" value={plant.notes || "-"} />
        </dl>
      </div>
      <Link href="/rosliny" className="text-sm text-zinc-600 hover:underline">
        ← Wróć do listy roślin
      </Link>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}
