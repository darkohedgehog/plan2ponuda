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

export type QuoteExportRoom = {
  id: string;
  name: string;
  type: string;
  resolvedSockets: number;
  resolvedSwitches: number;
  resolvedLights: number;
};

export type QuoteExportData = {
  generatedAt: Date;
  materials: ProjectMaterial[];
  project: {
    id: string;
    name: string;
    clientName?: string;
    objectType: string;
    areaM2: number;
  };
  quote: Quote;
  rooms: QuoteExportRoom[];
};
