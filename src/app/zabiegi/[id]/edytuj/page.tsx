import Link from "next/link";
import { notFound } from "next/navigation";
import { updateTreatment } from "@/lib/actions";
import { readDb } from "@/lib/db";

export default async function EdytujZabiegPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const treatment = db.treatments.find((item) => item.id === id);
  if (!treatment) return notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edycja zabiegu</h1>
      <form action={updateTreatment} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-2">
        <input type="hidden" name="id" value={treatment.id} />
        <label className="flex flex-col gap-1">
          Typ celu
          <select name="target_type" defaultValue={treatment.target_type} required>
            <option value="plant">Pojedyncza roślina</option>
            <option value="group">Grupa</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Roślina (gdy cel = roślina)
          <select name="plant_id" defaultValue={treatment.plant_id ?? ""}>
            <option value="">Brak</option>
            {db.plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.display_name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Grupa (gdy cel = grupa)
          <select name="group_id" defaultValue={treatment.group_id ?? ""}>
            <option value="">Brak</option>
            {db.groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Typ zabiegu
          <select name="treatment_type" defaultValue={treatment.treatment_type} required>
            <option value="spray">Oprysk</option>
            <option value="fertilization">Nawożenie</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Data
          <input type="date" name="date" defaultValue={treatment.date} required />
        </label>
        <label className="flex flex-col gap-1">
          Produkt (lista)
          <select name="product_id" defaultValue={treatment.product_id ?? ""}>
            <option value="">Wpiszę ręcznie</option>
            {db.products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Ręczna nazwa produktu
          <input name="product_name_manual" defaultValue={treatment.product_name_manual} />
        </label>
        <label className="flex flex-col gap-1">
          Dawka
          <input name="dose" defaultValue={treatment.dose} />
        </label>
        <label className="flex flex-col gap-1">
          Jednostka
          <input name="unit" defaultValue={treatment.unit} />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          Powód
          <input name="reason" defaultValue={treatment.reason} />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          Notatki
          <textarea name="notes" rows={3} defaultValue={treatment.notes} />
        </label>
        <div className="md:col-span-2 flex gap-2">
          <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
            Zapisz
          </button>
          <Link href="/zabiegi" className="rounded-md border px-4 py-2 text-sm">
            Anuluj
          </Link>
        </div>
      </form>
    </div>
  );
}
