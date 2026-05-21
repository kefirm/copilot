"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { TreatmentForm } from "@/components/treatment-form";
import { GardenDb, loadDb } from "@/lib/garden";

export default function NowyZabiegPage() {
  const [db, setDb] = useState<GardenDb>(loadDb());
  const params = useSearchParams();

  useEffect(() => {
    setDb(loadDb());
  }, []);

  const target = params.get("target");
  const targetType = target === "group" ? "group" : "plant";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nowy zabieg</h1>
      <TreatmentForm
        db={db}
        mode="create"
        initialTargetType={targetType}
        initialPlantId={params.get("plantId") ?? undefined}
        initialGroupId={params.get("groupId") ?? undefined}
      />
    </div>
  );
}
