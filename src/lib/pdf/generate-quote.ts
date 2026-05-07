import type { ProjectMaterial, QuoteExportData } from "@/types/quote";

type TextOptions = {
  bold?: boolean;
  size?: number;
};

type TableColumn = {
  align?: "left" | "right";
  label: string;
  width: number;
};

export type QuotePdfLabels = {
  fallbacks: {
    material: string;
    notSpecified: string;
  };
  fields: {
    area: string;
    client: string;
    generatedDate: string;
    objectType: string;
    project: string;
  };
  intro: string;
  objectTypes: Record<string, string>;
  roomTypes: Record<string, string>;
  sections: {
    materialList: string;
    project: string;
    roomSummary: string;
    totals: string;
  };
  tables: {
    category: string;
    lights: string;
    material: string;
    quantity: string;
    room: string;
    sockets: string;
    switches: string;
    totalPrice: string;
    type: string;
    unit: string;
    unitPrice: string;
  };
  title: string;
  totals: {
    laborCost: string;
    materialCost: string;
    subtotal: string;
    total: string;
  };
  materialCategories: Record<string, string>;
  materialUnits: Record<string, string>;
};

type GenerateQuotePdfOptions = {
  labels: QuotePdfLabels;
  locale: string;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 44;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;

class PdfDocument {
  private pages: string[][] = [];
  private page: string[] = [];
  private y = PAGE_HEIGHT - PAGE_MARGIN;

  constructor() {
    this.addPage();
  }

  addPage() {
    this.page = [];
    this.pages.push(this.page);
    this.y = PAGE_HEIGHT - PAGE_MARGIN;
  }

  addTitle(text: string) {
    this.ensureSpace(36);
    this.drawText(text, PAGE_MARGIN, this.y, { bold: true, size: 22 });
    this.y -= 34;
  }

  addSectionTitle(text: string) {
    this.ensureSpace(32);
    this.y -= 8;
    this.drawText(text, PAGE_MARGIN, this.y, { bold: true, size: 13 });
    this.y -= 16;
    this.drawLine(PAGE_MARGIN, this.y, PAGE_WIDTH - PAGE_MARGIN, this.y);
    this.y -= 14;
  }

  addKeyValue(label: string, value: string) {
    this.ensureSpace(18);
    this.drawText(label, PAGE_MARGIN, this.y, { bold: true, size: 9 });
    this.drawText(value, PAGE_MARGIN + 130, this.y, { size: 10 });
    this.y -= 16;
  }

  addParagraph(text: string) {
    this.addWrappedText(text, PAGE_MARGIN, CONTENT_WIDTH, { size: 10 });
    this.y -= 6;
  }

  addTable(columns: TableColumn[], rows: string[][]) {
    this.ensureSpace(42);
    this.drawTableRow(columns, columns.map((column) => column.label), true);

    for (const row of rows) {
      this.drawTableRow(columns, row, false);
    }

    this.y -= 6;
  }

  addTotals(rows: Array<[string, string]>) {
    const labelX = PAGE_WIDTH - PAGE_MARGIN - 190;
    const valueX = PAGE_WIDTH - PAGE_MARGIN;

    this.ensureSpace(rows.length * 18 + 12);
    this.drawLine(labelX, this.y, valueX, this.y);
    this.y -= 16;

    for (const [index, [label, value]] of rows.entries()) {
      const isTotal = index === rows.length - 1;

      this.drawText(label, labelX, this.y, {
        bold: isTotal,
        size: isTotal ? 12 : 10,
      });
      this.drawText(value, valueX, this.y, {
        align: "right",
        bold: isTotal,
        size: isTotal ? 12 : 10,
      });
      this.y -= isTotal ? 20 : 16;
    }
  }

  finish(): Uint8Array {
    const objects: string[] = [];
    objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
    objects[2] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
    objects[3] =
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";
    const pageObjectIds: number[] = [];
    let nextObjectId = 5;

    for (const page of this.pages) {
      const content = page.join("\n");
      const contentId = nextObjectId;
      const pageId = nextObjectId + 1;

      objects[contentId - 1] =
        `<< /Length ${byteLength(content)} >>\nstream\n${content}\nendstream`;
      objects[pageId - 1] = [
        "<< /Type /Page",
        "/Parent 2 0 R",
        `/MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}]`,
        "/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>",
        `/Contents ${contentId} 0 R`,
        ">>",
      ].join(" ");

      pageObjectIds.push(pageId);
      nextObjectId += 2;
    }

    objects[1] = `<< /Type /Pages /Kids [${pageObjectIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${pageObjectIds.length} >>`;

    return buildPdf(objects);
  }

  private drawTableRow(
    columns: TableColumn[],
    values: string[],
    isHeader: boolean,
  ) {
    const rowHeight = isHeader ? 22 : 20;

    this.ensureSpace(rowHeight + 6);

    if (isHeader) {
      this.drawLine(
        PAGE_MARGIN,
        this.y + 7,
        PAGE_WIDTH - PAGE_MARGIN,
        this.y + 7,
      );
    }

    let x = PAGE_MARGIN;

    for (const [index, column] of columns.entries()) {
      const value = fitText(values[index] ?? "", column.width, isHeader ? 8 : 9);
      const textX = column.align === "right" ? x + column.width - 4 : x;

      this.drawText(value, textX, this.y, {
        align: column.align,
        bold: isHeader,
        size: isHeader ? 8 : 9,
      });
      x += column.width;
    }

    this.y -= rowHeight;
    this.drawLine(
      PAGE_MARGIN,
      this.y + 8,
      PAGE_WIDTH - PAGE_MARGIN,
      this.y + 8,
    );
  }

  private addWrappedText(
    text: string,
    x: number,
    width: number,
    options: TextOptions,
  ) {
    const size = options.size ?? 10;
    const lines = wrapText(text, width, size);

    for (const line of lines) {
      this.ensureSpace(size + 6);
      this.drawText(line, x, this.y, options);
      this.y -= size + 5;
    }
  }

  private drawText(
    text: string,
    x: number,
    y: number,
    options: TextOptions & { align?: "left" | "right" } = {},
  ) {
    const size = options.size ?? 10;
    const font = options.bold ? "F2" : "F1";
    const safeText = escapePdfText(toPdfText(text));
    const textWidth = estimateTextWidth(text, size);
    const resolvedX = options.align === "right" ? x - textWidth : x;

    this.page.push(
      `BT /${font} ${size} Tf 1 0 0 1 ${formatNumber(resolvedX)} ${formatNumber(
        y,
      )} Tm (${safeText}) Tj ET`,
    );
  }

  private drawLine(x1: number, y1: number, x2: number, y2: number) {
    this.page.push(
      `0.75 w ${formatNumber(x1)} ${formatNumber(y1)} m ${formatNumber(
        x2,
      )} ${formatNumber(y2)} l S`,
    );
  }

  private ensureSpace(height: number) {
    if (this.y - height < PAGE_MARGIN) {
      this.addPage();
    }
  }
}

export async function generateQuotePdf(
  data: QuoteExportData,
  options: GenerateQuotePdfOptions,
): Promise<Uint8Array> {
  const pdf = new PdfDocument();
  const { labels, locale } = options;
  const currency = data.currency;

  pdf.addTitle(labels.title);
  pdf.addParagraph(labels.intro);
  pdf.addSectionTitle(labels.sections.project);
  pdf.addKeyValue(labels.fields.project, data.project.name);
  pdf.addKeyValue(
    labels.fields.client,
    data.project.clientName ?? labels.fallbacks.notSpecified,
  );
  pdf.addKeyValue(
    labels.fields.objectType,
    formatObjectType(data.project.objectType, labels),
  );
  pdf.addKeyValue(labels.fields.area, formatArea(data.project.areaM2, locale));
  pdf.addKeyValue(
    labels.fields.generatedDate,
    formatDate(data.generatedAt, locale),
  );

  if (data.rooms.length > 0) {
    pdf.addSectionTitle(labels.sections.roomSummary);
    pdf.addTable(
      [
        { label: labels.tables.room, width: 170 },
        { label: labels.tables.type, width: 105 },
        { align: "right", label: labels.tables.sockets, width: 70 },
        { align: "right", label: labels.tables.switches, width: 70 },
        { align: "right", label: labels.tables.lights, width: 70 },
      ],
      data.rooms.map((room) => [
        room.name,
        formatRoomType(room.type, labels),
        formatInteger(room.resolvedSockets, locale),
        formatInteger(room.resolvedSwitches, locale),
        formatInteger(room.resolvedLights, locale),
      ]),
    );
  }

  pdf.addSectionTitle(labels.sections.materialList);
  pdf.addTable(
    [
      { label: labels.tables.material, width: 165 },
      { label: labels.tables.category, width: 85 },
      { align: "right", label: labels.tables.quantity, width: 65 },
      { align: "right", label: labels.tables.unitPrice, width: 85 },
      { align: "right", label: labels.tables.totalPrice, width: 85 },
    ],
    data.materials.map((material) =>
      formatMaterialRow(material, labels, locale, currency),
    ),
  );

  pdf.addSectionTitle(labels.sections.totals);
  pdf.addTotals([
    [
      labels.totals.materialCost,
      formatMoney(data.quote.materialCost, locale, currency),
    ],
    [
      labels.totals.laborCost,
      formatMoney(data.quote.laborCost, locale, currency),
    ],
    [
      labels.totals.subtotal,
      formatMoney(data.quote.subtotal, locale, currency),
    ],
    [labels.totals.total, formatMoney(data.quote.total, locale, currency)],
  ]);

  return pdf.finish();
}

function formatMaterialRow(
  projectMaterial: ProjectMaterial,
  labels: QuotePdfLabels,
  locale: string,
  currency: string,
): string[] {
  const material = projectMaterial.material;
  const unit = material?.unit ? formatMaterialUnit(material.unit, labels) : "";

  return [
    material?.name ?? labels.fallbacks.material,
    material?.category
      ? formatMaterialCategory(material.category, labels)
      : labels.materialCategories.other,
    `${formatQuantity(projectMaterial.quantity, locale)} ${unit}`.trim(),
    formatMoney(projectMaterial.unitPrice, locale, currency),
    formatMoney(projectMaterial.totalPrice, locale, currency),
  ];
}

function buildPdf(objects: string[]): Uint8Array {
  const chunks: string[] = ["%PDF-1.4\n"];
  const offsets: number[] = [0];
  let offset = byteLength(chunks[0]);

  for (const [index, body] of objects.entries()) {
    const object = `${index + 1} 0 obj\n${body}\nendobj\n`;

    offsets.push(offset);
    chunks.push(object);
    offset += byteLength(object);
  }

  const xrefOffset = offset;
  const xrefRows = offsets
    .map((entryOffset, index) =>
      index === 0
        ? "0000000000 65535 f "
        : `${entryOffset.toString().padStart(10, "0")} 00000 n `,
    )
    .join("\n");
  const trailer = [
    `xref\n0 ${objects.length + 1}`,
    xrefRows,
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    `startxref\n${xrefOffset}`,
    "%%EOF",
  ].join("\n");

  chunks.push(trailer);

  return new TextEncoder().encode(chunks.join(""));
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function escapePdfText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function toPdfText(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/€/g, "EUR")
    .replace(/[^\x20-\x7E]/g, "-");
}

function wrapText(text: string, maxWidth: number, size: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (estimateTextWidth(nextLine, size) <= maxWidth) {
      currentLine = nextLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  return lines;
}

function estimateTextWidth(text: string, size: number): number {
  return toPdfText(text).length * size * 0.52;
}

function fitText(text: string, maxWidth: number, size: number): string {
  if (estimateTextWidth(text, size) <= maxWidth) {
    return text;
  }

  let fittedText = text;

  while (
    fittedText.length > 1 &&
    estimateTextWidth(`${fittedText}...`, size) > maxWidth
  ) {
    fittedText = fittedText.slice(0, -1);
  }

  return `${fittedText}...`;
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function formatMoney(value: string, locale: string, currency: string): string {
  const amount = Number(value);

  try {
    return new Intl.NumberFormat(locale, {
      currency,
      style: "currency",
    }).format(amount);
  } catch {
    return `${currency} ${formatDecimal(amount, locale, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    })}`;
  }
}

function formatQuantity(value: string, locale: string): string {
  const numericValue = Number(value);

  if (Number.isInteger(numericValue)) {
    return formatInteger(numericValue, locale);
  }

  return formatDecimal(numericValue, locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
}

function formatArea(value: number, locale: string): string {
  return `${formatDecimal(value, locale, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })} m2`;
}

function formatDate(value: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatInteger(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDecimal(
  value: number,
  locale: string,
  options: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

function formatObjectType(
  objectType: string,
  labels: QuotePdfLabels,
): string {
  return labels.objectTypes[objectType] ?? objectType;
}

function formatRoomType(roomType: string, labels: QuotePdfLabels): string {
  return labels.roomTypes[roomType] ?? roomType;
}

function formatMaterialCategory(
  category: string,
  labels: QuotePdfLabels,
): string {
  return labels.materialCategories[category] ?? category;
}

function formatMaterialUnit(unit: string, labels: QuotePdfLabels): string {
  return labels.materialUnits[unit] ?? unit;
}
