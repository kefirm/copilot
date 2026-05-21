"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GardenDb,
  Treatment,
  TreatmentType,
  findProductName,
  saveTreatment,
  treatmentLabels,
} from "@/lib/garden";

type TreatmentFormProps = {
  db: GardenDb;
  mode: "create" | "edit";
  treatment?: Treatment;
  initialTargetType?: "plant" | "group";
  initialPlantId?: string;
  initialGroupId?: string;
};

const treatmentTypes: TreatmentType[] = ["spray", "fertilization"];

export function TreatmentForm({
  db,
  mode,
  treatment,
  initialTargetType,
  initialPlantId,
  initialGroupId,
}: TreatmentFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [manualMode, setManualMode] = useState(
    treatment ? !treatment.productId : false,
  );
  const [form, setForm] = useState({
    targetType: treatment?.targetType ?? initialTargetType ?? "plant",
    plantId: treatment?.plantId ?? initialPlantId ?? "",
    groupId: treatment?.groupId ?? initialGroupId ?? "",
    treatmentType: treatment?.treatmentType ?? "spray",
    date: treatment?.date ?? new Date().toISOString().slice(0, 10),
    productId: treatment?.productId ?? "",
    productNameManual: treatment?.productNameManual ?? "",
    dose: treatment?.dose ?? "",
    unit: treatment?.unit ?? "",
    reason: treatment?.reason ?? "",
    notes: treatment?.notes ?? "",
  });

  const selectedProduct = useMemo(
    () => db.products.find((item) => item.id === form.productId),
    [db.products, form.productId],
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    try {
      saveTreatment(
        {
          targetType: form.targetType as "plant" | "group",
          plantId: form.targetType === "plant" ? form.plantId || null : null,
          groupId: form.targetType === "group" ? form.groupId || null : null,
          treatmentType: form.treatmentType as TreatmentType,
          date: form.date,
          productId: manualMode ? null : form.productId || null,
          productNameManual: manualMode ? form.productNameManual.trim() : "",
          dose: form.dose.trim(),
          unit: form.unit.trim(),
          reason: form.reason.trim(),
          notes: form.notes.trim(),
        },
        treatment?.id,
      );
      router.push("/zabiegi");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się zapisać zabiegu.");
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
      {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm">
          Typ zabiegu
          <select
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={form.treatmentType}
            onChange={(e) => setForm((prev) => ({ ...prev, treatmentType: e.target.value }))}
          >
            {treatmentTypes.map((type) => (
              <option key={type} value={type}>
                {treatmentLabels[type]}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          Data
          <input
            type="date"
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
          />
        </label>
      </div>

      <label className="block text-sm">
        Cel zabiegu
        <select
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          value={form.targetType}
          onChange={(e) => setForm((prev) => ({ ...prev, targetType: e.target.value }))}
        >
          <option value="plant">Pojedyncza roślina</option>
          <option value="group">Grupa roślin</option>
        </select>
      </label>

      {form.targetType === "plant" ? (
        <label className="block text-sm">
          Roślina
          <select
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={form.plantId}
            onChange={(e) => setForm((prev) => ({ ...prev, plantId: e.target.value }))}
          >
            <option value="">Wybierz roślinę</option>
            {db.plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.displayName} (R{plant.rowNum} C{plant.colNum})
              </option>
            ))}
          </select>
        </label>
      ) : (
        <label className="block text-sm">
          Grupa
          <select
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={form.groupId}
            onChange={(e) => setForm((prev) => ({ ...prev, groupId: e.target.value }))}
          >
            <option value="">Wybierz grupę</option>
            {db.groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="rounded border border-zinc-200 p-3">
        <p className="mb-2 text-sm font-semibold">Produkt</p>
        <div className="mb-3 flex gap-4 text-sm">
          <label>
            <input
              type="radio"
              checked={!manualMode}
              onChange={() => setManualMode(false)}
            />{" "}
            Wybierz z listy
          </label>
          <label>
            <input
              type="radio"
              checked={manualMode}
              onChange={() => setManualMode(true)}
            />{" "}
            Wpisz ręcznie
          </label>
        </div>

        {!manualMode ? (
          <label className="block text-sm">
            Produkt z listy
            <select
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              value={form.productId}
              onChange={(e) =>
                setForm((prev) => {
                  const product = db.products.find((item) => item.id === e.target.value);
                  return {
                    ...prev,
                    productId: e.target.value,
                    dose: product?.defaultDose ?? prev.dose,
                    unit: product?.defaultUnit ?? prev.unit,
                  };
                })
              }
            >
              <option value="">Wybierz produkt</option>
              {db.products.map((product) => (
                <option key={product.id} value={product.id}>
                  {findProductName(db, product.id, "")}
                </option>
              ))}
            </select>
            {selectedProduct && (
              <p className="mt-1 text-xs text-zinc-600">
                Domyślna dawka: {selectedProduct.defaultDose || "-"} {selectedProduct.defaultUnit || ""}
              </p>
            )}
          </label>
        ) : (
          <label className="block text-sm">
            Nazwa produktu (ręcznie)
            <input
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
              value={form.productNameManual}
              onChange={(e) => setForm((prev) => ({ ...prev, productNameManual: e.target.value }))}
            />
          </label>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-sm">
          Dawka
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={form.dose}
            onChange={(e) => setForm((prev) => ({ ...prev, dose: e.target.value }))}
          />
        </label>

        <label className="block text-sm">
          Jednostka
          <input
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
            value={form.unit}
            onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
          />
        </label>
      </div>

      <label className="block text-sm">
        Powód
        <input
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          value={form.reason}
          onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
        />
      </label>

      <label className="block text-sm">
        Notatki
        <textarea
          rows={3}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2"
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
        />
      </label>

      <div className="flex gap-2">
        <button className="rounded bg-emerald-600 px-4 py-2 text-white" type="submit">
          {mode === "create" ? "Dodaj zabieg" : "Zapisz zmiany"}
        </button>
        <button className="rounded border border-zinc-300 px-4 py-2" type="button" onClick={() => router.push("/zabiegi")}>
          Anuluj
        </button>
      </div>
    </form>
  );
}
