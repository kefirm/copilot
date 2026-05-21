export const GRID_ROWS = 24;
export const GRID_COLS = 120;

export type PlantCategory = "tree" | "shrub" | "vine" | "potted";
export type ProductType = "spray" | "fertilizer" | "other";
export type TreatmentType = "spray" | "fertilization";
export type TargetType = "plant" | "group";
export type ObservationType = "disease" | "pest" | "general";

export type Group = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type Plant = {
  id: string;
  displayName: string;
  species: string;
  variety: string;
  originalLabel: string;
  category: PlantCategory;
  groupId: string | null;
  rowNum: number;
  colNum: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Product = {
  id: string;
  name: string;
  productType: ProductType;
  defaultDose: string;
  defaultUnit: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Treatment = {
  id: string;
  targetType: TargetType;
  plantId: string | null;
  groupId: string | null;
  treatmentType: TreatmentType;
  date: string;
  productId: string | null;
  productNameManual: string;
  dose: string;
  unit: string;
  reason: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Observation = {
  id: string;
  plantId: string;
  date: string;
  observationType: ObservationType;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type GardenDb = {
  groups: Group[];
  plants: Plant[];
  products: Product[];
  treatments: Treatment[];
  observations: Observation[];
};

const STORAGE_KEY = "garden-mvp-db-v1";

export const categoryLabels: Record<PlantCategory, string> = {
  tree: "Drzewo",
  shrub: "Krzew",
  vine: "Pnącze",
  potted: "Donica",
};

export const treatmentLabels: Record<TreatmentType, string> = {
  spray: "Oprysk",
  fertilization: "Nawożenie",
};

export const productTypeLabels: Record<ProductType, string> = {
  spray: "Środek do oprysku",
  fertilizer: "Nawóz",
  other: "Inny",
};

export const observationTypeLabels: Record<ObservationType, string> = {
  disease: "Choroba",
  pest: "Szkodnik",
  general: "Notatka",
};

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  throw new Error("crypto.randomUUID nie jest wspierane w tym środowisku.");
}

function emptyDb(): GardenDb {
  return {
    groups: [],
    plants: [],
    products: [],
    treatments: [],
    observations: [],
  };
}

function seedDb(): GardenDb {
  const ts = nowIso();
  const groups: Group[] = [
    { id: createId(), name: "Maliny", description: "Grupa malin", createdAt: ts, updatedAt: ts },
    { id: createId(), name: "Borówki", description: "Grupa borówek", createdAt: ts, updatedAt: ts },
  ];

  return {
    groups,
    plants: [
      {
        id: createId(),
        displayName: "Jabłoń Ligol",
        species: "Jabłoń",
        variety: "Ligol",
        originalLabel: "Jabłoń Ligol",
        category: "tree",
        groupId: null,
        rowNum: 3,
        colNum: 12,
        notes: "",
        createdAt: ts,
        updatedAt: ts,
      },
      {
        id: createId(),
        displayName: "Borówka Duke",
        species: "Borówka",
        variety: "Duke",
        originalLabel: "Borówka Amerykańska Duke",
        category: "shrub",
        groupId: groups.find((g) => g.name === "Borówki")?.id ?? null,
        rowNum: 8,
        colNum: 20,
        notes: "",
        createdAt: ts,
        updatedAt: ts,
      },
    ],
    products: [
      {
        id: createId(),
        name: "Nawóz uniwersalny",
        productType: "fertilizer",
        defaultDose: "20",
        defaultUnit: "g",
        notes: "",
        createdAt: ts,
        updatedAt: ts,
      },
    ],
    treatments: [],
    observations: [],
  };
}

export function loadDb(): GardenDb {
  if (typeof window === "undefined") {
    return emptyDb();
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const seeded = seedDb();
    saveDb(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as GardenDb;
    return {
      groups: parsed.groups ?? [],
      plants: parsed.plants ?? [],
      products: parsed.products ?? [],
      treatments: parsed.treatments ?? [],
      observations: parsed.observations ?? [],
    };
  } catch {
    const seeded = seedDb();
    saveDb(seeded);
    return seeded;
  }
}

export function saveDb(db: GardenDb) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function withDb(update: (db: GardenDb) => GardenDb): GardenDb {
  const next = update(loadDb());
  saveDb(next);
  return next;
}

export type PlantInput = Omit<Plant, "id" | "createdAt" | "updatedAt">;

export function savePlant(input: PlantInput, plantId?: string) {
  return withDb((db) => {
    const occupant = db.plants.find(
      (p) =>
        p.rowNum === input.rowNum &&
        p.colNum === input.colNum &&
        (!plantId || p.id !== plantId),
    );

    if (occupant) {
      throw new Error(`Komórka R${input.rowNum} C${input.colNum} jest już zajęta przez: ${occupant.displayName}.`);
    }

    const ts = nowIso();
    if (plantId) {
      return {
        ...db,
        plants: db.plants.map((p) =>
          p.id === plantId
            ? {
                ...p,
                ...input,
                updatedAt: ts,
              }
            : p,
        ),
      };
    }

    return {
      ...db,
      plants: [
        ...db.plants,
        {
          id: createId(),
          ...input,
          createdAt: ts,
          updatedAt: ts,
        },
      ],
    };
  });
}

export function deletePlant(plantId: string) {
  return withDb((db) => ({
    ...db,
    plants: db.plants.filter((p) => p.id !== plantId),
    treatments: db.treatments.filter((t) => t.plantId !== plantId),
    observations: db.observations.filter((o) => o.plantId !== plantId),
  }));
}

export type GroupInput = Pick<Group, "name" | "description">;

export function saveGroup(input: GroupInput, groupId?: string) {
  return withDb((db) => {
    const normalized = input.name.trim().toLowerCase();
    const duplicate = db.groups.find(
      (g) => g.name.trim().toLowerCase() === normalized && (!groupId || g.id !== groupId),
    );

    if (duplicate) {
      throw new Error("Grupa o tej nazwie już istnieje.");
    }

    const ts = nowIso();
    if (groupId) {
      return {
        ...db,
        groups: db.groups.map((g) => (g.id === groupId ? { ...g, ...input, updatedAt: ts } : g)),
      };
    }

    return {
      ...db,
      groups: [...db.groups, { id: createId(), ...input, createdAt: ts, updatedAt: ts }],
    };
  });
}

export function deleteGroup(groupId: string) {
  return withDb((db) => ({
    ...db,
    groups: db.groups.filter((g) => g.id !== groupId),
    plants: db.plants.map((p) => (p.groupId === groupId ? { ...p, groupId: null, updatedAt: nowIso() } : p)),
    treatments: db.treatments.filter((t) => t.groupId !== groupId),
  }));
}

export type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export function saveProduct(input: ProductInput, productId?: string) {
  return withDb((db) => {
    const ts = nowIso();
    if (productId) {
      return {
        ...db,
        products: db.products.map((p) => (p.id === productId ? { ...p, ...input, updatedAt: ts } : p)),
      };
    }

    return {
      ...db,
      products: [...db.products, { id: createId(), ...input, createdAt: ts, updatedAt: ts }],
    };
  });
}

export function deleteProduct(productId: string) {
  return withDb((db) => ({
    ...db,
    products: db.products.filter((p) => p.id !== productId),
    treatments: db.treatments.map((t) =>
      t.productId === productId
        ? {
            ...t,
            productId: null,
            updatedAt: nowIso(),
          }
        : t,
    ),
  }));
}

export type TreatmentInput = Omit<Treatment, "id" | "createdAt" | "updatedAt">;

export function saveTreatment(input: TreatmentInput, treatmentId?: string) {
  return withDb((db) => {
    if (input.targetType === "plant" && !input.plantId) {
      throw new Error("Wybierz roślinę dla zabiegu.");
    }

    if (input.targetType === "group" && !input.groupId) {
      throw new Error("Wybierz grupę dla zabiegu.");
    }

    if (!input.productId && !input.productNameManual.trim()) {
      throw new Error("Wybierz produkt z listy lub wpisz nazwę ręcznie.");
    }

    const ts = nowIso();
    if (treatmentId) {
      return {
        ...db,
        treatments: db.treatments.map((t) =>
          t.id === treatmentId
            ? {
                ...t,
                ...input,
                updatedAt: ts,
              }
            : t,
        ),
      };
    }

    return {
      ...db,
      treatments: [
        ...db.treatments,
        {
          id: createId(),
          ...input,
          createdAt: ts,
          updatedAt: ts,
        },
      ],
    };
  });
}

export function deleteTreatment(treatmentId: string) {
  return withDb((db) => ({
    ...db,
    treatments: db.treatments.filter((t) => t.id !== treatmentId),
  }));
}

export type ObservationInput = Omit<Observation, "id" | "createdAt" | "updatedAt">;

export function saveObservation(input: ObservationInput, observationId?: string) {
  return withDb((db) => {
    const ts = nowIso();
    if (observationId) {
      return {
        ...db,
        observations: db.observations.map((o) =>
          o.id === observationId
            ? {
                ...o,
                ...input,
                updatedAt: ts,
              }
            : o,
        ),
      };
    }

    return {
      ...db,
      observations: [
        ...db.observations,
        {
          id: createId(),
          ...input,
          createdAt: ts,
          updatedAt: ts,
        },
      ],
    };
  });
}

export function deleteObservation(observationId: string) {
  return withDb((db) => ({
    ...db,
    observations: db.observations.filter((o) => o.id !== observationId),
  }));
}

export function findPlantName(db: GardenDb, plantId: string | null) {
  if (!plantId) return "-";
  return db.plants.find((p) => p.id === plantId)?.displayName ?? "(usunięta roślina)";
}

export function findGroupName(db: GardenDb, groupId: string | null) {
  if (!groupId) return "-";
  return db.groups.find((g) => g.id === groupId)?.name ?? "(usunięta grupa)";
}

export function findProductName(db: GardenDb, productId: string | null, manualName: string) {
  if (productId) {
    return db.products.find((p) => p.id === productId)?.name ?? "(usunięty produkt)";
  }
  return manualName || "-";
}
