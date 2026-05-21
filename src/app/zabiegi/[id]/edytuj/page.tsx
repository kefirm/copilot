"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TreatmentForm } from "@/components/treatment-form";
import { GardenDb, Treatment, loadDb } from "@/lib/garden";

export default function EdytujZabiegPage() {
  const { id } = useParams<{ id: string }>();
  const [db, setDb] = useState<GardenDb>(loadDb());
  const [treatment, setTreatment] = useState<Treatment | null>(null);

  useEffect(() => {
    const loaded = loadDb();
    setDb(loaded);
    setTreatment(loaded.treatments.find((item) => item.id === id) ?? null);
  }, [id]);

  if (!treatment) {
    return <p>Nie znaleziono zabiegu.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edytuj zabieg</h1>
      <TreatmentForm db={db} mode="edit" treatment={treatment} />
    </div>
  );
}
