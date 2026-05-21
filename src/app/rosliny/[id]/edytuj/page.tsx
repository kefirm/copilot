"use client";

import { PlantForm } from "@/components/plant-form";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Group, Plant, loadDb } from "@/lib/garden";

export default function EdytujRoslinePage() {
  const { id } = useParams<{ id: string }>();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const db = loadDb();
    setPlant(db.plants.find((item) => item.id === id) ?? null);
    setGroups(db.groups);
  }, [id]);

  if (!plant) {
    return <p>Nie znaleziono rośliny.</p>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edytuj roślinę</h1>
      <PlantForm mode="edit" plant={plant} groups={groups} />
    </div>
  );
}
