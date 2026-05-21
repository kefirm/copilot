import Link from "next/link";
import { deleteTreatment } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

const typeLabel: Record<string, string> = {
  spray: "Oprysk",
  fertilization: "Nawożenie",
};

export default async function ZabiegiPage() {
  const db = await readDb();
  const plantsById = new Map(db.plants.map((item) => [item.id, item]));
  const groupsById = new Map(db.groups.map((item) => [item.id, item]));
  const productsById = new Map(db.products.map((item) => [item.id, item]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Zabiegi</h1>
        <Link href="/zabiegi/nowy" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
          Dodaj zabieg
        </Link>
      </div>

      <div className="overflow-auto rounded-lg border border-zinc-200 bg-white">
        <table>
          <thead>
            <tr>
              <th>Data</th>
              <th>Typ</th>
              <th>Cel</th>
              <th>Produkt</th>
              <th>Dawka</th>
              <th>Powód</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {db.treatments.length === 0 ? (
              <tr>
                <td colSpan={7}>Brak zabiegów.</td>
              </tr>
            ) : (
              db.treatments.map((treatment) => (
                <tr key={treatment.id}>
                  <td>{formatDate(treatment.date)}</td>
                  <td>{typeLabel[treatment.treatment_type] ?? treatment.treatment_type}</td>
                  <td>
                    {treatment.target_type === "plant"
                      ? plantsById.get(treatment.plant_id ?? "")?.display_name ?? "Roślina usunięta"
                      : groupsById.get(treatment.group_id ?? "")?.name ?? "Grupa usunięta"}
                  </td>
                  <td>
                    {treatment.product_id
                      ? productsById.get(treatment.product_id)?.name ?? "Produkt usunięty"
                      : treatment.product_name_manual || "-"}
                  </td>
                  <td>
                    {treatment.dose} {treatment.unit}
                  </td>
                  <td>{treatment.reason || "-"}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/zabiegi/${treatment.id}/edytuj`} className="rounded border px-2 py-1 text-xs">
                        Edytuj
                      </Link>
                      <form action={deleteTreatment}>
                        <input type="hidden" name="id" value={treatment.id} />
                        <ConfirmSubmitButton
                          label="Usuń"
                          message="Czy na pewno usunąć zabieg?"
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
