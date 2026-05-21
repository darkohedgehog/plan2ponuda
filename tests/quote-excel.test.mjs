import assert from "node:assert/strict";
import test from "node:test";

import ExcelJS from "exceljs";

import {
  generateQuoteExcelBuffer,
  getQuoteExcelFileName,
} from "../src/lib/excel/generate-quote.ts";

const labels = {
  companyFields: {
    address: "Address",
    city: "City",
    country: "Country",
    email: "Email",
    fullName: "Full name",
    name: "Company",
    phone: "Phone",
    taxId: "Tax ID",
  },
  fallbacks: {
    material: "Material",
    notSpecified: "Not specified",
  },
  fields: {
    area: "Area m2",
    category: "Category",
    client: "Client",
    code: "Code",
    confidence: "Confidence",
    generatedDate: "Generated date",
    laborCost: "Labor cost",
    material: "Material",
    materialCost: "Material cost",
    objectType: "Object type",
    project: "Project",
    provider: "Provider",
    quantity: "Quantity",
    resolvedLights: "Resolved lights",
    resolvedSockets: "Resolved sockets",
    resolvedSwitches: "Resolved switches",
    room: "Room",
    roomType: "Room type",
    source: "Source",
    subtotal: "Subtotal",
    suggestedLights: "Suggested lights",
    suggestedSockets: "Suggested sockets",
    suggestedSwitches: "Suggested switches",
    total: "Total",
    totalPrice: "Total price",
    unit: "Unit",
    unitPrice: "Unit price",
  },
  materialCategories: {
    cable: "Cable",
    other: "Other",
  },
  materialSources: {
    manual: "Manual",
    rule: "Rule",
  },
  materialUnits: {
    m: "m",
    pcs: "pcs",
  },
  notes: {
    empty: "No additional notes available.",
    reviewStatement: "Review quantities before ordering.",
  },
  objectTypes: {
    house: "House",
  },
  roomTypes: {
    kitchen: "Kitchen",
  },
  sheets: {
    materials: "Materials",
    notes: "Notes",
    rooms: "Rooms",
    summary: "Summary",
  },
  title: "Excel export",
};

const quoteData = {
  company: {
    companyName: "Provider Ltd",
    fullName: "Ana Provider",
  },
  currency: "EUR",
  generatedAt: new Date("2026-05-19T10:00:00.000Z"),
  materials: [
    {
      createdAt: new Date("2026-05-18T10:00:00.000Z"),
      id: "pm_1",
      material: {
        category: "cable",
        code: "CABLE-3X2.5",
        createdAt: new Date("2026-05-18T10:00:00.000Z"),
        defaultPrice: "2.5",
        id: "mat_1",
        name: "Cable 3x2.5",
        unit: "m",
        updatedAt: new Date("2026-05-18T10:00:00.000Z"),
      },
      materialId: "mat_1",
      projectId: "project_1",
      quantity: "12",
      source: "rule",
      totalPrice: "30",
      unitPrice: "2.5",
      updatedAt: new Date("2026-05-18T10:00:00.000Z"),
    },
    {
      createdAt: new Date("2026-05-18T10:00:00.000Z"),
      id: "pm_2",
      manualCategory: "other",
      manualName: "Project-only cable",
      manualUnit: "m",
      projectId: "project_1",
      quantity: "5",
      source: "manual",
      totalPrice: "25",
      unitPrice: "5",
      updatedAt: new Date("2026-05-18T10:00:00.000Z"),
    },
  ],
  project: {
    areaM2: 88,
    clientName: "Client Co",
    id: "project_1",
    name: "Family House",
    objectType: "house",
  },
  quote: {
    createdAt: new Date("2026-05-18T10:00:00.000Z"),
    id: "quote_1",
    laborCost: "1760",
    materialCost: "30",
    projectId: "project_1",
    subtotal: "1790",
    total: "1790",
    updatedAt: new Date("2026-05-18T10:00:00.000Z"),
  },
  rooms: [
    {
      confidence: 0.95,
      estimatedAreaM2: 18,
      id: "room_1",
      name: "Kitchen",
      resolvedLights: 2,
      resolvedSockets: 8,
      resolvedSwitches: 2,
      suggestedLights: 2,
      suggestedSockets: 6,
      suggestedSwitches: 2,
      type: "kitchen",
    },
  ],
};

test("generates quote workbook with summary, materials, rooms, and notes sheets", async () => {
  const buffer = await generateQuoteExcelBuffer(quoteData, {
    labels,
    locale: "en",
  });
  const workbook = new ExcelJS.Workbook();

  await workbook.xlsx.load(buffer);

  assert.deepEqual(
    workbook.worksheets.map((sheet) => sheet.name),
    ["Summary", "Materials", "Rooms", "Notes"],
  );
  assert.equal(workbook.getWorksheet("Summary")?.getCell("B3").value, "Family House");
  assert.equal(workbook.getWorksheet("Materials")?.getCell("B2").value, "Cable 3x2.5");
  assert.equal(workbook.getWorksheet("Materials")?.getCell("B3").value, "Project-only cable");
  assert.equal(workbook.getWorksheet("Materials")?.getCell("A3").value, "");
  assert.equal(workbook.getWorksheet("Materials")?.getCell("F3").value, "m");
  assert.equal(workbook.getWorksheet("Rooms")?.getCell("H2").value, 8);
});

test("creates a safe xlsx file name from the project name", () => {
  assert.equal(getQuoteExcelFileName("Kuća za Klijenta"), "quote-kuca-za-klijenta.xlsx");
});
