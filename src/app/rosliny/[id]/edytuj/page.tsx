"use client";

import { PlantForm } from "@/components/plant-form";
import { useParams } from "next/navigation";
import { loadDb } from "@/lib/garden";

export default function EdytujRoslinePage() {
  const { id } = useParams<{ id: string }>();
  const db = loadDb();
  const plant = db.plants.find((item) => item.id === id);

  if (!plant) {
    return <p>Nie znaleziono rośliny.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edytuj roślinę</h1>
      <PlantForm mode="edit" plant={plant} groups={db.groups} />
    </div>
  );
}
