"use client";

import { useParams } from "next/navigation";
import { TreatmentForm } from "@/components/treatment-form";
import { loadDb } from "@/lib/garden";

export default function EdytujZabiegPage() {
  const { id } = useParams<{ id: string }>();
  const db = loadDb();
  const treatment = db.treatments.find((item) => item.id === id);

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
