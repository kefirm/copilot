import Link from "next/link";
import { deleteCompletedTreatments, deleteTreatment, toggleTreatmentCompleted } from "@/lib/actions";
import { readDb } from "@/lib/db";
import { isReadOnlyModeEnabled } from "@/lib/read-only";
import { formatDate } from "@/lib/utils";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import type { Treatment } from "@/lib/types";

const typeLabel: Record<string, string> = {
  spray: "Oprysk",
  fertilization: "Nawożenie",
};

function qp(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : (value ?? "");
}

type TreatmentSortKey = "date" | "status";
const MONTH_NAMES_PL: Record<string, string> = {
  "01": "styczeń",
  "02": "luty",
  "03": "marzec",
  "04": "kwiecień",
  "05": "maj",
  "06": "czerwiec",
  "07": "lipiec",
  "08": "sierpień",
  "09": "wrzesień",
  "10": "październik",
  "11": "listopad",
  "12": "grudzień",
};

function treatmentDateParts(date: string): { year: string; month: string } {
  const [year = "", month = ""] = date.split("-");
  return { year, month };
}

function treatmentsHref(filters: {
  sort: TreatmentSortKey;
  order: "asc" | "desc";
  year: string;
  month: string;
}): string {
  const params = new URLSearchParams();
  params.set("sort", filters.sort);
  params.set("order", filters.order);
  params.set("year", filters.year);
  params.set("month", filters.month);
  return `/zabiegi?${params.toString()}`;
}

function sortTreatments(
  treatments: Treatment[],
  sortBy: TreatmentSortKey,
  sortOrder: "asc" | "desc",
): Treatment[] {
  const direction = sortOrder === "desc" ? -1 : 1;
  return [...treatments].sort((a, b) => {
    if (sortBy === "status") {
      const left = a.completed_at ? 1 : 0;
      const right = b.completed_at ? 1 : 0;
      if (left !== right) {
        return (left - right) * direction;
      }
    }

    const leftDate = new Date(a.date).getTime();
    const rightDate = new Date(b.date).getTime();
    return (leftDate - rightDate) * direction;
  });
}

export default async function ZabiegiPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const readOnly = isReadOnlyModeEnabled();
  const params = await searchParams;
  const db = await readDb();
  const plantsById = new Map(db.plants.map((item) => [item.id, item]));
  const groupsById = new Map(db.groups.map((item) => [item.id, item]));
  const productsById = new Map(db.products.map((item) => [item.id, item]));
  const sortByRaw = qp(params.sort);
  const sortOrderRaw = qp(params.order);
  const yearFilter = qp(params.year);
  const monthFilter = qp(params.month);
  const sortBy: TreatmentSortKey = sortByRaw === "status" ? "status" : "date";
  const sortOrder: "asc" | "desc" = sortOrderRaw === "desc" ? "desc" : "asc";
  const yearOptions = [...new Set(db.treatments.map((treatment) => treatmentDateParts(treatment.date).year))]
    .filter(Boolean)
    .sort((a, b) => Number(b) - Number(a));
  const monthOptions = [...new Set(db.treatments.map((treatment) => treatmentDateParts(treatment.date).month))]
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b));

  const filteredTreatments = db.treatments.filter((treatment) => {
    const { year, month } = treatmentDateParts(treatment.date);
    return (!yearFilter || year === yearFilter) && (!monthFilter || month === monthFilter);
  });
  const visibleTreatments = sortTreatments(filteredTreatments, sortBy, sortOrder);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Zabiegi</h1>
        <div className="flex gap-2">
          {!readOnly ? (
            <>
              <form action={deleteCompletedTreatments}>
                <ConfirmSubmitButton
                  label="Usuń ukończone"
                  message="Czy na pewno usunąć wszystkie ukończone zabiegi?"
                  className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700"
                />
              </form>
              <Link href="/zabiegi/nowy" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
                Dodaj zabieg
              </Link>
            </>
          ) : null}
        </div>
      </div>

      <div className="overflow-auto rounded-lg border border-zinc-200 bg-white">
        <form method="get" className="grid gap-3 border-b border-zinc-200 p-4 md:grid-cols-4">
          <input type="hidden" name="sort" value={sortBy} />
          <input type="hidden" name="order" value={sortOrder} />
          <label className="flex flex-col gap-1 text-sm">
            Rok
            <select name="year" defaultValue={yearFilter}>
              <option value="">Wszystkie</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Miesiąc
            <select name="month" defaultValue={monthFilter}>
              <option value="">Wszystkie</option>
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {month} - {MONTH_NAMES_PL[month] ?? month}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2 md:col-span-2">
            <button type="submit" className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white">
              Filtruj
            </button>
            <Link href="/zabiegi" className="rounded-md border px-4 py-2 text-sm">
              Wyczyść
            </Link>
            <span className="text-sm text-zinc-600">{visibleTreatments.length} wyników</span>
          </div>
        </form>
        <table>
          <thead>
            <tr>
              <th>
                <div className="flex items-center gap-1">
                  Status
                  <Link
                    href={treatmentsHref({
                      sort: "status",
                      order: "asc",
                      year: yearFilter,
                      month: monthFilter,
                    })}
                    className={sortBy === "status" && sortOrder === "asc" ? "font-semibold" : "text-zinc-500"}
                  >
                    ↑
                  </Link>
                  <Link
                    href={treatmentsHref({
                      sort: "status",
                      order: "desc",
                      year: yearFilter,
                      month: monthFilter,
                    })}
                    className={sortBy === "status" && sortOrder === "desc" ? "font-semibold" : "text-zinc-500"}
                  >
                    ↓
                  </Link>
                </div>
              </th>
              <th>
                <div className="flex items-center gap-1">
                  Data
                  <Link
                    href={treatmentsHref({
                      sort: "date",
                      order: "asc",
                      year: yearFilter,
                      month: monthFilter,
                    })}
                    className={sortBy === "date" && sortOrder === "asc" ? "font-semibold" : "text-zinc-500"}
                  >
                    ↑
                  </Link>
                  <Link
                    href={treatmentsHref({
                      sort: "date",
                      order: "desc",
                      year: yearFilter,
                      month: monthFilter,
                    })}
                    className={sortBy === "date" && sortOrder === "desc" ? "font-semibold" : "text-zinc-500"}
                  >
                    ↓
                  </Link>
                </div>
              </th>
              <th>Typ</th>
              <th>Cel</th>
              <th>Produkt</th>
              <th>Dawka</th>
              <th>Powód</th>
              {!readOnly ? <th>Akcje</th> : null}
            </tr>
          </thead>
          <tbody>
            {visibleTreatments.length === 0 ? (
              <tr>
                <td colSpan={readOnly ? 7 : 8}>Brak zabiegów.</td>
              </tr>
            ) : (
              visibleTreatments.map((treatment) => (
                <tr key={treatment.id}>
                  <td>
                    {!readOnly ? (
                      <form action={toggleTreatmentCompleted}>
                        <input type="hidden" name="id" value={treatment.id} />
                        <button
                          type="submit"
                          className={`rounded border px-2 py-1 text-xs ${
                            treatment.completed_at
                              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                              : "border-zinc-300 bg-white text-zinc-700"
                          }`}
                        >
                          {treatment.completed_at ? "Ukończone" : "Do zrobienia"}
                        </button>
                      </form>
                    ) : (
                      <span
                        className={`rounded border px-2 py-1 text-xs ${
                          treatment.completed_at
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-zinc-300 bg-white text-zinc-700"
                        }`}
                      >
                        {treatment.completed_at ? "Ukończone" : "Do zrobienia"}
                      </span>
                    )}
                  </td>
                  <td>{formatDate(treatment.date)}</td>
                  <td>{typeLabel[treatment.treatment_type] ?? treatment.treatment_type}</td>
                  <td>
                    {treatment.target_type === "plant"
                      ? plantsById.get(treatment.plant_id ?? "")?.display_name ?? "Roślina usunięta"
                      : groupsById.get(treatment.group_id ?? "")?.name ?? "Grupa usunięta"}
                  </td>
                  <td>
                    {treatment.product_id
                      ? productsById.get(treatment.product_id)?.name ?? "Produkt usunięty"
                      : treatment.product_name_manual || "-"}
                  </td>
                  <td>
                    {treatment.dose} {treatment.unit}
                  </td>
                  <td>{treatment.reason || "-"}</td>
                  {!readOnly ? (
                    <td>
                      <div className="flex gap-2">
                        <Link href={`/zabiegi/${treatment.id}/edytuj`} className="rounded border px-2 py-1 text-xs">
                          Edytuj
                        </Link>
                        <form action={deleteTreatment}>
                          <input type="hidden" name="id" value={treatment.id} />
                          <ConfirmSubmitButton
                            label="Usuń"
                            message="Czy na pewno usunąć zabieg?"
                            className="rounded border border-red-300 px-2 py-1 text-xs text-red-700"
                          />
                        </form>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
