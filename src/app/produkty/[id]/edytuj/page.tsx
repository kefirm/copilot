import Link from "next/link";
import { notFound } from "next/navigation";
import { updateProduct } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { READ_ONLY_MESSAGE, isReadOnlyModeEnabled } from "@/lib/read-only";

export default async function EdytujProduktPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await readDb();
  const product = db.products.find((item) => item.id === id);
  if (!product) return notFound();
  if (isReadOnlyModeEnabled()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Edycja produktu</h1>
        <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-700">{READ_ONLY_MESSAGE}</div>
        <Link href="/produkty" className="text-sm text-zinc-600 hover:underline">
          ← Wróć do listy produktów
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edycja produktu</h1>
      <form action={updateProduct} className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4">
        <input type="hidden" name="id" value={product.id} />
        <label className="flex flex-col gap-1">
          Nazwa
          <input name="name" defaultValue={product.name} required />
        </label>
        <label className="flex flex-col gap-1">
          Typ produktu
          <input name="product_type" defaultValue={product.product_type} required />
        </label>
        <label className="flex flex-col gap-1">
          Domyślna dawka
          <input name="default_dose" defaultValue={product.default_dose} />
        </label>
        <label className="flex flex-col gap-1">
          Domyślna jednostka
          <input name="default_unit" defaultValue={product.default_unit} />
        </label>
        <label className="flex flex-col gap-1">
          Notatki
          <textarea name="notes" rows={3} defaultValue={product.notes} />
        </label>
        <div className="flex gap-2">
          <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
            Zapisz
          </button>
          <Link href="/produkty" className="rounded-md border px-4 py-2 text-sm">
            Anuluj
          </Link>
        </div>
      </form>
    </div>
  );
}
