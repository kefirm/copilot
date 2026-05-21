"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  categoryLabels,
  deletePlant,
  findGroupName,
  findProductName,
  loadDb,
  observationTypeLabels,
  treatmentLabels,
} from "@/lib/garden";

export default function RoslinaDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const db = loadDb();

  const plant = db.plants.find((item) => item.id === id);

  if (!plant) {
    return <p>Nie znaleziono rośliny.</p>;
  }

  const treatments = db.treatments.filter((item) => item.plantId === plant.id);
  const observations = db.observations.filter((item) => item.plantId === plant.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{plant.displayName}</h1>
        <div className="flex gap-2">
          <Link href={`/rosliny/${plant.id}/edytuj`} className="rounded border border-zinc-300 px-3 py-2">
            Edytuj
          </Link>
          <button
            className="rounded border border-red-200 px-3 py-2 text-red-700"
            onClick={() => {
              if (window.confirm("Usunąć roślinę? Operacja jest nieodwracalna.")) {
                deletePlant(plant.id);
                router.push("/rosliny");
              }
            }}
          >
            Usuń
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Informacje</h2>
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <div><dt className="font-semibold">Gatunek</dt><dd>{plant.species || "-"}</dd></div>
          <div><dt className="font-semibold">Odmiana</dt><dd>{plant.variety || "-"}</dd></div>
          <div><dt className="font-semibold">Kategoria</dt><dd>{categoryLabels[plant.category]}</dd></div>
          <div><dt className="font-semibold">Grupa</dt><dd>{findGroupName(db, plant.groupId)}</dd></div>
          <div><dt className="font-semibold">Pozycja</dt><dd>R{plant.rowNum} C{plant.colNum}</dd></div>
          <div><dt className="font-semibold">Oryginalna etykieta</dt><dd>{plant.originalLabel || "-"}</dd></div>
          <div className="md:col-span-2"><dt className="font-semibold">Notatki</dt><dd>{plant.notes || "-"}</dd></div>
        </dl>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Zabiegi</h2>
        <ul className="space-y-2 text-sm">
          {treatments.length === 0 && <li>Brak zabiegów.</li>}
          {treatments.map((item) => (
            <li key={item.id}>
              {item.date} · {treatmentLabels[item.treatmentType]} · {findProductName(db, item.productId, item.productNameManual)}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Obserwacje</h2>
        <ul className="space-y-2 text-sm">
          {observations.length === 0 && <li>Brak obserwacji.</li>}
          {observations.map((item) => (
            <li key={item.id}>
              {item.date} · {observationTypeLabels[item.observationType]} · {item.title}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
