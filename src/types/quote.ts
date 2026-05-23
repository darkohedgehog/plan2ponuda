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

export type ProjectMaterialDocumentCandidateSource = {
  analysisId: string;
  candidateId: string;
  confidence: string | null;
  documentName: string;
  importedAt: Date | null;
  sourceReference: string | null;
};

export type ProjectMaterial = {
  id: string;
  projectId: string;
  materialId?: string;
  manualCategory?: MaterialCategory;
  manualName?: string;
  manualUnit?: MaterialUnit;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  source: string;
  documentCandidateSource?: ProjectMaterialDocumentCandidateSource;
  material?: Material;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectMaterialOverviewItem = ProjectMaterial & {
  project: {
    clientName?: string;
    id: string;
    name: string;
  };
};

export type UserMaterialSummary = {
  manualLineCount: number;
  materialLineCount: number;
  projectCount: number;
  totalMaterialValue: string;
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

export type QuoteIndexItem = Quote & {
  project: {
    id: string;
    name: string;
    clientName?: string;
    objectType: string;
  };
};

export type QuoteExportRoom = {
  confidence: number | null;
  estimatedAreaM2: number | null;
  id: string;
  name: string;
  type: string;
  resolvedSockets: number;
  resolvedSwitches: number;
  resolvedLights: number;
  suggestedSockets: number;
  suggestedSwitches: number;
  suggestedLights: number;
};

export type QuoteExportCompany = {
  companyAddress?: string;
  companyCity?: string;
  companyCountry?: string;
  companyEmail?: string;
  companyName?: string;
  companyPhone?: string;
  companyTaxId?: string;
  fullName?: string;
};

export type QuoteExportData = {
  company: QuoteExportCompany;
  currency: string;
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
