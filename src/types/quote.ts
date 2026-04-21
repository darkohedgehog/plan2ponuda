export type MaterialUnit = "pcs" | "m" | "set";

export type MaterialCategory =
  | "cable"
  | "socket"
  | "switch"
  | "breaker"
  | "box"
  | "panel"
  | "other";

export type Material = {
  id: string;
  code?: string;
  name: string;
  unit: MaterialUnit;
  defaultPrice: string;
  category: MaterialCategory;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectMaterial = {
  id: string;
  projectId: string;
  materialId: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  source: string;
  material?: Material;
  createdAt: Date;
  updatedAt: Date;
};

export type Quote = {
  id: string;
  projectId: string;
  laborCost: string;
  materialCost: string;
  subtotal: string;
  total: string;
  pdfPath?: string;
  createdAt: Date;
  updatedAt: Date;
};
