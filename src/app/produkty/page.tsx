import Link from "next/link";
import { createProduct, deleteProduct } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import type { Product } from "@/lib/types";

function qp(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

function sortProducts(products: Product[], sortOrder: "asc" | "desc"): Product[] {
  const direction = sortOrder === "desc" ? -1 : 1;
  return [...products].sort(
    (a, b) => a.name.localeCompare(b.name, "pl-PL", { sensitivity: "base" }) * direction,
  );
}

function sortTextValues(values: string[]): string[] {
  return values.sort((a, b) => a.localeCompare(b, "pl-PL", { sensitivity: "base" }));
}

export default async function ProduktyPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const db = await readDb();
  const typeFilter = qp(params.type);
  const sortOrder: "asc" | "desc" = qp(params.order) === "desc" ? "desc" : "asc";
  const typeOptions = sortTextValues([...new Set(db.products.map((product) => product.product_type))]);
  const filteredProducts = db.products.filter((product) => !typeFilter || product.product_type === typeFilter);
  const visibleProducts = sortProducts(filteredProducts, sortOrder);

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

      <form method="get" className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 md:grid-cols-3">
        <input type="hidden" name="order" value={sortOrder} />
        <label className="flex flex-col gap-1 text-sm md:col-span-2">
          Filtr typu produktu
          <select name="type" defaultValue={typeFilter}>
            <option value="">Wszystkie</option>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
            Filtruj
          </button>
          <Link href="/produkty" className="rounded-md border px-4 py-2 text-sm">
            Wyczyść
          </Link>
        </div>
      </form>

      <div className="text-sm text-zinc-600">{visibleProducts.length} wyników</div>

      <div className="overflow-auto rounded-lg border border-zinc-200 bg-white">
        <table>
          <thead>
            <tr>
              <th>
                <div className="flex items-center gap-1">
                  Nazwa
                  <Link
                    href={`/produkty?order=asc&type=${encodeURIComponent(typeFilter)}`}
                    className={sortOrder === "asc" ? "font-semibold" : "text-zinc-500"}
                  >
                    ↑
                  </Link>
                  <Link
                    href={`/produkty?order=desc&type=${encodeURIComponent(typeFilter)}`}
                    className={sortOrder === "desc" ? "font-semibold" : "text-zinc-500"}
                  >
                    ↓
                  </Link>
                </div>
              </th>
              <th>Typ</th>
              <th>Dawka domyślna</th>
              <th>Notatki</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.length === 0 ? (
              <tr>
                <td colSpan={5}>Brak produktów.</td>
              </tr>
            ) : (
              visibleProducts.map((product) => (
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
