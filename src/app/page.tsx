"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadDb, treatmentLabels, observationTypeLabels, findPlantName } from "@/lib/garden";
import { PageCard } from "@/components/page-card";

export default function DashboardPage() {
  const [db, setDb] = useState(loadDb());

  useEffect(() => {
    setDb(loadDb());
  }, []);

  const latestTreatments = [...db.treatments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const latestObservations = [...db.observations]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PageCard title="Rośliny">{db.plants.length}</PageCard>
        <PageCard title="Grupy">{db.groups.length}</PageCard>
        <PageCard title="Zabiegi">{db.treatments.length}</PageCard>
        <PageCard title="Obserwacje">{db.observations.length}</PageCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PageCard title="Szybkie akcje">
          <div className="flex flex-wrap gap-2">
            <Link className="rounded bg-emerald-600 px-3 py-2 text-white" href="/rosliny/nowa">
              Dodaj roślinę
            </Link>
            <Link className="rounded bg-emerald-600 px-3 py-2 text-white" href="/zabiegi/nowy">
              Dodaj zabieg
            </Link>
            <Link className="rounded bg-emerald-600 px-3 py-2 text-white" href="/obserwacje">
              Dodaj obserwację
            </Link>
          </div>
        </PageCard>

        <PageCard title="Ostatnie zabiegi">
          <ul className="space-y-2 text-sm">
            {latestTreatments.length === 0 && <li>Brak danych.</li>}
            {latestTreatments.map((item) => (
              <li key={item.id}>
                {item.date} · {treatmentLabels[item.treatmentType]} · {findPlantName(db, item.plantId)}
              </li>
            ))}
          </ul>
        </PageCard>
      </div>

      <PageCard title="Ostatnie obserwacje">
        <ul className="space-y-2 text-sm">
          {latestObservations.length === 0 && <li>Brak danych.</li>}
          {latestObservations.map((item) => (
            <li key={item.id}>
              {item.date} · {observationTypeLabels[item.observationType]} · {item.title}
            </li>
          ))}
        </ul>
      </PageCard>
    </div>
  );
}
