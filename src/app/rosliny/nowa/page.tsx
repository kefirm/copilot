"use client";

import { PlantForm } from "@/components/plant-form";
import { loadDb } from "@/lib/garden";

export default function NowaRoslinaPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dodaj roślinę</h1>
      <PlantForm mode="create" groups={loadDb().groups} />
    </div>
  );
}
