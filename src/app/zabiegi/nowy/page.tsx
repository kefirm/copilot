"use client";

import { TreatmentForm } from "@/components/treatment-form";
import { loadDb } from "@/lib/garden";

export default function NowyZabiegPage() {
  const db = loadDb();
  const params =
    typeof window === "undefined"
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);

  const target = params.get("target");
  const targetType = target === "group" ? "group" : "plant";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Nowy zabieg</h1>
      <TreatmentForm
        db={db}
        mode="create"
        initialTargetType={targetType}
        preselectedPlantId={params.get("plantId") ?? undefined}
        preselectedGroupId={params.get("groupId") ?? undefined}
      />
    </div>
  );
}
