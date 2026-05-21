"use client";

import { useMemo, useState, useTransition } from "react";
import { movePlantOnMap } from "@/lib/actions";
import type { Plant } from "@/lib/types";

type Notice = {
  kind: "info" | "success" | "error";
  message: string;
};

interface GardenMapProps {
  cols: number;
  initialPlants: Plant[];
  rows: number;
}

const CELL_WIDTH_PX = 64;
const ROW_HEADER_WIDTH_PX = 120;

export function GardenMap({ cols, initialPlants, rows }: GardenMapProps) {
  const [plants, setPlants] = useState(initialPlants);
  const [activePlantId, setActivePlantId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>({
    kind: "info",
    message:
      "Przeciągnij nazwę rośliny albo wybierz ją kliknięciem i wskaż puste pole. Zielone pola są dozwolonym celem, czerwone są zajęte.",
  });
  const [isPending, startTransition] = useTransition();
  const mapMinWidth = `${cols * CELL_WIDTH_PX + ROW_HEADER_WIDTH_PX}px`;

  const occupied = useMemo(
    () => new Map(plants.map((plant) => [`${plant.row_num}:${plant.col_num}`, plant])),
    [plants],
  );
  const activePlant = activePlantId ? plants.find((plant) => plant.id === activePlantId) ?? null : null;

  function setMoveNotice(kind: Notice["kind"], message: string) {
    setNotice({ kind, message });
  }

  function handleDrop(rowNum: number, colNum: number, targetPlant: Plant | undefined) {
    if (!activePlant) return;

    if (targetPlant && targetPlant.id !== activePlant.id) {
      setActivePlantId(null);
      setMoveNotice("error", "To pole jest już zajęte. Przenieś roślinę na puste pole.");
      return;
    }

    setActivePlantId(null);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("plant_id", activePlant.id);
        formData.set("row_num", String(rowNum));
        formData.set("col_num", String(colNum));
        await movePlantOnMap(formData);

        setPlants((currentPlants) =>
          currentPlants.map((plant) =>
            plant.id === activePlant.id ? { ...plant, row_num: rowNum, col_num: colNum } : plant,
          ),
        );
        setMoveNotice("success", "Roślina została przeniesiona.");
      } catch (error) {
        setMoveNotice(
          "error",
          error instanceof Error ? error.message : "Nie udało się przenieść rośliny.",
        );
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm text-zinc-600">
          Przeciągnij roślinę bezpośrednio na mapie. W czasie przeciągania puste pola są podświetlone na zielono,
          a zajęte na czerwono.
        </p>
        <p className="text-sm text-zinc-600">
          Możesz też kliknąć roślinę, aby zaznaczyć ją do przeniesienia, a potem kliknąć pole docelowe.
        </p>
        <p className="text-sm text-zinc-600">
          Jeśli nie korzystasz z myszy, pozycję możesz nadal zmienić z poziomu edycji rośliny.
        </p>
        <div
          aria-live="polite"
          className={[
            "rounded-md border px-3 py-2 text-sm",
            notice.kind === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : notice.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white text-zinc-700",
          ].join(" ")}
        >
          {isPending ? "Zapisywanie nowej pozycji..." : notice.message}
        </div>
      </div>

      <div className="overflow-auto rounded-lg border border-zinc-200 bg-white">
        <div className="p-3" style={{ minWidth: mapMinWidth }}>
          <table>
            <caption className="sr-only">Mapa rozmieszczenia roślin w ogrodzie</caption>
            <thead>
              <tr>
                <th>Wiersz/Kol.</th>
                {Array.from({ length: cols }, (_, col) => (
                  <th
                    key={col + 1}
                    scope="col"
                    aria-label={`Kolumna ${col + 1}`}
                    className="text-center text-xs"
                  >
                    {col + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: rows }, (_, row) => {
                const rowNum = row + 1;
                return (
                  <tr key={rowNum}>
                    <th scope="row" className="bg-zinc-50 text-center text-xs">
                      {rowNum}
                    </th>
                    {Array.from({ length: cols }, (_, col) => {
                      const colNum = col + 1;
                      const plant = occupied.get(`${rowNum}:${colNum}`);
                      const isActivePlant = plant?.id === activePlantId;
                      const isValidDropTarget = Boolean(activePlantId) && !plant;
                      const isBlockedDropTarget = Boolean(activePlantId) && Boolean(plant) && !isActivePlant;

                      return (
                        <td
                          key={colNum}
                          data-row={rowNum}
                          data-col={colNum}
                          data-occupied={plant ? "true" : "false"}
                          aria-label={
                            plant
                              ? `${plant.display_name}, wiersz ${rowNum}, kolumna ${colNum}`
                              : `Puste pole, wiersz ${rowNum}, kolumna ${colNum}${
                                  activePlantId ? ", dostępne do przeniesienia rośliny" : ""
                                }`
                          }
                          className={[
                            "min-w-16 align-middle text-xs transition-colors",
                            plant ? "bg-emerald-50" : "bg-white",
                            isActivePlant ? "bg-emerald-100 opacity-60" : "",
                            isValidDropTarget ? "bg-emerald-50 ring-1 ring-inset ring-emerald-200" : "",
                            isBlockedDropTarget ? "bg-red-50 ring-1 ring-inset ring-red-200" : "",
                          ].join(" ")}
                          onDragOver={(event) => {
                            if (!activePlantId || isPending) return;
                            event.preventDefault();
                            event.dataTransfer.dropEffect = plant && plant.id !== activePlantId ? "none" : "move";
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            if (!activePlantId || isPending) return;
                            handleDrop(rowNum, colNum, plant);
                          }}
                          onClick={() => {
                            if (!activePlantId || isPending) return;
                            handleDrop(rowNum, colNum, plant);
                          }}
                        >
                          {plant ? (
                            <div
                              draggable={!isPending}
                              data-plant-id={plant.id}
                              onDragStart={(event) => {
                                setActivePlantId(plant.id);
                                event.dataTransfer.effectAllowed = "move";
                                event.dataTransfer.setData("text/plain", plant.id);
                                setMoveNotice(
                                  "info",
                                  `Przenosisz ${plant.display_name}. Upuść roślinę na puste pole.`,
                                );
                              }}
                              onDragEnd={() => {
                                setActivePlantId(null);
                              }}
                              onClick={(event) => {
                                event.stopPropagation();
                                if (isPending) return;
                                setActivePlantId(plant.id);
                                setMoveNotice(
                                  "info",
                                  `Wybrano ${plant.display_name}. Kliknij puste pole albo przeciągnij roślinę.`,
                                );
                              }}
                              className={[
                                "cursor-grab select-none rounded px-1 py-1 font-medium",
                                isPending ? "cursor-wait" : "hover:bg-emerald-100 active:cursor-grabbing",
                              ].join(" ")}
                              title={`Przeciągnij, aby przenieść ${plant.display_name}`}
                            >
                              {plant.display_name}
                            </div>
                          ) : (
                            <span className="block min-h-8" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
