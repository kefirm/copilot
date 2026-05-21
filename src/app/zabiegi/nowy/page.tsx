import Link from "next/link";
import { createTreatment } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { READ_ONLY_MESSAGE, isReadOnlyModeEnabled } from "@/lib/read-only";

export default async function NowyZabiegPage() {
  if (isReadOnlyModeEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Nowy zabieg</h1>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">{READ_ONLY_MESSAGE}</div>
        <Link href="/zabiegi" className="text-sm text-zinc-600 hover:underline">
          ← Wróć do listy zabiegów
        </Link>
      </div>
    );
  }

  const db = await readDb();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nowy zabieg</h1>
      <form action={createTreatment} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-2">
        <label className="flex flex-col gap-1">
          Typ celu
          <select name="target_type" required defaultValue="plant">
            <option value="plant">Pojedyncza roślina</option>
            <option value="group">Grupa</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Roślina (gdy cel = roślina)
          <select name="plant_id" defaultValue="">
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
          <select name="group_id" defaultValue="">
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
          <select name="treatment_type" required defaultValue="spray">
            <option value="spray">Oprysk</option>
            <option value="fertilization">Nawożenie</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Data
          <input type="date" name="date" required />
        </label>
        <label className="flex flex-col gap-1">
          Produkt (lista)
          <select name="product_id" defaultValue="">
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
          <input name="product_name_manual" placeholder="użyj gdy nie wybierasz z listy" />
        </label>
        <label className="flex flex-col gap-1">
          Dawka
          <input name="dose" />
        </label>
        <label className="flex flex-col gap-1">
          Jednostka
          <input name="unit" />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          Powód
          <input name="reason" />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          Notatki
          <textarea name="notes" rows={3} />
        </label>
        <div className="flex gap-2 md:col-span-2">
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
