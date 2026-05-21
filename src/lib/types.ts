export type Category = "tree" | "shrub" | "vine" | "potted";

export type TreatmentType = "spray" | "fertilization";
export type TreatmentTargetType = "plant" | "group";

export interface Group {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Plant {
  id: string;
  display_name: string;
  species: string;
  variety: string;
  original_label: string;
  category: Category;
  group_id: string | null;
  row_num: number;
  col_num: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  product_type: string;
  default_dose: string;
  default_unit: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  target_type: TreatmentTargetType;
  plant_id: string | null;
  group_id: string | null;
  treatment_type: TreatmentType;
  date: string;
  product_id: string | null;
  product_name_manual: string;
  dose: string;
  unit: string;
  reason: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Observation {
  id: string;
  plant_id: string;
  date: string;
  observation_type: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSchema {
  groups: Group[];
  plants: Plant[];
  products: Product[];
  treatments: Treatment[];
  observations: Observation[];
}
