import Link from "next/link";
import { createProduct, deleteProduct } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";

export default async function ProduktyPage() {
  const db = await readDb();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Produkty</h1>

      <form action={createProduct} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-3">
        <label className="flex flex-col gap-1">
          Nazwa
          <input name="name" required />
        </label>
        <label className="flex flex-col gap-1">
          Typ produktu
          <input name="product_type" placeholder="np. fungicyd" required />
        </label>
        <label className="flex flex-col gap-1">
          Domyślna dawka
          <input name="default_dose" placeholder="np. 10" />
        </label>
        <label className="flex flex-col gap-1">
          Domyślna jednostka
          <input name="default_unit" placeholder="np. ml/l" />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          Notatki
          <input name="notes" />
        </label>
        <div className="md:col-span-3">
          <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
            Dodaj produkt
          </button>
        </div>
      </form>

      <div className="overflow-auto rounded-lg border border-zinc-200 bg-white">
        <table>
          <thead>
            <tr>
              <th>Nazwa</th>
              <th>Typ</th>
              <th>Dawka domyślna</th>
              <th>Notatki</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {db.products.length === 0 ? (
              <tr>
                <td colSpan={5}>Brak produktów.</td>
              </tr>
            ) : (
              db.products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.product_type}</td>
                  <td>
                    {product.default_dose} {product.default_unit}
                  </td>
                  <td>{product.notes || "-"}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link href={`/produkty/${product.id}/edytuj`} className="rounded border px-2 py-1 text-xs">
                        Edytuj
                      </Link>
                      <form action={deleteProduct}>
                        <input type="hidden" name="id" value={product.id} />
                        <ConfirmSubmitButton
                          label="Usuń"
                          message="Czy na pewno usunąć produkt?"
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
