export type MaterialLineItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPriceCents: number;
};

export type Quote = {
  id: string;
  projectId: string;
  lineItems: MaterialLineItem[];
  totalCents: number;
};
