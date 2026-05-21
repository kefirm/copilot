"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Product,
  ProductType,
  deleteProduct,
  loadDb,
  productTypeLabels,
  saveProduct,
} from "@/lib/garden";

const productTypes: ProductType[] = ["spray", "fertilizer", "other"];

type ProductFormState = {
  name: string;
  productType: ProductType;
  defaultDose: string;
  defaultUnit: string;
  notes: string;
};

const emptyForm: ProductFormState = {
  name: "",
  productType: "spray",
  defaultDose: "",
  defaultUnit: "",
  notes: "",
};

export default function ProduktyPage() {
  const [db, setDb] = useState(loadDb());
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const refresh = () => setDb(loadDb());

  useEffect(() => {
    refresh();
  }, []);

  const title = useMemo(() => (editing ? "Edytuj produkt" : "Dodaj produkt"), [editing]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Nazwa produktu jest wymagana.");
      return;
    }

    saveProduct(
      {
        name: form.name.trim(),
        productType: form.productType,
        defaultDose: form.defaultDose.trim(),
        defaultUnit: form.defaultUnit.trim(),
        notes: form.notes.trim(),
      },
      editing?.id,
    );

    setEditing(null);
    setForm(emptyForm);
    refresh();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Produkty</h1>

      <form className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4" onSubmit={onSubmit}>
        <h2 className="text-lg font-semibold">{title}</h2>
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <label className="block text-sm">
          Nazwa produktu *
          <input className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} />
        </label>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="block text-sm">
            Typ produktu
            <select className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" value={form.productType} onChange={(e) => setForm((prev) => ({ ...prev, productType: e.target.value as ProductType }))}>
              {productTypes.map((type) => (
                <option key={type} value={type}>{productTypeLabels[type]}</option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            Domyślna dawka
            <input className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" value={form.defaultDose} onChange={(e) => setForm((prev) => ({ ...prev, defaultDose: e.target.value }))} />
          </label>

          <label className="block text-sm">
            Jednostka
            <input className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" value={form.defaultUnit} onChange={(e) => setForm((prev) => ({ ...prev, defaultUnit: e.target.value }))} />
          </label>
        </div>

        <label className="block text-sm">
          Notatki
          <textarea className="mt-1 w-full rounded border border-zinc-300 px-3 py-2" rows={2} value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
        </label>

        <div className="flex gap-2">
          <button className="rounded bg-emerald-600 px-3 py-2 text-white" type="submit">{editing ? "Zapisz zmiany" : "Dodaj"}</button>
          {editing && (
            <button type="button" className="rounded border border-zinc-300 px-3 py-2" onClick={() => {
              setEditing(null);
              setForm(emptyForm);
            }}>
              Anuluj edycję
            </button>
          )}
        </div>
      </form>

      <div className="overflow-auto rounded-xl border border-zinc-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-zinc-50 text-left">
            <tr>
              <th className="px-3 py-2">Nazwa</th>
              <th className="px-3 py-2">Typ</th>
              <th className="px-3 py-2">Dawka domyślna</th>
              <th className="px-3 py-2">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {db.products.length === 0 ? (
              <tr><td className="px-3 py-4" colSpan={4}>Brak produktów.</td></tr>
            ) : (
              db.products.map((product) => (
                <tr key={product.id} className="border-t border-zinc-100">
                  <td className="px-3 py-2">{product.name}</td>
                  <td className="px-3 py-2">{productTypeLabels[product.productType]}</td>
                  <td className="px-3 py-2">{product.defaultDose} {product.defaultUnit}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button className="rounded border border-zinc-300 px-2 py-1" onClick={() => {
                        setEditing(product);
                        setForm({
                          name: product.name,
                          productType: product.productType,
                          defaultDose: product.defaultDose,
                          defaultUnit: product.defaultUnit,
                          notes: product.notes,
                        });
                      }}>Edytuj</button>
                      <button
                        className="rounded border border-red-200 px-2 py-1 text-red-700"
                        onClick={() => {
                          if (window.confirm("Usunąć produkt? Operacja jest nieodwracalna.")) {
                            deleteProduct(product.id);
                            if (editing?.id === product.id) {
                              setEditing(null);
                              setForm(emptyForm);
                            }
                            refresh();
                          }
                        }}
                      >
                        Usuń
                      </button>
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
