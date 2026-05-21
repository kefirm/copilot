"use client";

import { useActionState } from "react";
import { importPlantsFromGridCsv } from "@/lib/actions";

type ImportState = {
  status: "idle" | "success" | "error";
  message: string;
  summary: {
    source_name: string;
    total_rows_scanned: number;
    total_cells_scanned: number;
    imported_count: number;
    updated_count: number;
    skipped_empty_rows: number;
    skipped_empty_cells: number;
    warnings: string[];
    errors: string[];
  } | null;
};

const initialState: ImportState = {
  status: "idle",
  message: "",
  summary: null,
};

export function PlantImportForm() {
  const [state, action, pending] = useActionState(importPlantsFromGridCsv, initialState);

  return (
    <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Import z arkusza CSV</h2>
        <p className="text-sm text-zinc-600">
          Import traktuje plik jako siatkę ogrodu: numer wiersza i kolumny w CSV staje się pozycją rośliny na mapie.
        </p>
      </div>

      <form action={action} className="space-y-3">
        <label className="flex flex-col gap-1 text-sm">
          Plik CSV z arkusza
          <input type="file" name="csv_file" accept=".csv,text/csv" className="max-w-xl" />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            name="import_source"
            value="upload"
            disabled={pending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {pending ? "Importowanie..." : "Importuj wybrany plik CSV"}
          </button>
          <button
            type="submit"
            name="import_source"
            value="sample"
            disabled={pending}
            className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
          >
            Załaduj przykład z repo
          </button>
          <a href="/examples/przykladowy-arkusz-ogrodu.csv" download className="rounded-md border px-4 py-2 text-sm">
            Pobierz przykład CSV
          </a>
        </div>
      </form>

      {state.status !== "idle" ? (
        <div
          className={`space-y-3 rounded-md border p-3 text-sm ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-red-200 bg-red-50 text-red-950"
          }`}
        >
          <p className="font-medium">{state.message}</p>

          {state.summary ? (
            <div className="space-y-3">
              <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <SummaryItem label="Źródło" value={state.summary.source_name} />
                <SummaryItem label="Wiersze" value={String(state.summary.total_rows_scanned)} />
                <SummaryItem label="Komórki" value={String(state.summary.total_cells_scanned)} />
                <SummaryItem
                  label="Nowe rośliny"
                  value={String(state.summary.imported_count)}
                />
                <SummaryItem
                  label="Zaktualizowane"
                  value={String(state.summary.updated_count)}
                />
                <SummaryItem
                  label="Puste komórki"
                  value={String(state.summary.skipped_empty_cells)}
                />
                <SummaryItem
                  label="Puste wiersze"
                  value={String(state.summary.skipped_empty_rows)}
                />
              </dl>

              <Messages title="Ostrzeżenia" items={state.summary.warnings} />
              <Messages title="Błędy" items={state.summary.errors} />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Messages({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="font-medium">{title}</h3>
      <ul className="list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={`${title}-${item}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
