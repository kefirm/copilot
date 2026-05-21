"use client";

import { PlantForm } from "@/components/plant-form";
import { useEffect, useState } from "react";
import { Group, loadDb } from "@/lib/garden";

export default function NowaRoslinaPage() {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    setGroups(loadDb().groups);
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dodaj roślinę</h1>
      <PlantForm mode="create" groups={groups} />
    </div>
  );
}
