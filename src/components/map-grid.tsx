"use client";

import { type DragEvent, useRef, useState } from "react";
import Link from "next/link";
import { deletePlantOnMap, movePlantOnMap } from "@/lib/actions";
import type { Plant } from "@/lib/types";

export function MapGrid({
  plants,
  rows,
  cols,
  startRow = 1,
  groupColors,
}: {
  plants: Plant[];
  rows: number;
  cols: number;
  startRow?: number;
  groupColors: Record<string, string>;
}) {
  const occupied = new Map(plants.map((plant) => [`${plant.row_num}:${plant.col_num}`, plant]));
  const [draggedPlantId, setDraggedPlantId] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [expandedPlantId, setExpandedPlantId] = useState<string | null>(null);
  const plantIdRef = useRef<HTMLInputElement>(null);
  const rowRef = useRef<HTMLInputElement>(null);
  const colRef = useRef<HTMLInputElement>(null);
  const moveFormRef = useRef<HTMLFormElement>(null);
  const deleteIdRef = useRef<HTMLInputElement>(null);
  const deleteFormRef = useRef<HTMLFormElement>(null);

  function submitMove(plantId: string, rowNum: number, colNum: number): void {
    if (!plantIdRef.current || !rowRef.current || !colRef.current || !moveFormRef.current) {
      return;
    }
    plantIdRef.current.value = plantId;
    rowRef.current.value = String(rowNum);
    colRef.current.value = String(colNum);
    moveFormRef.current.requestSubmit();
  }

  function submitDelete(plantId: string): void {
    if (!deleteIdRef.current || !deleteFormRef.current) {
      return;
    }
    deleteIdRef.current.value = plantId;
    deleteFormRef.current.requestSubmit();
  }

  function onDrop(event: DragEvent<HTMLTableCellElement>, rowNum: number, colNum: number): void {
    event.preventDefault();
    const droppedPlantId = draggedPlantId || event.dataTransfer.getData("text/plain");
    if (!droppedPlantId) {
      setHoveredCell(null);
      return;
    }
    const targetPlant = occupied.get(`${rowNum}:${colNum}`);
    const sourcePlant = plants.find((plant) => plant.id === droppedPlantId);
    const droppedOnSameCell =
      sourcePlant && sourcePlant.row_num === rowNum && sourcePlant.col_num === colNum;
    const droppedOnOtherPlant = targetPlant && targetPlant.id !== droppedPlantId;

    if (droppedOnSameCell || droppedOnOtherPlant) {
      setDraggedPlantId(null);
      setHoveredCell(null);
      return;
    }

    submitMove(droppedPlantId, rowNum, colNum);
    setDraggedPlantId(null);
    setHoveredCell(null);
    setExpandedPlantId(null);
  }

  return (
    <>
      <form ref={moveFormRef} action={movePlantOnMap} className="hidden">
        <input ref={plantIdRef} type="hidden" name="plant_id" />
        <input ref={rowRef} type="hidden" name="row_num" />
        <input ref={colRef} type="hidden" name="col_num" />
      </form>
      <form ref={deleteFormRef} action={deletePlantOnMap} className="hidden">
        <input ref={deleteIdRef} type="hidden" name="id" />
      </form>

      <div className="overflow-auto rounded-lg border border-zinc-200 bg-white">
        <div className="min-w-[1900px] p-3">
          <table>
            <thead>
              <tr>
                <th>Wiersz/Kol.</th>
                {Array.from({ length: cols }, (_, col) => (
                  <th key={col + 1} className="text-center text-xs">
                    {col + 1}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(0, rows - startRow + 1) }, (_, rowOffset) => {
                const rowNum = startRow + rowOffset;
                return (
                  <tr key={rowNum}>
                    <th className="bg-zinc-50 text-center text-xs">{rowNum}</th>
                    {Array.from({ length: cols }, (_, col) => {
                      const colNum = col + 1;
                      const cellKey = `${rowNum}:${colNum}`;
                      const plant = occupied.get(cellKey);
                      const color = plant?.group_id ? (groupColors[plant.group_id] ?? "#d4d4d8") : "#d4d4d8";
                      return (
                        <td
                          key={colNum}
                          className={`w-[64px] min-w-[64px] align-top text-xs ${
                            hoveredCell === cellKey ? "ring-2 ring-zinc-900" : ""
                          }`}
                          style={{ backgroundColor: plant ? `${color}33` : "#ffffff" }}
                          onDragOver={(event) => event.preventDefault()}
                          onDragEnter={() => setHoveredCell(cellKey)}
                          onDragLeave={() => setHoveredCell((current) => (current === cellKey ? null : current))}
                          onDrop={(event) => onDrop(event, rowNum, colNum)}
                        >
                          {plant ? (
                            <div className="space-y-1 p-1">
                              <button
                                type="button"
                                draggable
                                onClick={() =>
                                  setExpandedPlantId((current) => (current === plant.id ? null : plant.id))
                                }
                                onDragStart={(event) => {
                                  setDraggedPlantId(plant.id);
                                  event.dataTransfer.effectAllowed = "move";
                                  event.dataTransfer.setData("text/plain", plant.id);
                                }}
                                onDragEnd={() => {
                                  setDraggedPlantId(null);
                                  setHoveredCell(null);
                                }}
                                className="w-full overflow-hidden text-ellipsis whitespace-nowrap rounded border px-1 py-0.5 text-left text-xs"
                                style={{ backgroundColor: `${color}55`, borderColor: color }}
                                title="Kliknij aby pokazać akcje lub przeciągnij aby przenieść"
                              >
                                {plant.display_name}
                              </button>

                              {expandedPlantId === plant.id ? (
                                <>
                                  <Link
                                    href={`/rosliny/${plant.id}`}
                                    className="block w-full rounded border border-zinc-300 bg-white px-1 py-0.5 text-center text-xs"
                                  >
                                    Szczegóły
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!window.confirm("Czy na pewno usunąć roślinę?")) {
                                        return;
                                      }
                                      submitDelete(plant.id);
                                    }}
                                    className="w-full rounded border border-red-300 bg-white px-1 py-0.5 text-xs text-red-700"
                                  >
                                    Usuń
                                  </button>
                                </>
                              ) : null}
                            </div>
                          ) : null}
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
    </>
  );
}
