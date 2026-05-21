import ExcelJS from "exceljs";

import type {
  MaterialCategory,
  MaterialUnit,
  ProjectMaterial,
  QuoteExportCompany,
  QuoteExportData,
} from "../../types/quote";

type LabelMap = Record<string, string>;

type SummaryValue = Date | number | string;

export type QuoteExcelLabels = {
  companyFields: {
    address: string;
    city: string;
    country: string;
    email: string;
    fullName: string;
    name: string;
    phone: string;
    taxId: string;
  };
  fallbacks: {
    material: string;
    notSpecified: string;
  };
  fields: {
    area: string;
    category: string;
    client: string;
    code: string;
    confidence: string;
    generatedDate: string;
    laborCost: string;
    material: string;
    materialCost: string;
    objectType: string;
    project: string;
    provider: string;
    quantity: string;
    resolvedLights: string;
    resolvedSockets: string;
    resolvedSwitches: string;
    room: string;
    roomType: string;
    source: string;
    subtotal: string;
    suggestedLights: string;
    suggestedSockets: string;
    suggestedSwitches: string;
    total: string;
    totalPrice: string;
    unit: string;
    unitPrice: string;
  };
  materialCategories: Partial<Record<MaterialCategory, string>>;
  materialSources: LabelMap;
  materialUnits: Partial<Record<MaterialUnit, string>>;
  notes: {
    empty: string;
    reviewStatement: string;
  };
  objectTypes: LabelMap;
  roomTypes: LabelMap;
  sheets: {
    materials: string;
    notes: string;
    rooms: string;
    summary: string;
  };
  title: string;
};

export type GenerateQuoteExcelOptions = {
  labels: QuoteExcelLabels;
  locale: string;
};

type SummaryRow = [string, SummaryValue];

const HEADER_FILL = {
  fgColor: {
    argb: "FFE9F9FC",
  },
  pattern: "solid",
  type: "pattern",
} satisfies ExcelJS.Fill;

const TITLE_FILL = {
  fgColor: {
    argb: "FF010223",
  },
  pattern: "solid",
  type: "pattern",
} satisfies ExcelJS.Fill;

const BORDER_STYLE = {
  bottom: {
    color: {
      argb: "FFE2E8F0",
    },
    style: "thin",
  },
  left: {
    color: {
      argb: "FFE2E8F0",
    },
    style: "thin",
  },
  right: {
    color: {
      argb: "FFE2E8F0",
    },
    style: "thin",
  },
  top: {
    color: {
      argb: "FFE2E8F0",
    },
    style: "thin",
  },
} satisfies Partial<ExcelJS.Borders>;

export async function generateQuoteExcelBuffer(
  data: QuoteExportData,
  options: GenerateQuoteExcelOptions,
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Plan2Ponuda";
  workbook.created = data.generatedAt;
  workbook.modified = data.generatedAt;

  addSummarySheet(workbook, data, options);
  addMaterialsSheet(workbook, data, options.labels);
  addRoomsSheet(workbook, data, options.labels);
  addNotesSheet(workbook, data, options);

  return workbook.xlsx.writeBuffer();
}

export function getQuoteExcelFileName(projectName: string): string {
  const slug = projectName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return `quote-${slug || "project"}.xlsx`;
}

function addSummarySheet(
  workbook: ExcelJS.Workbook,
  data: QuoteExportData,
  { labels, locale }: GenerateQuoteExcelOptions,
) {
  const sheet = workbook.addWorksheet(labels.sheets.summary);
  const currencyFormat = getCurrencyFormat(data.currency);
  const summaryRows: SummaryRow[] = [
    [labels.fields.generatedDate, data.generatedAt],
    [labels.fields.project, data.project.name],
    [
      labels.fields.client,
      data.project.clientName ?? labels.fallbacks.notSpecified,
    ],
    [
      labels.fields.objectType,
      translate(labels.objectTypes, data.project.objectType),
    ],
    [labels.fields.area, data.project.areaM2],
    ...getCompanyRows(data.company, labels),
    [labels.fields.materialCost, toNumber(data.quote.materialCost)],
    [labels.fields.laborCost, toNumber(data.quote.laborCost)],
    [labels.fields.subtotal, toNumber(data.quote.subtotal)],
    [labels.fields.total, toNumber(data.quote.total)],
  ];

  sheet.mergeCells("A1:B1");
  sheet.getCell("A1").value = labels.title;
  sheet.getCell("A1").font = {
    bold: true,
    color: {
      argb: "FFFFFFFF",
    },
    size: 16,
  };
  sheet.getCell("A1").fill = TITLE_FILL;
  sheet.getCell("A1").alignment = {
    vertical: "middle",
  };
  sheet.getRow(1).height = 24;
  sheet.addRows(summaryRows);
  sheet.columns = [
    {
      key: "label",
      width: 28,
    },
    {
      key: "value",
      width: 44,
    },
  ];
  sheet.getColumn(2).alignment = {
    wrapText: true,
  };

  for (const row of sheet.getRows(2, summaryRows.length) ?? []) {
    row.getCell(1).font = {
      bold: true,
      color: {
        argb: "FF010223",
      },
    };
    row.eachCell((cell) => {
      cell.border = BORDER_STYLE;
      cell.alignment = {
        vertical: "top",
        wrapText: true,
      };
    });
  }

  const moneyRows = new Set([
    labels.fields.materialCost,
    labels.fields.laborCost,
    labels.fields.subtotal,
    labels.fields.total,
  ]);

  for (const row of sheet.getRows(2, summaryRows.length) ?? []) {
    const label = String(row.getCell(1).value ?? "");

    if (moneyRows.has(label)) {
      row.getCell(2).numFmt = currencyFormat;
    }
  }

  sheet.getCell("B2").numFmt = getDateFormat(locale);
  sheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];
}

function addMaterialsSheet(
  workbook: ExcelJS.Workbook,
  data: QuoteExportData,
  labels: QuoteExcelLabels,
) {
  const sheet = workbook.addWorksheet(labels.sheets.materials);
  const currencyFormat = getCurrencyFormat(data.currency);

  sheet.columns = [
    {
      header: labels.fields.code,
      key: "code",
      width: 16,
    },
    {
      header: labels.fields.material,
      key: "material",
      width: 32,
    },
    {
      header: labels.fields.category,
      key: "category",
      width: 18,
    },
    {
      header: labels.fields.source,
      key: "source",
      width: 16,
    },
    {
      header: labels.fields.quantity,
      key: "quantity",
      width: 14,
    },
    {
      header: labels.fields.unit,
      key: "unit",
      width: 12,
    },
    {
      header: labels.fields.unitPrice,
      key: "unitPrice",
      width: 16,
    },
    {
      header: labels.fields.totalPrice,
      key: "totalPrice",
      width: 16,
    },
  ];

  for (const material of data.materials) {
    const displayMaterial = getDisplayMaterial(
      material,
      labels.fallbacks.material,
    );

    sheet.addRow({
      category: translate(labels.materialCategories, displayMaterial.category),
      code: displayMaterial.code ?? "",
      material: displayMaterial.name,
      quantity: toNumber(material.quantity),
      source: translate(labels.materialSources, material.source),
      totalPrice: toNumber(material.totalPrice),
      unit: translate(labels.materialUnits, displayMaterial.unit),
      unitPrice: toNumber(material.unitPrice),
    });
  }

  styleTableSheet(sheet, 1);
  sheet.getColumn("G").numFmt = currencyFormat;
  sheet.getColumn("H").numFmt = currencyFormat;
}

function getDisplayMaterial(
  projectMaterial: ProjectMaterial,
  fallbackName: string,
) {
  if (projectMaterial.material) {
    return {
      category: projectMaterial.material.category,
      code: projectMaterial.material.code,
      name: projectMaterial.material.name,
      unit: projectMaterial.material.unit,
    };
  }

  return {
    category: projectMaterial.manualCategory ?? "other",
    name: projectMaterial.manualName ?? fallbackName,
    unit: projectMaterial.manualUnit ?? "pcs",
  };
}

function addRoomsSheet(
  workbook: ExcelJS.Workbook,
  data: QuoteExportData,
  labels: QuoteExcelLabels,
) {
  const sheet = workbook.addWorksheet(labels.sheets.rooms);

  sheet.columns = [
    {
      header: labels.fields.room,
      key: "room",
      width: 24,
    },
    {
      header: labels.fields.roomType,
      key: "roomType",
      width: 18,
    },
    {
      header: labels.fields.area,
      key: "area",
      width: 14,
    },
    {
      header: labels.fields.confidence,
      key: "confidence",
      width: 14,
    },
    {
      header: labels.fields.suggestedSockets,
      key: "suggestedSockets",
      width: 18,
    },
    {
      header: labels.fields.suggestedSwitches,
      key: "suggestedSwitches",
      width: 18,
    },
    {
      header: labels.fields.suggestedLights,
      key: "suggestedLights",
      width: 18,
    },
    {
      header: labels.fields.resolvedSockets,
      key: "resolvedSockets",
      width: 18,
    },
    {
      header: labels.fields.resolvedSwitches,
      key: "resolvedSwitches",
      width: 18,
    },
    {
      header: labels.fields.resolvedLights,
      key: "resolvedLights",
      width: 18,
    },
  ];

  for (const room of data.rooms) {
    sheet.addRow({
      area: room.estimatedAreaM2 ?? null,
      confidence: room.confidence ?? null,
      resolvedLights: room.resolvedLights,
      resolvedSockets: room.resolvedSockets,
      resolvedSwitches: room.resolvedSwitches,
      room: room.name,
      roomType: translate(labels.roomTypes, room.type),
      suggestedLights: room.suggestedLights,
      suggestedSockets: room.suggestedSockets,
      suggestedSwitches: room.suggestedSwitches,
    });
  }

  styleTableSheet(sheet, 1);
  sheet.getColumn("C").numFmt = "0.00";
  sheet.getColumn("D").numFmt = "0.00";
}

function addNotesSheet(
  workbook: ExcelJS.Workbook,
  data: QuoteExportData,
  { labels, locale }: GenerateQuoteExcelOptions,
) {
  const sheet = workbook.addWorksheet(labels.sheets.notes);

  sheet.columns = [
    {
      key: "label",
      width: 28,
    },
    {
      key: "value",
      width: 80,
    },
  ];
  sheet.addRows([
    [labels.title, data.project.name],
    [labels.fields.generatedDate, data.generatedAt],
    [labels.fields.provider, getCompanyDisplayName(data.company, labels)],
    [labels.notes.empty, labels.notes.reviewStatement],
  ]);
  sheet.getCell("A1").font = {
    bold: true,
  };
  sheet.getCell("B2").numFmt = getDateFormat(locale);

  for (const row of sheet.getRows(1, 4) ?? []) {
    row.eachCell((cell) => {
      cell.border = BORDER_STYLE;
      cell.alignment = {
        vertical: "top",
        wrapText: true,
      };
    });
  }
}

function getCompanyRows(
  company: QuoteExportCompany,
  labels: QuoteExcelLabels,
): SummaryRow[] {
  const rows: SummaryRow[] = [];
  const companyFields: Array<[string, string | undefined]> = [
    [labels.companyFields.name, company.companyName],
    [labels.companyFields.fullName, company.fullName],
    [labels.companyFields.email, company.companyEmail],
    [labels.companyFields.phone, company.companyPhone],
    [labels.companyFields.address, company.companyAddress],
    [labels.companyFields.city, company.companyCity],
    [labels.companyFields.country, company.companyCountry],
    [labels.companyFields.taxId, company.companyTaxId],
  ];

  for (const [label, value] of companyFields) {
    if (value) {
      rows.push([label, value]);
    }
  }

  if (rows.length === 0) {
    rows.push([labels.fields.provider, labels.fallbacks.notSpecified]);
  }

  return rows;
}

function getCompanyDisplayName(
  company: QuoteExportCompany,
  labels: QuoteExcelLabels,
): string {
  return (
    company.companyName ??
    company.fullName ??
    company.companyEmail ??
    labels.fallbacks.notSpecified
  );
}

function styleTableSheet(sheet: ExcelJS.Worksheet, headerRowNumber: number) {
  const headerRow = sheet.getRow(headerRowNumber);

  headerRow.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = {
      bold: true,
      color: {
        argb: "FF010223",
      },
    };
    cell.border = BORDER_STYLE;
    cell.alignment = {
      vertical: "middle",
      wrapText: true,
    };
  });
  headerRow.height = 24;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === headerRowNumber) {
      return;
    }

    row.eachCell((cell) => {
      cell.border = BORDER_STYLE;
      cell.alignment = {
        vertical: "top",
        wrapText: true,
      };
    });
  });

  sheet.views = [
    {
      state: "frozen",
      ySplit: headerRowNumber,
    },
  ];
  sheet.autoFilter = {
    from: {
      column: 1,
      row: headerRowNumber,
    },
    to: {
      column: sheet.columnCount,
      row: headerRowNumber,
    },
  };
}

function getCurrencyFormat(currency: string): string {
  return `#,##0.00 "${currency.replace(/"/g, "")}"`;
}

function getDateFormat(locale: string): string {
  return locale === "en" ? "mmm d, yyyy" : "d mmm yyyy";
}

function toNumber(value: string): number {
  return Number(value);
}

function translate(labels: LabelMap, value: string): string;
function translate<T extends string>(
  labels: Partial<Record<T, string>>,
  value: T,
): string;
function translate<T extends string>(
  labels: LabelMap | Partial<Record<T, string>>,
  value: T,
): string {
  return labels[value] ?? value;
}
