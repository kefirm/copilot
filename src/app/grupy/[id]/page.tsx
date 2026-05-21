"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { findProductName, loadDb, treatmentLabels } from "@/lib/garden";

export default function GroupDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [db, setDb] = useState(loadDb());

  useEffect(() => {
    setDb(loadDb());
  }, []);

  const group = db.groups.find((item) => item.id === id);

  if (!group) {
    return <p>Nie znaleziono grupy.</p>;
  }

  const plants = db.plants.filter((plant) => plant.groupId === group.id);
  const treatments = db.treatments.filter((t) => t.groupId === group.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Grupa: {group.name}</h1>
        <Link href={`/zabiegi/nowy?target=group&groupId=${group.id}`} className="rounded bg-emerald-600 px-3 py-2 text-white">
          Dodaj zabieg dla grupy
        </Link>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Rośliny w grupie</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {plants.length === 0 && <li>Brak roślin przypisanych do grupy.</li>}
          {plants.map((plant) => (
            <li key={plant.id}>
              <Link href={`/rosliny/${plant.id}`} className="text-emerald-700 hover:underline">
                {plant.displayName}
              </Link>{" "}
              (R{plant.rowNum} C{plant.colNum})
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <h2 className="mb-3 text-lg font-semibold">Zabiegi grupowe</h2>
        <ul className="space-y-2 text-sm">
          {treatments.length === 0 && <li>Brak zabiegów dla tej grupy.</li>}
          {treatments.map((treatment) => (
            <li key={treatment.id}>
              {treatment.date} · {treatmentLabels[treatment.treatmentType]} · {findProductName(db, treatment.productId, treatment.productNameManual)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
